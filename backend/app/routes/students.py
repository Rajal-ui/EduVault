from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Request
from fastapi.responses import StreamingResponse
import csv
import io
import datetime
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.models import Student, Marksheet, FeeReceipt, ExamStatus, MiscellaneousRecord
from app.core.academic import sync_student_semester_gpa, calculate_gpa_from_marks
from app.schemas.schemas import (
    StudentCreate, StudentUpdate, StudentOut,
    MarksheetCreate, MarksheetUpdate, MarksheetOut,
    FeeReceiptCreate, FeeReceiptUpdate, FeeReceiptOut,
    ExamStatusCreate, ExamStatusUpdate, ExamStatusOut,
    MiscRecordCreate, MiscRecordUpdate, MiscRecordOut,
    MarksheetBulkCreate
)
from app.core.dependencies import require_admin, require_student, get_current_user
from app.core.security import hash_password
from app.core.audit import log_action
from app.core.notifications import create_user_notification

router = APIRouter(prefix="/students", tags=["Students"])

@router.get("/", response_model=List[StudentOut])
def get_all_students(db: Session = Depends(get_db), _=Depends(require_admin)):
    return db.query(Student).all()

@router.get("/{student_id}", response_model=StudentOut)
def get_student(student_id: str, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    if current_user["role"] == "student" and current_user["sub"] != student_id:
        raise HTTPException(status_code=403, detail="Access denied")
    student = db.query(Student).filter(Student.StudentID == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student

@router.post("/", response_model=StudentOut, status_code=201)
def create_student(request: Request, data: StudentCreate, db: Session = Depends(get_db), admin_user=Depends(require_admin)):
    existing = db.query(Student).filter(Student.StudentID == data.StudentID).first()
    if existing:
        raise HTTPException(status_code=400, detail="Student ID already exists")
    student_data = data.model_dump()
    student_data["Password"] = hash_password(data.Password)
    student = Student(**student_data)
    db.add(student)
    
    # Audit log
    log_action(
        db, 
        user_id=admin_user["sub"], 
        role=admin_user["role"], 
        action="CREATE", 
        table="Students", 
        record_id=student.StudentID, 
        new_val=data.model_dump(exclude={"Password"}),
        ip=request.client.host
    )
    
    db.commit()
    db.refresh(student)
    return student

@router.put("/{student_id}", response_model=StudentOut)
def update_student(request: Request, student_id: str, data: StudentUpdate, db: Session = Depends(get_db), admin_user=Depends(require_admin)):
    student = db.query(Student).filter(Student.StudentID == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    old_values = {field: getattr(student, field) for field in data.model_dump(exclude_unset=True).keys()}
    
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(student, field, value)
        
    log_action(
        db, 
        user_id=admin_user["sub"], 
        role=admin_user["role"], 
        action="UPDATE", 
        table="Students", 
        record_id=student_id, 
        old_val=old_values, 
        new_val=data.model_dump(exclude_none=True),
        ip=request.client.host
    )
    
    db.commit()
    db.refresh(student)
    return student

@router.delete("/{student_id}", status_code=204)
def delete_student(request: Request, student_id: str, db: Session = Depends(get_db), admin_user=Depends(require_admin)):
    student = db.query(Student).filter(Student.StudentID == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    log_action(
        db, 
        user_id=admin_user["sub"], 
        role=admin_user["role"], 
        action="DELETE", 
        table="Students", 
        record_id=student_id, 
        old_val={"Name": student.Name, "Department": student.Department}, 
        ip=request.client.host
    )
    
    db.delete(student)
    db.commit()

@router.get("/{student_id}/marks", response_model=List[MarksheetOut])
def get_marks(student_id: str, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    if current_user["role"] == "student" and current_user["sub"] != student_id:
        raise HTTPException(status_code=403, detail="Access denied")
    return db.query(Marksheet).filter(Marksheet.StudentID == student_id).all()

@router.post("/{student_id}/marks", response_model=MarksheetOut, status_code=201)
async def add_mark(request: Request, student_id: str, data: MarksheetCreate, db: Session = Depends(get_db), admin_user=Depends(require_admin)):
    mark = Marksheet(StudentID=student_id, **data.model_dump())
    db.add(mark)
    
    log_action(
        db, 
        user_id=admin_user["sub"], 
        role=admin_user["role"], 
        action="CREATE", 
        table="Marksheets", 
        record_id=f"{student_id}:{data.Subject}", 
        new_val=data.model_dump(),
        ip=request.client.host
    )
    
    await create_user_notification(
        db, 
        user_id=student_id, 
        title="New Grade Added", 
        message=f"A new grade for {data.Subject} ({data.Grade}) has been added to your profile.",
        type="grade_release"
    )
    
    db.flush() 
    sync_student_semester_gpa(db, student_id, data.Semester)
    db.commit()
    db.refresh(mark)
    return mark

@router.post("/{student_id}/marks/bulk", status_code=201)
async def bulk_add_marks(student_id: str, data: MarksheetBulkCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    # 1. Process individual marks with deduplication for the session
    processed_keys = set()
    for m_data in data.marks:
        unique_key = (m_data.Semester, m_data.Subject)
        if unique_key in processed_keys:
            continue
        processed_keys.add(unique_key)

        existing = db.query(Marksheet).filter(
            Marksheet.StudentID == student_id,
            Marksheet.Semester == m_data.Semester,
            Marksheet.Subject == m_data.Subject
        ).first()
        
        if existing:
            existing.Marks = m_data.Marks
            existing.Grade = m_data.Grade
            existing.Credits = m_data.Credits
        else:
            mark = Marksheet(StudentID=student_id, **m_data.model_dump())
            db.add(mark)
            
    # 2. Automatically recalculate and sync GPA for each semester touched
    semesters_to_sync = {m.Semester for m in data.marks}
    if data.overall_result:
        semesters_to_sync.add(data.overall_result.Semester)

    for sem in semesters_to_sync:
        sync_student_semester_gpa(db, student_id, sem)
            
    # 3. Notify student
    await create_user_notification(
        db, 
        user_id=student_id, 
        title="Term Results Updated", 
        message=f"Results for {len(semesters_to_sync)} semester(s) have been updated.",
        type="grade_release"
    )

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
        
    return {"message": "Marks updated and GPA automatically recalculated."}

@router.put("/{student_id}/marks/{semester}/{subject}", response_model=MarksheetOut)
def update_mark(student_id: str, semester: str, subject: str, data: MarksheetUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    mark = db.query(Marksheet).filter(Marksheet.StudentID == student_id, Marksheet.Semester == semester, Marksheet.Subject == subject).first()
    if not mark:
        raise HTTPException(status_code=404, detail="Mark not found")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(mark, field, value)
    
    sync_student_semester_gpa(db, student_id, semester)
    db.commit()
    db.refresh(mark)
    return mark

@router.delete("/{student_id}/marks/{semester}/{subject}", status_code=204)
def delete_mark(student_id: str, semester: str, subject: str, db: Session = Depends(get_db), _=Depends(require_admin)):
    mark = db.query(Marksheet).filter(Marksheet.StudentID == student_id, Marksheet.Semester == semester, Marksheet.Subject == subject).first()
    if not mark:
        raise HTTPException(status_code=404, detail="Mark not found")
    db.delete(mark)
    sync_student_semester_gpa(db, student_id, semester)
    db.commit()

@router.delete("/{student_id}/semesters/{semester}", status_code=204)
def delete_semester(student_id: str, semester: str, db: Session = Depends(get_db), _=Depends(require_admin)):
    """Delete ALL marks for a semester and its associated exam status record."""
    marks = db.query(Marksheet).filter(Marksheet.StudentID == student_id, Marksheet.Semester == semester).all()
    for mark in marks:
        db.delete(mark)
    exam = db.query(ExamStatus).filter(ExamStatus.StudentID == student_id, ExamStatus.Semester == semester).first()
    if exam:
        db.delete(exam)
    db.commit()

@router.put("/{student_id}/semesters/{semester}/rename", status_code=200)
def rename_semester(student_id: str, semester: str, db: Session = Depends(get_db), _=Depends(require_admin), new_name: str = ""):
    """Rename a semester across all marks and exam status."""
    if not new_name:
        raise HTTPException(status_code=400, detail="new_name query param is required")
    marks = db.query(Marksheet).filter(Marksheet.StudentID == student_id, Marksheet.Semester == semester).all()
    for mark in marks:
        mark.Semester = new_name
    exam = db.query(ExamStatus).filter(ExamStatus.StudentID == student_id, ExamStatus.Semester == semester).first()
    if exam:
        exam.Semester = new_name
    db.commit()
    return {"message": f"Semester renamed from '{semester}' to '{new_name}'"}


@router.get("/{student_id}/fees", response_model=List[FeeReceiptOut])
def get_fees(student_id: str, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    if current_user["role"] == "student" and current_user["sub"] != student_id:
        raise HTTPException(status_code=403, detail="Access denied")
    return db.query(FeeReceipt).filter(FeeReceipt.StudentID == student_id).all()

@router.post("/{student_id}/fees", response_model=FeeReceiptOut, status_code=201)
async def add_fee(student_id: str, data: FeeReceiptCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    receipt = FeeReceipt(StudentID=student_id, **data.model_dump())
    db.add(receipt)
    
    await create_user_notification(
        db, 
        user_id=student_id, 
        title="Payment Recorded", 
        message=f"Your payment of {data.Amount} for {data.FeeType} has been received.",
        type="fee_deadline"
    )
    
    db.commit()
    db.refresh(receipt)
    return receipt

@router.put("/fees/{receipt_id}", response_model=FeeReceiptOut)
def update_fee(receipt_id: str, data: FeeReceiptUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    fee = db.query(FeeReceipt).filter(FeeReceipt.ReceiptID == receipt_id).first()
    if not fee:
        raise HTTPException(status_code=404, detail="Fee receipt not found")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(fee, field, value)
    db.commit()
    db.refresh(fee)
    return fee

@router.delete("/fees/{receipt_id}", status_code=204)
def delete_fee(receipt_id: str, db: Session = Depends(get_db), _=Depends(require_admin)):
    fee = db.query(FeeReceipt).filter(FeeReceipt.ReceiptID == receipt_id).first()
    if not fee:
        raise HTTPException(status_code=404, detail="Fee receipt not found")
    db.delete(fee)
    db.commit()

@router.get("/{student_id}/exams", response_model=List[ExamStatusOut])
def get_exams(student_id: str, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    if current_user["role"] == "student" and current_user["sub"] != student_id:
        raise HTTPException(status_code=403, detail="Access denied")
    return db.query(ExamStatus).filter(ExamStatus.StudentID == student_id).all()

@router.post("/exams", response_model=ExamStatusOut, status_code=201)
def add_exam(data: ExamStatusCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    exam = ExamStatus(**data.model_dump())
    db.add(exam)
    db.commit()
    db.refresh(exam)
    return exam

@router.put("/exams/{record_id}", response_model=ExamStatusOut)
def update_exam(record_id: int, data: ExamStatusUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    exam = db.query(ExamStatus).filter(ExamStatus.ExamRecordID == record_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam record not found")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(exam, field, value)
    db.commit()
    db.refresh(exam)
    return exam

@router.delete("/exams/{record_id}", status_code=204)
def delete_exam(record_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    exam = db.query(ExamStatus).filter(ExamStatus.ExamRecordID == record_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam record not found")
    db.delete(exam)
    db.commit()

@router.get("/{student_id}/misc", response_model=List[MiscRecordOut])
def get_misc(student_id: str, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    if current_user["role"] == "student" and current_user["sub"] != student_id:
        raise HTTPException(status_code=403, detail="Access denied")
    return db.query(MiscellaneousRecord).filter(MiscellaneousRecord.StudentID == student_id).all()

@router.post("/misc", response_model=MiscRecordOut, status_code=201)
async def add_misc(data: MiscRecordCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    record = MiscellaneousRecord(**data.model_dump())
    db.add(record)
    
    # Notify student about warning or general info
    notif_type = "warning" if data.RecordType == "Warning" else "system"
    await create_user_notification(
        db, 
        user_id=data.StudentID, 
        title=f"Notification: {data.RecordType}", 
        message=data.Details if len(data.Details) < 100 else f"New {data.RecordType} record added.",
        type=notif_type
    )
    
    db.commit()
    db.refresh(record)
    return record

@router.put("/misc/{record_id}", response_model=MiscRecordOut)
def update_misc(record_id: int, data: MiscRecordUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    rec = db.query(MiscellaneousRecord).filter(MiscellaneousRecord.RecordID == record_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Miscellaneous record not found")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(rec, field, value)
    db.commit()
    db.refresh(rec)
    return rec

@router.delete("/misc/{record_id}", status_code=204)
def delete_misc(record_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    rec = db.query(MiscellaneousRecord).filter(MiscellaneousRecord.RecordID == record_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Miscellaneous record not found")
    db.delete(rec)
    db.commit()

@router.post("/bulk", status_code=201)
async def bulk_upload_students(file: UploadFile = File(...), db: Session = Depends(get_db), _=Depends(require_admin)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed")
    
    contents = await file.read()
    decoded = contents.decode('utf-8')
    reader = csv.DictReader(io.StringIO(decoded))
    
    added = 0
    errors = []
    
    for row_idx, row in enumerate(reader, start=1):
        try:
            # Check if exists
            existing = db.query(Student).filter(Student.StudentID == row.get("StudentID")).first()
            if existing:
                errors.append(f"Row {row_idx}: StudentID {row.get('StudentID')} already exists.")
                continue
                
            dob_str = row.get("DateOfBirth", "").strip()
            parsed_dob = None
            if dob_str:
                for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%m/%d/%Y", "%d/%m/%Y"):
                    try:
                        parsed_dob = datetime.datetime.strptime(dob_str, fmt).date()
                        break
                    except ValueError:
                        pass
                if not parsed_dob:
                    errors.append(f"Row {row_idx}: Could not parse date format for '{dob_str}'. Use YYYY-MM-DD.")
                    continue

            student_data = {
                "StudentID": row.get("StudentID"),
                "Name": row.get("Name"),
                "Department": row.get("Department"),
                "Year": int(row.get("Year") or 1),
                "Contact": row.get("Contact"),
                "AcademicRecord": row.get("AcademicRecord"),
                "FeeStatus": row.get("FeeStatus") or "Pending",
                "Password": hash_password(row.get("Password", "default123")),
                "DateOfBirth": parsed_dob,
                "Address": row.get("Address"),
                "ParentContact": row.get("ParentContact"),
                "StudentPhone": row.get("StudentPhone"),
            }
            student = Student(**student_data)
            db.add(student)
            added += 1
        except Exception as e:
            errors.append(f"Row {row_idx}: Error - {str(e)}")
            
    db.commit()
    return {"message": f"Successfully added {added} students.", "errors": errors}

@router.get("/export/csv")
def export_students_csv(db: Session = Depends(get_db), _=Depends(require_admin)):
    students = db.query(Student).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Headers
    writer.writerow([
        "StudentID", "Name", "Department", "Year", "Contact", 
        "AcademicRecord", "FeeStatus", "DateOfBirth", "Address", "ParentContact", "StudentPhone"
    ])
    
    for s in students:
        writer.writerow([
            s.StudentID, s.Name, s.Department, s.Year, s.Contact,
            s.AcademicRecord, s.FeeStatus, s.DateOfBirth, s.Address, s.ParentContact, s.StudentPhone
        ])
        
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=students_export.csv"}
    )


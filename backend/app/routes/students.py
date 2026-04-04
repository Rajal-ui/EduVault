from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import StreamingResponse
import csv
import io
import datetime
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.models import Student, Marksheet, FeeReceipt, ExamStatus, MiscellaneousRecord
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
def create_student(data: StudentCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    existing = db.query(Student).filter(Student.StudentID == data.StudentID).first()
    if existing:
        raise HTTPException(status_code=400, detail="Student ID already exists")
    student_data = data.model_dump()
    student_data["Password"] = hash_password(data.Password)
    student = Student(**student_data)
    db.add(student)
    db.commit()
    db.refresh(student)
    return student

@router.put("/{student_id}", response_model=StudentOut)
def update_student(student_id: str, data: StudentUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    student = db.query(Student).filter(Student.StudentID == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(student, field, value)
    db.commit()
    db.refresh(student)
    return student

@router.delete("/{student_id}", status_code=204)
def delete_student(student_id: str, db: Session = Depends(get_db), _=Depends(require_admin)):
    student = db.query(Student).filter(Student.StudentID == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    db.delete(student)
    db.commit()

@router.get("/{student_id}/marks", response_model=List[MarksheetOut])
def get_marks(student_id: str, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    if current_user["role"] == "student" and current_user["sub"] != student_id:
        raise HTTPException(status_code=403, detail="Access denied")
    return db.query(Marksheet).filter(Marksheet.StudentID == student_id).all()

@router.post("/{student_id}/marks", response_model=MarksheetOut, status_code=201)
def add_mark(student_id: str, data: MarksheetCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    mark = Marksheet(StudentID=student_id, **data.model_dump())
    db.add(mark)
    db.commit()
    db.refresh(mark)
    return mark

@router.post("/{student_id}/marks/bulk", status_code=201)
def bulk_add_marks(student_id: str, data: MarksheetBulkCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    # 1. Process individual marks
    for m_data in data.marks:
        # Overwrite logic: check for existing
        existing = db.query(Marksheet).filter(
            Marksheet.StudentID == student_id,
            Marksheet.Semester == m_data.Semester,
            Marksheet.Subject == m_data.Subject
        ).first()
        
        if existing:
            existing.Marks = m_data.Marks
            existing.Grade = m_data.Grade
        else:
            mark = Marksheet(StudentID=student_id, **m_data.model_dump())
            db.add(mark)
            
    # 2. Process overall result if provided
    if data.overall_result:
        existing_exam = db.query(ExamStatus).filter(
            ExamStatus.StudentID == student_id,
            ExamStatus.Semester == data.overall_result.Semester
        ).first()
        
        if existing_exam:
            existing_exam.GPA = data.overall_result.GPA
            existing_exam.ResultStatus = data.overall_result.ResultStatus
            existing_exam.DateReleased = data.overall_result.DateReleased
        else:
            exam = ExamStatus(**data.overall_result.model_dump())
            # Ensure StudentID matches
            exam.StudentID = student_id
            db.add(exam)
            
    db.commit()
    return {"message": "Marks and results updated successfully"}

@router.put("/{student_id}/marks/{semester}/{subject}", response_model=MarksheetOut)
def update_mark(student_id: str, semester: str, subject: str, data: MarksheetUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    mark = db.query(Marksheet).filter(Marksheet.StudentID == student_id, Marksheet.Semester == semester, Marksheet.Subject == subject).first()
    if not mark:
        raise HTTPException(status_code=404, detail="Mark not found")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(mark, field, value)
    db.commit()
    db.refresh(mark)
    return mark

@router.delete("/{student_id}/marks/{semester}/{subject}", status_code=204)
def delete_mark(student_id: str, semester: str, subject: str, db: Session = Depends(get_db), _=Depends(require_admin)):
    mark = db.query(Marksheet).filter(Marksheet.StudentID == student_id, Marksheet.Semester == semester, Marksheet.Subject == subject).first()
    if not mark:
        raise HTTPException(status_code=404, detail="Mark not found")
    db.delete(mark)
    db.commit()

@router.get("/{student_id}/fees", response_model=List[FeeReceiptOut])
def get_fees(student_id: str, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    if current_user["role"] == "student" and current_user["sub"] != student_id:
        raise HTTPException(status_code=403, detail="Access denied")
    return db.query(FeeReceipt).filter(FeeReceipt.StudentID == student_id).all()

@router.post("/{student_id}/fees", response_model=FeeReceiptOut, status_code=201)
def add_fee(student_id: str, data: FeeReceiptCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    receipt = FeeReceipt(StudentID=student_id, **data.model_dump())
    db.add(receipt)
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
def add_misc(data: MiscRecordCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    record = MiscellaneousRecord(**data.model_dump())
    db.add(record)
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


from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.models import Student, Marksheet, FeeReceipt, ExamStatus, MiscellaneousRecord
from app.schemas.schemas import (
    StudentCreate, StudentUpdate, StudentOut,
    MarksheetCreate, MarksheetOut,
    FeeReceiptCreate, FeeReceiptOut,
    ExamStatusCreate, ExamStatusOut,
    MiscRecordCreate, MiscRecordOut
)
from app.core.dependencies import require_admin, require_student, get_current_user
from app.core.security import hash_password

router = APIRouter(prefix="/students", tags=["Students"])

# ── Get all students (admin only) ─────────────────────────────────────────────
@router.get("/", response_model=List[StudentOut])
def get_all_students(db: Session = Depends(get_db), _=Depends(require_admin)):
    return db.query(Student).all()

# ── Get one student ───────────────────────────────────────────────────────────
@router.get("/{student_id}", response_model=StudentOut)
def get_student(student_id: str, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    # students can only access their own data
    if current_user["role"] == "student" and current_user["sub"] != student_id:
        raise HTTPException(status_code=403, detail="Access denied")
    student = db.query(Student).filter(Student.StudentID == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student

# ── Create student (admin only) ───────────────────────────────────────────────
@router.post("/", response_model=StudentOut, status_code=201)
def create_student(data: StudentCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    existing = db.query(Student).filter(Student.StudentID == data.StudentID).first()
    if existing:
        raise HTTPException(status_code=400, detail="Student ID already exists")
    student = Student(**data.model_dump())
    student.Password = hash_password(data.Password)
    db.add(student)
    db.commit()
    db.refresh(student)
    return student

# ── Update student (admin only) ───────────────────────────────────────────────
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

# ── Delete student (admin only) ───────────────────────────────────────────────
@router.delete("/{student_id}", status_code=204)
def delete_student(student_id: str, db: Session = Depends(get_db), _=Depends(require_admin)):
    student = db.query(Student).filter(Student.StudentID == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    db.delete(student)
    db.commit()

# ── Marksheets ────────────────────────────────────────────────────────────────
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

# ── Fee Receipts ──────────────────────────────────────────────────────────────
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

# ── Exam Status ───────────────────────────────────────────────────────────────
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

# ── Miscellaneous Records ─────────────────────────────────────────────────────
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

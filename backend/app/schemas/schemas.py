from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal


class LoginRequest(BaseModel):
    user_id: str
    password: str
    role: str  

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    role: str
    name: str


class StudentCreate(BaseModel):
    StudentID: str
    Name: str
    Department: str
    Year: int
    Contact: Optional[str] = None
    AcademicRecord: Optional[str] = None
    FeeStatus: Optional[str] = "Pending"
    Password: str
    DateOfBirth: Optional[date] = None
    Address: Optional[str] = None
    ParentContact: Optional[str] = None
    StudentPhone: Optional[str] = None

class StudentUpdate(BaseModel):
    Name: Optional[str] = None
    Department: Optional[str] = None
    Year: Optional[int] = None
    Contact: Optional[str] = None
    AcademicRecord: Optional[str] = None
    FeeStatus: Optional[str] = None
    DateOfBirth: Optional[date] = None
    Address: Optional[str] = None
    ParentContact: Optional[str] = None
    StudentPhone: Optional[str] = None

class StudentOut(BaseModel):
    StudentID: str
    Name: str
    Department: str
    Year: int
    Contact: Optional[str]
    AcademicRecord: Optional[str]
    FeeStatus: str
    DateOfBirth: Optional[date]
    Address: Optional[str]
    ParentContact: Optional[str]
    StudentPhone: Optional[str]

    class Config:
        from_attributes = True


class MarksheetCreate(BaseModel):
    Subject: str
    Semester: str = "Semester 1"
    Marks: int
    Grade: str
    Credits: int = 4

class MarksheetOut(BaseModel):
    StudentID: str
    Subject: str
    Semester: str
    Marks: int
    Grade: str
    Credits: int

    class Config:
        from_attributes = True


class FeeReceiptCreate(BaseModel):
    ReceiptID: str
    FeeType: str
    Amount: Decimal
    PaidOn: date
    TransactionDetails: Optional[str] = None
    Status: Optional[str] = "Paid"

class FeeReceiptOut(BaseModel):
    ReceiptID: str
    StudentID: str
    FeeType: str
    Amount: Decimal
    PaidOn: date
    TransactionDetails: Optional[str]
    Status: str

    class Config:
        from_attributes = True

class ExamStatusCreate(BaseModel):
    StudentID: str
    Semester: str
    GPA: Decimal
    ResultStatus: Optional[str] = "Pass"
    DateReleased: date

class ExamStatusOut(BaseModel):
    ExamRecordID: int
    StudentID: str
    Semester: str
    GPA: Decimal
    ResultStatus: str
    DateReleased: date

    class Config:
        from_attributes = True

class MiscRecordCreate(BaseModel):
    StudentID: str
    RecordType: Optional[str] = "General"
    Details: str
    RecordedBy: str
    RecordedOn: datetime

class MiscRecordOut(BaseModel):
    RecordID: int
    StudentID: str
    RecordType: str
    Details: str
    RecordedBy: str
    RecordedOn: datetime

    class Config:
        from_attributes = True

# --- Update Schemas ---
class MarksheetUpdate(BaseModel):
    Marks: Optional[int] = None
    Grade: Optional[str] = None

class FeeReceiptUpdate(BaseModel):
    FeeType: Optional[str] = None
    Amount: Optional[Decimal] = None
    PaidOn: Optional[date] = None
    TransactionDetails: Optional[str] = None
    Status: Optional[str] = None

class ExamStatusUpdate(BaseModel):
    GPA: Optional[Decimal] = None
    ResultStatus: Optional[str] = None
    DateReleased: Optional[date] = None

class MiscRecordUpdate(BaseModel):
    RecordType: Optional[str] = None
    Details: Optional[str] = None
    RecordedBy: Optional[str] = None

# --- AI Extraction & Bulk Schemas ---
class MarksheetBulkCreate(BaseModel):
    marks: List[MarksheetCreate]
    overall_result: Optional[ExamStatusCreate] = None

class AIResultsExtraction(BaseModel):
    Semester: str
    Subjects: List[MarksheetCreate]
    Overall: Optional[dict] = None  # GPA, ResultStatus, DateReleased

# --- Analytics Schemas ---
class DeptCount(BaseModel):
    name: str
    count: int

class FeeStatusCount(BaseModel):
    name: str
    count: int

class PerformanceStat(BaseModel):
    label: str
    avg_gpa: Decimal

class AnalyticsSummary(BaseModel):
    total_students: int
    dept_counts: List[DeptCount]
    fee_summary: List[FeeStatusCount]
    performance_by_dept: List[PerformanceStat]
    performance_by_year: List[PerformanceStat]

class AtRiskStudent(BaseModel):
    StudentID: str
    Name: str
    RiskScore: float
    RiskLevel: str  # High, Medium, Low
    PrimaryReasons: List[str]
    AISuggestion: Optional[str] = None

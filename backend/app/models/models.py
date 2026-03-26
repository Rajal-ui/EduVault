from sqlalchemy import Column, String, Integer, Text, Date, DateTime, Enum, DECIMAL, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base

class Admin(Base):
    __tablename__ = "Admins"

    AdminID    = Column(String(20), primary_key=True)
    Name       = Column(String(100), nullable=False)
    Department = Column(String(50))
    Contact    = Column(String(100))
    Password   = Column(String(255), nullable=False)


class Student(Base):
    __tablename__ = "Students"

    StudentID      = Column(String(20), primary_key=True)
    Name           = Column(String(100), nullable=False)
    Department     = Column(String(50), nullable=False)
    Year           = Column(Integer, nullable=False)
    Contact        = Column(String(100))
    AcademicRecord = Column(Text)
    FeeStatus      = Column(Enum("Paid", "Pending", "Overdue"), default="Pending")
    Password       = Column(String(255), nullable=False)
    DateOfBirth    = Column(Date)
    Address        = Column(String(255))
    ParentContact  = Column(String(100))

    marksheets    = relationship("Marksheet",          back_populates="student", cascade="all, delete")
    fee_receipts  = relationship("FeeReceipt",         back_populates="student", cascade="all, delete")
    exam_statuses = relationship("ExamStatus",         back_populates="student", cascade="all, delete")
    misc_records  = relationship("MiscellaneousRecord",back_populates="student", cascade="all, delete")


class Marksheet(Base):
    __tablename__ = "Marksheets"

    StudentID = Column(String(20), ForeignKey("Students.StudentID", ondelete="CASCADE"), primary_key=True)
    Subject   = Column(String(100), primary_key=True)
    Marks     = Column(Integer, nullable=False)
    Grade     = Column(String(5), nullable=False)

    student = relationship("Student", back_populates="marksheets")


class ExamStatus(Base):
    __tablename__ = "ExamStatus"

    ExamRecordID = Column(Integer, primary_key=True, autoincrement=True)
    StudentID    = Column(String(20), ForeignKey("Students.StudentID", ondelete="CASCADE"), nullable=False)
    Semester     = Column(String(20), nullable=False)
    GPA          = Column(DECIMAL(3, 2), nullable=False)
    ResultStatus = Column(Enum("Pass", "Fail", "ATKT", "Distinction"), default="Pass")
    DateReleased = Column(Date, nullable=False)

    __table_args__ = (UniqueConstraint("StudentID", "Semester"),)
    student = relationship("Student", back_populates="exam_statuses")


class FeeReceipt(Base):
    __tablename__ = "FeeReceipts"

    ReceiptID          = Column(String(20), primary_key=True)
    StudentID          = Column(String(20), ForeignKey("Students.StudentID", ondelete="CASCADE"), nullable=False)
    FeeType            = Column(String(50), nullable=False)
    Amount             = Column(DECIMAL(10, 2), nullable=False)
    PaidOn             = Column(Date, nullable=False)
    TransactionDetails = Column(Text)
    Status             = Column(Enum("Paid", "Refunded", "Cancelled"), default="Paid")

    student = relationship("Student", back_populates="fee_receipts")


class MiscellaneousRecord(Base):
    __tablename__ = "MiscellaneousRecords"

    RecordID   = Column(Integer, primary_key=True, autoincrement=True)
    StudentID  = Column(String(20), ForeignKey("Students.StudentID", ondelete="CASCADE"), nullable=False)
    RecordType = Column(Enum("Warning", "Attendance", "Leave", "General"), default="General")
    Details    = Column(Text, nullable=False)
    RecordedBy = Column(String(100), nullable=False)
    RecordedOn = Column(DateTime, nullable=False)

    student = relationship("Student", back_populates="misc_records")

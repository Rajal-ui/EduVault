from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from app.database import get_db
from app.models.models import Student, Marksheet, ExamStatus, MiscellaneousRecord
from app.schemas.schemas import AnalyticsSummary, DeptCount, FeeStatusCount, PerformanceStat, AtRiskStudent
from app.core.dependencies import require_admin
import decimal

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/summary", response_model=AnalyticsSummary)
def get_analytics_summary(db: Session = Depends(get_db), _=Depends(require_admin)):
    # 1. Total Students
    total = db.query(Student).count()

    # 2. Dept Counts
    dept_stats = db.query(Student.Department, func.count(Student.StudentID)).group_by(Student.Department).all()
    dept_counts = [DeptCount(name=d, count=c) for d, c in dept_stats]

    # 3. Fee Summary
    fee_stats = db.query(Student.FeeStatus, func.count(Student.StudentID)).group_by(Student.FeeStatus).all()
    fee_summary = [FeeStatusCount(name=f, count=c) for f, c in fee_stats]

    # 4. Performance by Dept (Avg GPA)
    perf_dept = db.query(Student.Department, func.avg(ExamStatus.GPA)).join(ExamStatus).group_by(Student.Department).all()
    performance_by_dept = [PerformanceStat(label=d, avg_gpa=round(float(g), 2)) for d, g in perf_dept if g is not None]

    # 5. Performance by Year
    perf_year = db.query(Student.Year, func.avg(ExamStatus.GPA)).join(ExamStatus).group_by(Student.Year).all()
    performance_by_year = [PerformanceStat(label=f"Year {y}", avg_gpa=round(float(g), 2)) for y, g in perf_year if g is not None]

    return AnalyticsSummary(
        total_students=total,
        dept_counts=dept_counts,
        fee_summary=fee_summary,
        performance_by_dept=performance_by_dept,
        performance_by_year=performance_by_year
    )

@router.get("/at-risk", response_model=List[AtRiskStudent])
def get_at_risk_students(db: Session = Depends(get_db), _=Depends(require_admin)):
    students = db.query(Student).all()
    at_risk_list = []

    for s in students:
        score = 0.0
        reasons = []

        # Feature 1: Fee Status
        if s.FeeStatus == "Overdue":
            score += 4.0
            reasons.append("Fee status is Overdue")
        elif s.FeeStatus == "Pending":
            score += 1.5
            reasons.append("Fee status is Pending")

        # Feature 2: Attendance/Warnings
        warnings = db.query(MiscellaneousRecord).filter(
            MiscellaneousRecord.StudentID == s.StudentID,
            MiscellaneousRecord.RecordType == "Warning"
        ).count()
        if warnings > 0:
            score += (warnings * 2.0)
            reasons.append(f"Received {warnings} academic/behavioral warnings")

        # Feature 3: Academic Performance (GPA < 6.0)
        latest_exam = db.query(ExamStatus).filter(ExamStatus.StudentID == s.StudentID).order_by(ExamStatus.DateReleased.desc()).first()
        if latest_exam:
            if latest_exam.GPA < 5.0:
                score += 5.0
                reasons.append(f"Latest GPA is very low ({latest_exam.GPA})")
            elif latest_exam.GPA < 7.0:
                score += 2.0
                reasons.append(f"Latest GPA is below average ({latest_exam.GPA})")
            
            if latest_exam.ResultStatus == "Fail":
                score += 3.0
                reasons.append("Failed in the most recent semester")

        if score >= 4.0:
            level = "High" if score >= 8.0 else "Medium"
            at_risk_list.append(AtRiskStudent(
                StudentID=s.StudentID,
                Name=s.Name,
                RiskScore=score,
                RiskLevel=level,
                PrimaryReasons=reasons,
                AISuggestion="Schedule a counseling session and monitor attendance closely."
            ))

    # Sort by risk score descending
    at_risk_list.sort(key=lambda x: x.RiskScore, reverse=True)
    return at_risk_list

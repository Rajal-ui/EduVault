from typing import List
from decimal import Decimal
import datetime
from app.models.models import Marksheet, ExamStatus

# Centralized Grading Scale Mapping
GRADE_POINTS = {
    'O': 10,
    'A+': 9,
    'A': 8,
    'B+': 7,
    'B': 6,
    'C': 5,
    'P': 4,
    'F': 0,
    'AB': 0
}

def get_grade_from_marks(marks: int) -> str:
    """
    Returns the grade based on marks score (Standard 10-point scale).
    """
    m = marks
    if m >= 90: return "O"
    if m >= 80: return "A+"
    if m >= 70: return "A"
    if m >= 60: return "B+"
    if m >= 50: return "B"
    if m >= 45: return "C"
    if m >= 40: return "P"
    return "F"

def calculate_gpa_from_marks(marks: List[Marksheet]) -> tuple:
    """
    Calculates SGPA and ResultStatus from a list of Marksheet objects.
    Ensures grades are correctly derived from marks for consistency.
    Returns: (gpa: Decimal, status: str)
    """
    if not marks:
        return Decimal("0.00"), "Fail"

    total_weighted_points = 0
    total_credits = 0
    has_fail = False

    for mark in marks:
        # Better detection: Derive grade from marks score automatically
        grade = get_grade_from_marks(mark.Marks)
        points = GRADE_POINTS.get(grade, 0)
        credits = mark.Credits or 4
        
        total_weighted_points += (points * credits)
        total_credits += credits
        
        if points < 4: # P is 4, F is 0
            has_fail = True

    if total_credits == 0:
        return Decimal("0.00"), "Fail"

    gpa = Decimal(total_weighted_points) / Decimal(total_credits)
    gpa = gpa.quantize(Decimal("0.01")) 

    # Determine status
    if has_fail:
        status = "Fail"
    elif gpa >= Decimal("8.50"):
        status = "Distinction"
    elif gpa >= Decimal("4.00"):
        status = "Pass"
    else:
        status = "Fail"

    return gpa, status

def sync_student_semester_gpa(db, student_id: str, semester: str):
    """
    Recalculates SGPA for a student for a specific semester and updates ExamStatus.
    Also synchronizes the Marksheet Grade field based on Marks for better accuracy.
    """
    marks = db.query(Marksheet).filter(
        Marksheet.StudentID == student_id,
        Marksheet.Semester == semester
    ).all()
    
    if not marks:
        # If no marks left, delete the overall entry
        existing_exam = db.query(ExamStatus).filter(
            ExamStatus.StudentID == student_id,
            ExamStatus.Semester == semester
        ).first()
        if existing_exam:
            db.delete(existing_exam)
        return

    # BETTER DETECTION: Update Grade in database if it doesn't match Marks
    for m in marks:
        derived = get_grade_from_marks(m.Marks)
        if m.Grade != derived:
            m.Grade = derived

    gpa, status = calculate_gpa_from_marks(marks)
    
    existing_exam = db.query(ExamStatus).filter(
        ExamStatus.StudentID == student_id,
        ExamStatus.Semester == semester
    ).first()
    
    if existing_exam:
        existing_exam.GPA = gpa
        existing_exam.ResultStatus = status
    else:
        # Create new record with current date if it doesn't exist
        new_exam = ExamStatus(
            StudentID=student_id,
            Semester=semester,
            GPA=gpa,
            ResultStatus=status,
            DateReleased=datetime.date.today()
        )
        db.add(new_exam)

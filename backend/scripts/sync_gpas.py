import os
import sys

# Add the project root to sys.path so we can import 'app'
sys.path.append(os.getcwd())

from app.database import SessionLocal
from app.models.models import Student, Marksheet
from app.core.academic import sync_student_semester_gpa

def run_sync():
    db = SessionLocal()
    try:
        print("Starting global GPA synchronization...")
        students = db.query(Student).all()
        total_students = len(students)
        print(f"Found {total_students} students.")

        for idx, student in enumerate(students):
            # Find all semesters for this student
            semesters = db.query(Marksheet.Semester).filter(
                Marksheet.StudentID == student.StudentID
            ).distinct().all()
            
            sem_list = [s[0] for s in semesters]
            if sem_list:
                print(f"[{idx+1}/{total_students}] Syncing {student.StudentID} ({len(sem_list)} semesters)...")
                for sem in sem_list:
                    sync_student_semester_gpa(db, student.StudentID, sem)
            
            # Commit periodically
            if idx % 10 == 0:
                db.commit()
        
        db.commit()
        print("✅ Global GPA synchronization complete.")
    except Exception as e:
        print(f"❌ ERROR during sync: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    run_sync()

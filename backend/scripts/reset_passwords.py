"""
EduVault - Password Reset Script
Run from the backend/ directory with the venv active:
  python scripts/reset_passwords.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models.models import Admin, Student, Faculty
from app.core.security import hash_password

# ── New passwords to set ──────────────────────────────────────────────────────
ADMIN_NEW_PASSWORD    = "admin123"
STUDENT_NEW_PASSWORD  = "student123"
FACULTY_NEW_PASSWORD  = "faculty123"
# ─────────────────────────────────────────────────────────────────────────────

db = SessionLocal()

print("\n" + "="*55)
print("  EduVault Password Reset")
print("="*55)

# --- Admins ---
admins = db.query(Admin).all()
print(f"\n[Admins] Found {len(admins)} account(s):")
for a in admins:
    a.Password = hash_password(ADMIN_NEW_PASSWORD)
    print(f"  ✓  {a.AdminID:20s}  →  password: {ADMIN_NEW_PASSWORD}")

# --- Students ---
students = db.query(Student).all()
print(f"\n[Students] Found {len(students)} account(s):")
for s in students:
    s.Password = hash_password(STUDENT_NEW_PASSWORD)
    print(f"  ✓  {s.StudentID:20s}  ({s.Name:25s})  →  password: {STUDENT_NEW_PASSWORD}")

# --- Faculty ---
faculties = db.query(Faculty).all()
print(f"\n[Faculty] Found {len(faculties)} account(s):")
for f in faculties:
    f.Password = hash_password(FACULTY_NEW_PASSWORD)
    print(f"  ✓  {f.FacultyID:20s}  ({f.Name:25s})  role: {f.Role:10s}  →  password: {FACULTY_NEW_PASSWORD}")

db.commit()
db.close()

print("\n" + "="*55)
print("  All passwords reset successfully!")
print("="*55 + "\n")

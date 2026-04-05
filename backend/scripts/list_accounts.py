"""
List all EduVault accounts (counts + IDs + names). Passwords are NOT shown.

Passwords are stored as bcrypt hashes — the real password cannot be read from the DB.
CLI reset script is not tracked in git. Copy the template once:
  cp scripts/reset_passwords.example.py scripts/reset_passwords.py
Then from backend/:
  python scripts/reset_passwords.py --role student --id STU001
  python scripts/reset_passwords.py --all
Or use Admin → Staff → Reset Pwd / Reset any account.

Usage:
  python scripts/list_accounts.py
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models.models import Admin, Student, Faculty

db = SessionLocal()

try:
    admins = db.query(Admin).order_by(Admin.AdminID).all()
    students = db.query(Student).order_by(Student.StudentID).all()
    faculty = db.query(Faculty).order_by(Faculty.FacultyID).all()

    print("\n" + "=" * 60)
    print("  EduVault — accounts (passwords are never stored in plain text)")
    print("=" * 60)

    print(f"\n[Admins] total: {len(admins)}")
    for a in admins:
        print(f"  • {a.AdminID:12}  {a.Name}")

    print(f"\n[Faculty / HOD] total: {len(faculty)}")
    for f in faculty:
        print(f"  • {f.FacultyID:12}  {f.Name:30}  role={f.Role}")

    print(f"\n[Students] total: {len(students)}")
    for s in students[:50]:
        print(f"  • {s.StudentID:12}  {s.Name}")
    if len(students) > 50:
        print(f"  … and {len(students) - 50} more (showing first 50)")

    print("\n" + "-" * 60)
    print("  Login checklist if you get 401:")
    print("    • Role tab must match the account (admin / student / faculty).")
    print("    • User ID must match exactly (e.g. ADM001, STU005, FAC001).")
    print("    • Forgot password: Admin UI reset, or local scripts/reset_passwords.py (from .example.py).")
    print("    • Or log in as admin and use Admin → Reset any account.")
    print("-" * 60 + "\n")
finally:
    db.close()

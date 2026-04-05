"""
TEMPLATE — copy to reset_passwords.py and run locally.

  cp scripts/reset_passwords.example.py scripts/reset_passwords.py

The file reset_passwords.py is gitignored and must not be committed.

From backend/ with venv active:

  Single account:
    python scripts/reset_passwords.py --role student --id STU001
    python scripts/reset_passwords.py --role admin --id ADM001 --password MyNewSecret

  Role defaults when --password is omitted (edit below for your environment):
    admin → admin123 | student → student123 | faculty / hod → faculty123

  Reset everyone (use with care):
    python scripts/reset_passwords.py --all
"""
import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models.models import Admin, Student, Faculty
from app.core.security import hash_password

DEFAULT_PASSWORDS = {
    "admin": "admin123",
    "student": "student123",
    "faculty": "faculty123",
    "hod": "faculty123",
}


def reset_one(db, role: str, user_id: str, new_password: str) -> bool:
    role = role.lower()
    if role == "admin":
        row = db.query(Admin).filter(Admin.AdminID == user_id).first()
        if not row:
            print(f"  ✗  No admin with ID {user_id!r}")
            return False
        row.Password = hash_password(new_password)
        print(f"  ✓  Admin {user_id}  →  password set")
        return True
    if role == "student":
        row = db.query(Student).filter(Student.StudentID == user_id).first()
        if not row:
            print(f"  ✗  No student with ID {user_id!r}")
            return False
        row.Password = hash_password(new_password)
        print(f"  ✓  Student {user_id}  ({row.Name})  →  password set")
        return True
    if role in ("faculty", "hod"):
        row = db.query(Faculty).filter(Faculty.FacultyID == user_id).first()
        if not row:
            print(f"  ✗  No faculty with ID {user_id!r}")
            return False
        row.Password = hash_password(new_password)
        print(f"  ✓  Faculty {user_id}  ({row.Name})  role={row.Role}  →  password set")
        return True
    print(f"  ✗  Unknown role {role!r} (use admin, student, faculty, or hod)")
    return False


def reset_all(db):
    print("\n[Admins]")
    for a in db.query(Admin).all():
        a.Password = hash_password(DEFAULT_PASSWORDS["admin"])
        print(f"  ✓  {a.AdminID:20s}  →  {DEFAULT_PASSWORDS['admin']}")

    print("\n[Students]")
    for s in db.query(Student).all():
        s.Password = hash_password(DEFAULT_PASSWORDS["student"])
        print(f"  ✓  {s.StudentID:20s}  ({s.Name})  →  {DEFAULT_PASSWORDS['student']}")

    print("\n[Faculty]")
    for f in db.query(Faculty).all():
        f.Password = hash_password(DEFAULT_PASSWORDS["faculty"])
        print(f"  ✓  {f.FacultyID:20s}  ({f.Name})  role={f.Role}  →  {DEFAULT_PASSWORDS['faculty']}")


def main():
    parser = argparse.ArgumentParser(description="Reset EduVault passwords.")
    parser.add_argument(
        "--all",
        action="store_true",
        help="Reset every admin, student, and faculty password to default demo values.",
    )
    parser.add_argument("--role", choices=["admin", "student", "faculty", "hod"], help="Account type")
    parser.add_argument("--id", "--user-id", dest="user_id", metavar="ID", help="Login ID (e.g. ADM001, STU005)")
    parser.add_argument("--password", "-p", dest="password", help="New password (min 6 characters). Omit to use role default.")
    args = parser.parse_args()

    if args.all:
        if args.role or args.user_id:
            parser.error("Do not combine --all with --role / --id")
        print("\n" + "=" * 55)
        print("  EduVault — reset ALL passwords")
        print("=" * 55)
        db = SessionLocal()
        try:
            reset_all(db)
            db.commit()
        finally:
            db.close()
        print("\n" + "=" * 55)
        print("  Done.")
        print("=" * 55 + "\n")
        return

    if not args.role or not args.user_id:
        parser.error("Either use --all, or provide both --role and --id (see --help)")

    new_pw = args.password or DEFAULT_PASSWORDS.get(args.role)
    if not new_pw or len(new_pw) < 6:
        parser.error("Password must be at least 6 characters (set --password or fix defaults)")

    print("\n" + "=" * 55)
    print("  EduVault — reset one password")
    print("=" * 55 + "\n")

    db = SessionLocal()
    try:
        if not reset_one(db, args.role, args.user_id.strip(), new_pw):
            sys.exit(1)
        db.commit()
    finally:
        db.close()

    print("\n" + "=" * 55)
    print("  Done.")
    print("=" * 55 + "\n")


if __name__ == "__main__":
    main()

"""
migrate_passwords.py
────────────────────
Run this ONCE to hash all existing plaintext passwords in the database.
Safe to run multiple times — skips already-hashed passwords.

Usage:
    python migrate_passwords.py
"""

import bcrypt
import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()


def is_bcrypt_hash(value: str) -> bool:
    return value.startswith("$2b$") or value.startswith("$2a$")


def get_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST", "localhost"),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "bvp_student_office")
    )


def migrate_table(cursor, conn, table: str, id_col: str):
    cursor.execute(f"SELECT {id_col}, Password FROM {table}")
    rows = cursor.fetchall()
    migrated = 0
    skipped = 0

    for row in rows:
        record_id, password = row
        if is_bcrypt_hash(password):
            skipped += 1
            continue
        hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        cursor.execute(
            f"UPDATE {table} SET Password = %s WHERE {id_col} = %s",
            (hashed, record_id)
        )
        migrated += 1

    conn.commit()
    print(f"  {table}: {migrated} hashed, {skipped} already hashed (skipped)")


def main():
    print("EduVault — Password Migration")
    print("─" * 40)
    conn = get_connection()
    cursor = conn.cursor()

    migrate_table(cursor, conn, "Admins", "AdminID")
    migrate_table(cursor, conn, "Students", "StudentID")

    cursor.close()
    conn.close()
    print("─" * 40)
    print("Done. All passwords are now bcrypt hashed.")


if __name__ == "__main__":
    main()

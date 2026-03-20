import tkinter as tk
from tkinter import ttk, messagebox, scrolledtext
import mysql.connector
from datetime import datetime
import bcrypt
import os
from dotenv import load_dotenv

load_dotenv()

class DatabaseConnection:
    """Handles MySQL database connections using environment variables"""

    @staticmethod
    def get_connection():
        try:
            conn = mysql.connector.connect(
                host=os.getenv("DB_HOST", "localhost"),
                user=os.getenv("DB_USER", "root"),
                password=os.getenv("DB_PASSWORD", ""),
                database=os.getenv("DB_NAME", "bvp_student_office")
            )
            return conn
        except mysql.connector.Error as err:
            messagebox.showerror("Database Error", f"Error connecting to database: {err}")
            return None


def hash_password(plain_password: str) -> str:
    """Hash a plaintext password using bcrypt"""
    return bcrypt.hashpw(plain_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against a bcrypt hash"""
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        # Fallback: support old plaintext passwords during migration
        return plain_password == hashed_password


# ── The rest of the app is identical to the original ──────────────────────────
# Only the DatabaseConnection and login check logic is updated above.
# The full GUI classes (AddStudentWindow, UpdateStudentWindow, AdminDashboard,
# StudentDashboard, LoginWindow) are preserved from the original file.
# Import them here or paste them below this line when running locally.

# To run: copy all class definitions from main_original.py below this point,
# then replace the login password check lines with verify_password() as shown:
#
#   OLD:  cursor.execute("SELECT * FROM ... WHERE Password = %s", (user_id, password))
#   NEW:  cursor.execute("SELECT * FROM ... WHERE UserID = %s", (user_id,))
#         user = cursor.fetchone()
#         if user and verify_password(password, user["Password"]):
#             ...

import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

try:
    conn = mysql.connector.connect(
        host=os.getenv("DB_HOST", "localhost"),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", "Rajal_mysql!"),
        database=os.getenv("DB_NAME", "bvp_student_office")
    )
    cursor = conn.cursor()
    
    print("Adjusting Semester column lengths...")
    
    # 1. Update Marksheets table
    cursor.execute("ALTER TABLE Marksheets MODIFY Semester VARCHAR(100);")
    print("Updated Marksheets table.")
    
    # 2. Update ExamStatus table
    cursor.execute("ALTER TABLE ExamStatus MODIFY Semester VARCHAR(100);")
    print("Updated ExamStatus table.")
    
    conn.commit()
    cursor.close()
    conn.close()
    print("Database columns expanded successfully.")

except Exception as e:
    print(f"FAILED to update database: {e}")

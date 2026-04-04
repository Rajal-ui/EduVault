import sys
sys.path.append('d:/eduvault/backend')
from app.database import engine
from sqlalchemy import text

try:
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE Marksheets ADD COLUMN Semester VARCHAR(20) NOT NULL DEFAULT 'Semester 1';"))
        conn.execute(text("ALTER TABLE Marksheets DROP PRIMARY KEY, ADD PRIMARY KEY (StudentID, Subject, Semester);"))
        conn.commit()
        print("Column and PK added successfully")
except Exception as e:
    print("Error (or column already exists):", e)

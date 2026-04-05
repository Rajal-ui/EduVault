import sys
import os
sys.path.append(os.getcwd())
from sqlalchemy import create_engine, text
from app.core.config import settings

DATABASE_URL = (
    f"mysql+mysqlconnector://{settings.DB_USER}:"
    f"{settings.DB_PASSWORD}@{settings.DB_HOST}/"
    f"{settings.DB_NAME}"
)

engine = create_engine(DATABASE_URL)

sql = """
CREATE TABLE IF NOT EXISTS AuditLog (
    LogID INT AUTO_INCREMENT PRIMARY KEY,
    UserID VARCHAR(20) NOT NULL,
    UserRole VARCHAR(20) NOT NULL,
    Action ENUM('CREATE', 'UPDATE', 'DELETE') NOT NULL,
    TableAffected VARCHAR(50) NOT NULL,
    RecordID VARCHAR(100) NOT NULL,
    OldValue JSON,
    NewValue JSON,
    IPAddress VARCHAR(45),
    Timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
"""

with engine.connect() as conn:
    conn.execute(text(sql))
    conn.commit()
    print("AuditLog table created successfully.")

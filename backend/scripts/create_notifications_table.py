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
CREATE TABLE IF NOT EXISTS Notifications (
    NotificationID INT AUTO_INCREMENT PRIMARY KEY,
    UserID VARCHAR(20) NOT NULL,
    Title VARCHAR(200) NOT NULL,
    Message TEXT NOT NULL,
    Type ENUM('grade_release', 'fee_deadline', 'warning', 'announcement', 'system') DEFAULT 'system',
    IsRead BOOLEAN DEFAULT FALSE,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
"""

with engine.connect() as conn:
    conn.execute(text(sql))
    conn.commit()
    print("Notifications table created successfully.")

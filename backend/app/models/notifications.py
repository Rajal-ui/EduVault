from sqlalchemy import Column, Integer, String, Enum, Boolean, DateTime, func
from app.database import Base

class Notification(Base):
    __tablename__ = "Notifications"

    NotificationID = Column(Integer, primary_key=True, autoincrement=True)
    UserID         = Column(String(20), nullable=False)
    Title          = Column(String(200), nullable=False)
    Message        = Column(String(1000), nullable=False)
    Type           = Column(Enum("grade_release", "fee_deadline", "warning", "announcement", "system"), default="system")
    IsRead         = Column(Boolean, default=False)
    CreatedAt      = Column(DateTime, server_default=func.now())

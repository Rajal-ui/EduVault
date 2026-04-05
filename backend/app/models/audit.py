from sqlalchemy import Column, Integer, String, Enum, JSON, DateTime, func
from app.database import Base

class AuditLog(Base):
    __tablename__ = "AuditLog"

    LogID         = Column(Integer, primary_key=True, autoincrement=True)
    UserID        = Column(String(20), nullable=False)
    UserRole      = Column(String(20), nullable=False)
    Action        = Column(Enum("CREATE", "UPDATE", "DELETE"), nullable=False)
    TableAffected = Column(String(50), nullable=False)
    RecordID      = Column(String(100), nullable=False)
    OldValue      = Column(JSON)
    NewValue      = Column(JSON)
    IPAddress     = Column(String(45))
    Timestamp     = Column(DateTime, server_default=func.now())

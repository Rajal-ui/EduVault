from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.audit import AuditLog
from app.core.dependencies import require_admin
import json

router = APIRouter(prefix="/audit", tags=["Audit Log"])

@router.get("/logs")
def get_all_logs(
    db: Session = Depends(get_db), 
    limit: int = 50, 
    user_id: Optional[str] = None,
    table: Optional[str] = None,
    action: Optional[str] = None,
    _=Depends(require_admin)
):
    query = db.query(AuditLog)
    if user_id:
        query = query.filter(AuditLog.UserID == user_id)
    if table:
        query = query.filter(AuditLog.TableAffected == table)
    if action:
        query = query.filter(AuditLog.Action == action)
    
    return query.order_by(AuditLog.Timestamp.desc()).limit(limit).all()

@router.get("/recent")
def get_recent_feed(db: Session = Depends(get_db), _=Depends(require_admin)):
    """
    Returns only the most essential logic for the recent activity feed.
    """
    return db.query(AuditLog).order_by(AuditLog.Timestamp.desc()).limit(15).all()

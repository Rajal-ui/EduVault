from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.notifications import Notification
from app.core.dependencies import get_current_user
from app.core.notifications_ws import manager
from app.core.security import decode_token
import json

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("/")
def get_user_notifications(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    return db.query(Notification).filter(Notification.UserID == current_user["sub"]).order_by(Notification.CreatedAt.desc()).limit(20).all()

@router.put("/{notification_id}/read")
def mark_notification_read(notification_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    notif = db.query(Notification).filter(Notification.NotificationID == notification_id, Notification.UserID == current_user["sub"]).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.IsRead = True
    db.commit()
    return {"message": "Notification marked as read"}

@router.delete("/clear")
def clear_all_notifications(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    db.query(Notification).filter(Notification.UserID == current_user["sub"]).delete()
    db.commit()
    return {"message": "All notifications cleared"}

@router.websocket("/ws/{token}")
async def websocket_endpoint(websocket: WebSocket, token: str):
    payload = decode_token(token)
    if not payload:
        await websocket.close(code=1008)
        return
    
    user_id = payload["sub"]
    await manager.connect(user_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)

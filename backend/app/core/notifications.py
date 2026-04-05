from sqlalchemy.orm import Session
from app.models.notifications import Notification
from app.core.notifications_ws import manager

async def create_user_notification(db: Session, user_id: str, title: str, message: str, type: str = "system"):
    """
    Saves a notification to the DB and pushes it via WebSocket if active.
    """
    notif = Notification(
        UserID=user_id,
        Title=title,
        Message=message,
        Type=type
    )
    db.add(notif)
    db.flush() 
    
    payload = {
        "id": notif.NotificationID,
        "title": notif.Title,
        "message": notif.Message,
        "type": notif.Type,
        "created_at": str(notif.CreatedAt)
    }
    await manager.send_personal_message(payload, user_id)
    


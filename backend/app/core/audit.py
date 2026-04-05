import datetime
from sqlalchemy.orm import Session
from app.models.audit import AuditLog

def json_serializable(data):
    """
    Recursively converts date/datetime objects to ISO strings for JSON serialization.
    """
    if isinstance(data, dict):
        return {k: json_serializable(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [json_serializable(v) for v in data]
    elif isinstance(data, (datetime.date, datetime.datetime)):
        return data.isoformat()
    return data

def log_action(db: Session, user_id: str, role: str, action: str, table: str, record_id: str, old_val: dict = None, new_val: dict = None, ip: str = None):
    """
    Saves a record of a change/action to the AuditLog table.
    """
    log = AuditLog(
        UserID=user_id,
        UserRole=role,
        Action=action,
        TableAffected=table,
        RecordID=str(record_id),
        OldValue=json_serializable(old_val),
        NewValue=json_serializable(new_val),
        IPAddress=ip
    )
    db.add(log)
    # We logic-group this with the main transaction so db.commit in the caller handles it.

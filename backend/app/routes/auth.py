from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.models.models import Admin, Student, Faculty
from app.schemas.schemas import LoginRequest, TokenResponse
from app.core.security import verify_password, hash_password, create_access_token, create_refresh_token, decode_token
from app.core.dependencies import get_current_user, require_admin

from app.core.rate_limit import limiter
from fastapi import Request

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
def login(request: Request, login_data: LoginRequest, db: Session = Depends(get_db)):
 
    if login_data.role == "admin":
        user = db.query(Admin).filter(Admin.AdminID == login_data.user_id).first()
        if not user or not verify_password(login_data.password, user.Password if isinstance(user.Password, str) else str(user.Password)):
            raise HTTPException(status_code=401, detail="Invalid Admin ID or password")
        
        data = {"sub": user.AdminID, "role": "admin", "name": str(user.Name)}
        return TokenResponse(
            access_token=create_access_token(data), 
            refresh_token=create_refresh_token(data),
            role="admin", 
            name=str(user.Name),
            user_id=user.AdminID,
        )

    elif login_data.role == "student":
        user = db.query(Student).filter(Student.StudentID == login_data.user_id).first()
        if not user or not verify_password(login_data.password, user.Password if isinstance(user.Password, str) else str(user.Password)):
            raise HTTPException(status_code=401, detail="Invalid Student ID or password")
        
        data = {"sub": user.StudentID, "role": "student", "name": str(user.Name)}
        return TokenResponse(
            access_token=create_access_token(data), 
            refresh_token=create_refresh_token(data),
            role="student", 
            name=str(user.Name),
            user_id=user.StudentID,
        )

    elif login_data.role in ["faculty", "hod"]:
        user = db.query(Faculty).filter(Faculty.FacultyID == login_data.user_id).first()
        if not user or not verify_password(login_data.password, user.Password if isinstance(user.Password, str) else str(user.Password)):
            raise HTTPException(status_code=401, detail="Invalid Faculty ID or password")
        
        db_role = str(user.Role)
        data = {"sub": user.FacultyID, "role": db_role, "name": str(user.Name)}
        return TokenResponse(
            access_token=create_access_token(data), 
            refresh_token=create_refresh_token(data),
            role=db_role, 
            name=str(user.Name),
            user_id=user.FacultyID,
        )
    
    raise HTTPException(status_code=400, detail="Invalid role")

@router.post("/refresh")
def refresh(refresh_token: str, db: Session = Depends(get_db)):
    payload = decode_token(refresh_token)
    if not payload or not payload.get("refresh"):
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    
    new_data = {"sub": payload["sub"], "role": payload["role"], "name": payload["name"]}
    return {"access_token": create_access_token(new_data), "token_type": "bearer"}


# ── Password Reset / Change ────────────────────────────────────────────────────

class ResetPasswordRequest(BaseModel):
    user_id: str
    role: str          # admin | student | faculty
    new_password: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

def _get_user_by_role(db: Session, user_id: str, role: str):
    if role == "admin":
        return db.query(Admin).filter(Admin.AdminID == user_id).first()
    elif role == "student":
        return db.query(Student).filter(Student.StudentID == user_id).first()
    elif role in ("faculty", "hod"):
        return db.query(Faculty).filter(Faculty.FacultyID == user_id).first()
    return None

@router.post("/reset-password")
def admin_reset_password(
    data: ResetPasswordRequest,
    db: Session = Depends(get_db),
    _: dict = Depends(require_admin)
):
    """Admin-only: reset ANY user's password without knowing the old one."""
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    user = _get_user_by_role(db, data.user_id, data.role)
    if not user:
        raise HTTPException(status_code=404, detail=f"User '{data.user_id}' not found")
    user.Password = hash_password(data.new_password)
    db.commit()
    return {"message": f"Password for {data.user_id} ({data.role}) has been reset successfully."}

@router.post("/change-password")
def change_own_password(
    data: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Logged-in user changes their own password (requires current password)."""
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
    user = _get_user_by_role(db, current_user["sub"], current_user["role"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not verify_password(data.current_password, user.Password):
        raise HTTPException(status_code=401, detail="Current password is incorrect")
    user.Password = hash_password(data.new_password)
    db.commit()
    return {"message": "Password changed successfully."}

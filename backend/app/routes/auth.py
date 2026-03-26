from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Admin, Student
from app.schemas.schemas import LoginRequest, TokenResponse
from app.core.security import verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    if request.role == "admin":
        user = db.query(Admin).filter(Admin.AdminID == request.user_id).first()
        if not user or not verify_password(request.password, user.Password if isinstance(user.Password, str) else str(user.Password)):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Admin ID or password"
            )
        token = create_access_token({
            "sub": user.AdminID,
            "role": "admin",
            "name": str(user.Name)
        })
        return TokenResponse(access_token=token, role="admin", name=str(user.Name))

    elif request.role == "student":
        user = db.query(Student).filter(Student.StudentID == request.user_id).first()
        if not user or not verify_password(request.password, user.Password if isinstance(user.Password, str) else str(user.Password)):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Student ID or password"
            )
        token = create_access_token({
            "sub": user.StudentID,
            "role": "student",
            "name": str(user.Name)
        })
        return TokenResponse(access_token=token, role="student", name=str(user.Name))

    else:
        raise HTTPException(status_code=400, detail="Role must be 'admin' or 'student'")

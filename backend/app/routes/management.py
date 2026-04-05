from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.models import Admin, Faculty
from app.schemas.schemas import (
    AdminCreate,
    AdminUpdate,
    AdminOut,
    FacultyCreate,
    FacultyUpdate,
    FacultyOut,
)
from app.core.dependencies import require_admin
from app.core.security import hash_password
from app.core.audit import log_action

router = APIRouter(prefix="/management", tags=["Management"])


def _faculty_role(role: str) -> str:
    r = (role or "faculty").lower()
    if r not in ("faculty", "hod"):
        raise HTTPException(status_code=400, detail="Role must be faculty or hod")
    return r


def _faculty_out(f: Faculty) -> FacultyOut:
    return FacultyOut(
        FacultyID=f.FacultyID,
        Name=f.Name,
        Department=f.Department,
        Role=str(f.Role) if f.Role is not None else "faculty",
        Contact=f.Contact,
    )


# ── Admins ────────────────────────────────────────────────────────────────────


@router.get("/admins", response_model=List[AdminOut])
def list_admins(db: Session = Depends(get_db), _=Depends(require_admin)):
    return db.query(Admin).order_by(Admin.AdminID).all()


@router.post("/admins", response_model=AdminOut, status_code=201)
def create_admin(
    request: Request,
    data: AdminCreate,
    db: Session = Depends(get_db),
    admin_user=Depends(require_admin),
):
    if db.query(Admin).filter(Admin.AdminID == data.AdminID).first():
        raise HTTPException(status_code=400, detail="Admin ID already exists")
    if len(data.Password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    row = Admin(
        AdminID=data.AdminID,
        Name=data.Name,
        Department=data.Department,
        Contact=data.Contact,
        Password=hash_password(data.Password),
    )
    db.add(row)
    log_action(
        db,
        user_id=admin_user["sub"],
        role=admin_user["role"],
        action="CREATE",
        table="Admins",
        record_id=row.AdminID,
        new_val=data.model_dump(exclude={"Password"}),
        ip=request.client.host if request.client else None,
    )
    db.commit()
    db.refresh(row)
    return row


@router.put("/admins/{admin_id}", response_model=AdminOut)
def update_admin(
    request: Request,
    admin_id: str,
    data: AdminUpdate,
    db: Session = Depends(get_db),
    admin_user=Depends(require_admin),
):
    row = db.query(Admin).filter(Admin.AdminID == admin_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Admin not found")
    old_values = {k: getattr(row, k) for k in data.model_dump(exclude_unset=True).keys()}
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(row, field, value)
    log_action(
        db,
        user_id=admin_user["sub"],
        role=admin_user["role"],
        action="UPDATE",
        table="Admins",
        record_id=admin_id,
        old_val=old_values,
        new_val=data.model_dump(exclude_none=True),
        ip=request.client.host if request.client else None,
    )
    db.commit()
    db.refresh(row)
    return row


@router.delete("/admins/{admin_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_admin(
    request: Request,
    admin_id: str,
    db: Session = Depends(get_db),
    admin_user=Depends(require_admin),
):
    row = db.query(Admin).filter(Admin.AdminID == admin_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Admin not found")
    total = db.query(Admin).count()
    if total <= 1:
        raise HTTPException(status_code=400, detail="Cannot delete the last admin account")
    log_action(
        db,
        user_id=admin_user["sub"],
        role=admin_user["role"],
        action="DELETE",
        table="Admins",
        record_id=admin_id,
        old_val={"AdminID": row.AdminID, "Name": row.Name},
        ip=request.client.host if request.client else None,
    )
    db.delete(row)
    db.commit()
    return None


# ── Faculty ───────────────────────────────────────────────────────────────────


@router.get("/faculty", response_model=List[FacultyOut])
def list_faculty(db: Session = Depends(get_db), _=Depends(require_admin)):
    rows = db.query(Faculty).order_by(Faculty.FacultyID).all()
    return [_faculty_out(f) for f in rows]


@router.post("/faculty", response_model=FacultyOut, status_code=201)
def create_faculty(
    request: Request,
    data: FacultyCreate,
    db: Session = Depends(get_db),
    admin_user=Depends(require_admin),
):
    if db.query(Faculty).filter(Faculty.FacultyID == data.FacultyID).first():
        raise HTTPException(status_code=400, detail="Faculty ID already exists")
    if len(data.Password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    role = _faculty_role(data.Role)
    row = Faculty(
        FacultyID=data.FacultyID,
        Name=data.Name,
        Department=data.Department,
        Role=role,
        Contact=data.Contact,
        Password=hash_password(data.Password),
    )
    db.add(row)
    log_action(
        db,
        user_id=admin_user["sub"],
        role=admin_user["role"],
        action="CREATE",
        table="Faculty",
        record_id=row.FacultyID,
        new_val=data.model_dump(exclude={"Password"}),
        ip=request.client.host if request.client else None,
    )
    db.commit()
    db.refresh(row)
    return _faculty_out(row)


@router.put("/faculty/{faculty_id}", response_model=FacultyOut)
def update_faculty(
    request: Request,
    faculty_id: str,
    data: FacultyUpdate,
    db: Session = Depends(get_db),
    admin_user=Depends(require_admin),
):
    row = db.query(Faculty).filter(Faculty.FacultyID == faculty_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Faculty not found")
    payload = data.model_dump(exclude_unset=True)
    if "Role" in payload and payload["Role"] is not None:
        payload["Role"] = _faculty_role(payload["Role"])
    old_values = {}
    for k in payload.keys():
        v = getattr(row, k)
        old_values[k] = str(v) if k == "Role" and v is not None else v
    for field, value in payload.items():
        if value is not None:
            setattr(row, field, value)
    log_action(
        db,
        user_id=admin_user["sub"],
        role=admin_user["role"],
        action="UPDATE",
        table="Faculty",
        record_id=faculty_id,
        old_val=old_values,
        new_val={k: (str(v) if k == "Role" else v) for k, v in payload.items() if v is not None},
        ip=request.client.host if request.client else None,
    )
    db.commit()
    db.refresh(row)
    return _faculty_out(row)


@router.delete("/faculty/{faculty_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_faculty(
    request: Request,
    faculty_id: str,
    db: Session = Depends(get_db),
    admin_user=Depends(require_admin),
):
    row = db.query(Faculty).filter(Faculty.FacultyID == faculty_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Faculty not found")
    log_action(
        db,
        user_id=admin_user["sub"],
        role=admin_user["role"],
        action="DELETE",
        table="Faculty",
        record_id=faculty_id,
        old_val={"FacultyID": row.FacultyID, "Name": row.Name},
        ip=request.client.host if request.client else None,
    )
    db.delete(row)
    db.commit()
    return None

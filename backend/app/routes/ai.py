from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.ai import parse_receipt_image, translate_natural_query, parse_marksheet_image
from app.models.models import Student
from app.core.dependencies import require_admin
import logging

router = APIRouter(prefix="/ai", tags=["AI Features"])
logger = logging.getLogger(__name__)

@router.post("/parse-marksheet")
async def ai_parse_marksheet(file: UploadFile = File(...), _=Depends(require_admin)):
    """
    AI Endpoint to parse a marksheet/result image.
    """
    try:
        contents = await file.read()
        extracted_data = await parse_marksheet_image(contents, file.content_type)
        if not extracted_data:
            raise HTTPException(status_code=500, detail="AI failed to parse the marksheet")
        return extracted_data
    except Exception as e:
        logger.error(f"AI Marks Parse Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/parse-receipt")
async def ai_parse_receipt(file: UploadFile = File(...), _=Depends(require_admin)):
    """
    AI Endpoint to parse a fee receipt image.
    """
    try:
        contents = await file.read()
        extracted_data = await parse_receipt_image(contents, file.content_type)
        if not extracted_data:
            raise HTTPException(status_code=500, detail="AI failed to parse the receipt")
        return extracted_data
    except Exception as e:
        logger.error(f"AI Parse Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/search")
async def ai_smart_search(query: str, db: Session = Depends(get_db), _=Depends(require_admin)):
    """
    AI-powered student search using natural language.
    """
    filters = await translate_natural_query(query)
    if not filters:
        # Fallback to basic keyword search if AI fails
        return db.query(Student).filter(Student.Name.contains(query)).all()

    # Dynamic SQLAlchemy query
    db_query = db.query(Student)
    
    if "Year" in filters and filters["Year"]:
        db_query = db_query.filter(Student.Year == filters["Year"])
    if "Department" in filters and filters["Department"]:
        db_query = db_query.filter(Student.Department == filters["Department"])
    if "FeeStatus" in filters and filters["FeeStatus"]:
        db_query = db_query.filter(Student.FeeStatus == filters["FeeStatus"])
    if "Name" in filters and filters["Name"]:
        db_query = db_query.filter(Student.Name.contains(filters["Name"]))

    return db_query.all()

import google.generativeai as genai
from app.core.config import settings
import json
import logging
import re

# Configure logging
logger = logging.getLogger(__name__)

# Initialize Gemini
genai.configure(api_key=settings.GEMINI_API_KEY)
model = genai.GenerativeModel('models/gemini-2.5-flash')
Base_Model = genai.GenerativeModel('models/gemini-2.5-flash')

async def parse_receipt_image(image_bytes: bytes, mime_type: str = "image/jpeg"):
    """
    Uses Gemini to extract fee receipt information from an image.
    """
    prompt = """
    Extract following details from this fee receipt image and return as a JSON object:
    - ReceiptID: string (look for Receipt No, Ref No, etc.)
    - StudentID: string (look for ID, Enrollment No, etc.)
    - FeeType: string (e.g., Tuition Fee, Library Fee, Hostel Fee)
    - Amount: number (Total amount paid)
    - PaidOn: string in YYYY-MM-DD format
    - TransactionDetails: string (Bank name, Payment mode, etc.)
    - Status: one of ["Paid", "Refunded", "Cancelled"] (Default to "Paid")

    If a field is not found, use null.
    Only return the JSON object, no other text.
    """
    
    try:
        response = model.generate_content([
            prompt,
            {"mime_type": mime_type, "data": image_bytes}
        ])
        
        text = response.text.strip()
        # Clean up Markdown formatting
        text = re.sub(r'```json\s*|\s*```', '', text).strip()
            
        data = json.loads(text)
        if "Status" in data and data["Status"]:
            data["Status"] = data["Status"].capitalize()
            if data["Status"] not in ["Paid", "Refunded", "Cancelled"]:
                data["Status"] = "Paid"
        return data
    except Exception as e:
        logger.error(f"Error parsing receipt with AI: {e}")
        return None

async def translate_natural_query(query: str):
    """
    Translates a natural language query into search filters for students.
    """
    prompt = f"""
    You are an assistant for a student management system called EduVault.
    Translate the following user query into a JSON filter object for searching students.
    
    User Query: "{query}"

    Available Fields to Filter:
    - Name: string
    - Department: string
    - Year: integer
    - FeeStatus: one of ["Paid", "Pending", "Overdue"]

    Return a JSON object with these keys if they appear in the query. 
    If a field isn't mentioned, leave it out.
    Only return the JSON object, no other text.

    Example: "Show me Year 1 IT students with pending fees"
    Output: {{"Year": 1, "Department": "IT", "FeeStatus": "Pending"}}
    """

    try:
        response = model.generate_content(prompt)
        text = response.text.strip()
        
        # Log for debugging
        print(f"Gemini Raw Response: {text}")
        
        # Clean up Markdown formatting
        text = re.sub(r'```json\s*|\s*```', '', text).strip()
        
        # Sometimes Gemini adds text around the JSON, let's try to extract just the { ... }
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            text = match.group()
            
        return json.loads(text)
    except Exception as e:
        logger.error(f"Error translating natural query: {e}")
        # Return empty dict so search fallback works
        return {}

async def parse_marksheet_image(image_bytes: bytes, mime_type: str = "image/jpeg"):
    """
    Uses Gemini to extract marksheet info (subjects, marks, semester) from an image.
    """
    prompt = """
    You are an expert at reading academic marksheets and transcripts. 
    Analyze the provided image and extract all relevant data into a structured JSON format.

    REQUIRED JSON STRUCTURE:
    {
      "Semester": "string (e.g., Semester 1, Year 2024)",
      "Subjects": [
        {
          "Subject": "string (Exact name of the subject)",
          "Marks": number (numerical marks, e.g. 85),
          "Grade": "string (A, B+, S, etc.)"
        }
      ],
      "Overall": {
        "GPA": number (numerical, e.g. 8.5),
        "ResultStatus": "Pass/Fail/ATKT/Distinction",
        "DateReleased": "YYYY-MM-DD"
      }
    }

    CRITICAL INSTRUCTIONS:
    1. Look for tables or lists containing subject names, marks, and grades.
    2. If multiple semesters are present, extract the most recent or prominent one.
    3. Return ONLY the JSON object. No preamble or explanation.
    4. If no subjects are found, return an empty list for "Subjects".
    """
    try:
        response = model.generate_content([
            prompt,
            {"mime_type": mime_type, "data": image_bytes}
        ])
        text = response.text.strip()
        print(f"DEBUG Marksheet Raw: {text}")
        text = re.sub(r'```json\s*|\s*```', '', text).strip()
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match: text = match.group()
        return json.loads(text)
    except Exception as e:
        logger.error(f"Error parsing marksheet with AI: {e}")
        print(f"DEBUG Marksheet ERROR: {str(e)}") # Exact error visibility
        return None

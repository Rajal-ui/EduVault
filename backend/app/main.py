from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, students, ai

app = FastAPI(
    title="EduVault API",
    description="AI-powered college student management platform",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(students.router)
app.include_router(ai.router)

@app.get("/")
def root():
    return {"message": "EduVault API is running", "docs": "/docs"}

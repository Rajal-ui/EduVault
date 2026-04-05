from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.core.rate_limit import limiter
from app.routes import auth, students, ai, analytics, audit, notifications

app = FastAPI(
    title="EduVault API",
    description="AI-powered college student management platform",
    version="1.0.0"
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

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
app.include_router(analytics.router)
app.include_router(audit.router)
app.include_router(notifications.router)

@app.get("/")
def root():
    return {"message": "EduVault API is running", "docs": "/docs"}

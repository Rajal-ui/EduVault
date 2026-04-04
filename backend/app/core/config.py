import os
from pydantic_settings import BaseSettings

# Find backend/ path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

class Settings(BaseSettings):
    DB_HOST: str
    DB_USER: str
    DB_PASSWORD: str
    DB_NAME: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    GEMINI_API_KEY: str

    class Config:
        env_file = os.path.join(BASE_DIR, ".env")
        case_sensitive = True

settings = Settings() # type: ignore

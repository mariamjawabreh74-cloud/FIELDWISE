import os
from pathlib import Path
from typing import List

# Read .env file manually or with basic parsing if python-dotenv is not installed
def load_env_file(filepath: Path) -> None:
    if not filepath.exists():
        return
    with open(filepath, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())

# Check backend directory and project root for .env
BASE_DIR = Path(__file__).resolve().parent
load_env_file(BASE_DIR / ".env")
load_env_file(BASE_DIR.parent / ".env")

PORT: int = int(os.getenv("PORT", "8000"))
HOST: str = os.getenv("HOST", "0.0.0.0")

raw_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000")
CORS_ORIGINS: List[str] = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]

GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
EARTHDATA_TOKEN: str = os.getenv("EARTHDATA_TOKEN", "")
CACHE_DIR: Path = Path(os.getenv("CACHE_DIR", str(BASE_DIR / "data_cache")))
CACHE_DIR.mkdir(parents=True, exist_ok=True)

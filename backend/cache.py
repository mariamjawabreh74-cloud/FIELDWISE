import json
import hashlib
import time
from pathlib import Path
from typing import Any, Optional
from backend.config import CACHE_DIR

class FileCache:
    def __init__(self, directory: Path = CACHE_DIR):
        self.directory = directory
        self.directory.mkdir(parents=True, exist_ok=True)

    def _get_path(self, key: str) -> Path:
        safe_hash = hashlib.sha256(key.encode("utf-8")).hexdigest()
        return self.directory / f"{safe_hash}.json"

    def get(self, key: str) -> Optional[Any]:
        path = self._get_path(key)
        if not path.exists():
            return None
        try:
            with open(path, "r", encoding="utf-8") as f:
                entry = json.load(f)
            expires_at = entry.get("expires_at")
            if expires_at and time.time() > expires_at:
                path.unlink(missing_ok=True)
                return None
            return entry.get("data")
        except Exception:
            return None

    def set(self, key: str, data: Any, ttl_seconds: int = 86400 * 7) -> None:
        path = self._get_path(key)
        entry = {
            "key": key,
            "created_at": time.time(),
            "expires_at": time.time() + ttl_seconds if ttl_seconds > 0 else None,
            "data": data,
        }
        try:
            temp_path = path.with_suffix(".tmp")
            with open(temp_path, "w", encoding="utf-8") as f:
                json.dump(entry, f, ensure_ascii=False)
            temp_path.replace(path)
        except Exception:
            pass

cache = FileCache()

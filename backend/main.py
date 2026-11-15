import logging
import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.config import CORS_ORIGINS
from backend.routes.catalog import router as catalog_router
from backend.routes.farms import router as farms_router
from backend.routes.analysis import router as analysis_router
from backend.routes.scenarios import router as scenarios_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("fieldwise-backend")

app = FastAPI(
    title="FIELDWISE Agroclimatic API",
    description="Evidence-based agricultural decision engine connected to NASA environmental datasets and Gemini intelligence.",
    version="1.0.0",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS if CORS_ORIGINS else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests_middleware(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    duration_ms = (time.perf_counter() - start) * 1000
    logger.info(f"{request.method} {request.url.path} -> {response.status_code} ({duration_ms:.1f}ms)")
    return response

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error processing {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"status": "error", "message": "internal_server_error", "simulated": False},
    )

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "fieldwise-backend", "simulated": False}

# Mount under /v1 (as specified in frontend API contract)
app.include_router(catalog_router, prefix="/v1")
app.include_router(farms_router, prefix="/v1")
app.include_router(analysis_router, prefix="/v1")
app.include_router(scenarios_router, prefix="/v1")

# Also mount under / for convenience
app.include_router(catalog_router)
app.include_router(farms_router)
app.include_router(analysis_router)
app.include_router(scenarios_router)

if __name__ == "__main__":
    import uvicorn
    from backend.config import HOST, PORT
    uvicorn.run("backend.main:app", host=HOST, port=PORT, reload=True)

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.database import engine, Base
import app.models  # ensure models are registered
from app.api.v1 import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database tables exist on startup
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title=f"{settings.PROJECT_NAME} Enterprise API",
    version=settings.VERSION,
    description="Real-Time Intelligent Parking Management and Dynamic Resource Allocation Platform",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred.", "error": str(exc)},
    )

@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION
    }

@app.get("/", tags=["Root"])
def root():
    return {
        "message": "Welcome to ParkNexus Enterprise Parking Operations API",
        "docs_url": "/docs",
        "openapi_url": "/openapi.json",
        "api_v1": settings.API_V1_STR
    }

# Register API routers
app.include_router(api_router, prefix=settings.API_V1_STR)

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.database import engine
from app import models
from app.routers import pets, routine_items, glucose_readings, mood_entries, routine_templates

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Fred Care API",
    description="API REST para o Fred Care - Sistema de cuidados para pets",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers with /api prefix
app.include_router(pets.router, prefix="/api", tags=["pets"])
app.include_router(routine_templates.router, prefix="/api", tags=["routine-templates"])
app.include_router(routine_items.router, prefix="/api", tags=["routine-items"])
app.include_router(glucose_readings.router, prefix="/api", tags=["glucose-readings"])
app.include_router(mood_entries.router, prefix="/api", tags=["mood-entries"])


@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.__class__.__name__,
            "message": exc.detail,
            "statusCode": exc.status_code
        }
    )


@app.get("/")
def read_root():
    return {"message": "Welcome to Fred Care API", "docs": "/docs"}


@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "fred-care-api"}

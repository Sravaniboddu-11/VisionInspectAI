from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.database.database import engine, Base

from app.routers.auth import router as auth_router
from app.routers.upload import router as upload_router
from app.routers.detection import router as detection_router
from app.routers.reports import router as reports_router


# ============================================================
# DATABASE
# ============================================================

Base.metadata.create_all(
    bind=engine
)


# ============================================================
# FASTAPI APP
# ============================================================

app = FastAPI(
    title="VisionInspectAI",
    version="1.0.0"
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "https://visioninspectai-frontend-gvzu.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# STATIC UPLOADS
# ============================================================

app.mount(
    "/uploads",
    StaticFiles(
        directory="uploads"
    ),
    name="uploads"
)


# ============================================================
# ROUTERS
# ============================================================

app.include_router(
    auth_router
)

app.include_router(
    upload_router
)

app.include_router(
    detection_router
)

app.include_router(
    reports_router
)


# ============================================================
# HOME
# ============================================================

@app.get("/")
def root():
    return {
        "message":
            "Welcome to VisionInspectAI Backend",
        "status":
            "Running Successfully"
    }
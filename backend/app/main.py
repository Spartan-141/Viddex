# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine, Base
from . import (
    models,
)  # noqa: Asegura que los modelos estén registrados antes de crear las tablas

from .routers.auth_router import router as auth_router
from .routers.movies import router as movies_router
from .routers.series import router as series_router
from .routers.seasons import router as seasons_router
from .routers.watchlist import router as watchlist_router
from .routers.admin import router as admin_router

# Crear todas las tablas al arrancar (si no existen)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="VIDDEX API",
    description="Backend local para la plataforma de streaming VIDDEX",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS — Permitir peticiones desde el frontend y dispositivos en la red local
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar routers
app.include_router(auth_router)
app.include_router(movies_router)
app.include_router(series_router)
app.include_router(seasons_router)
app.include_router(watchlist_router)
app.include_router(admin_router)


@app.get("/", tags=["Root"])
def root():
    return {"message": "VIDDEX API v2.0 — Backend Local 🚀", "docs": "/docs"}


@app.get("/health", tags=["Root"])
def health():
    return {"status": "ok"}

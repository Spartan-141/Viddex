# app/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
import os
from dotenv import load_dotenv

import unicodedata

load_dotenv()


def unaccent(text):
    if text is None:
        return None
    return "".join(
        c for c in unicodedata.normalize("NFD", text) if unicodedata.category(c) != "Mn"
    )


# SQLite por defecto. Cambiar a PostgreSQL solo editando .env:
# DATABASE_URL=postgresql://user:password@localhost/viddex
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./viddex.db")

# SQLite requiere check_same_thread=False para FastAPI (async)
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)

if DATABASE_URL.startswith("sqlite"):
    from sqlalchemy import event

    @event.listens_for(engine, "connect")
    def receive_connect(dbapi_connection, connection_record):
        dbapi_connection.create_function("unaccent", 1, unaccent)


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    """Dependencia de FastAPI para obtener la sesión de base de datos."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

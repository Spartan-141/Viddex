#!/usr/bin/env python3
"""
0_clean_db.py — Limpia todos los datos de contenido de la BD de VIDDEX.
Preserva:  users, watchlist y watch_history.
Elimina:   video_links, episodes, seasons, movies, series.

Ejecutar:  python 0_clean_db.py
"""
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal
from app.models import VideoLink, Episode, Season, Movie, Series


def main():
    db = SessionLocal()
    try:
        vl = db.query(VideoLink).delete()
        ep = db.query(Episode).delete()
        s = db.query(Season).delete()
        m = db.query(Movie).delete()
        sr = db.query(Series).delete()
        db.commit()
        print(f"✅ Limpieza completada:")
        print(f"   VideoLinks: {vl}  | Episodios: {ep}  | Temporadas: {s}")
        print(f"   Películas:  {m}   | Series: {sr}")
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    print(
        "⚠️  ADVERTENCIA: Esta acción eliminará todo el contenido de la base de datos."
    )
    confirm = input("   Escribe 'SI' para confirmar: ").strip()
    if confirm.upper() == "SI":
        main()
    else:
        print("Operación cancelada.")

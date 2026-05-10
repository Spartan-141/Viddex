from app.database import SessionLocal
from app.models import Movie, Series
from app.utils.catalog_sync import vimeus_get
import time

def fix_posters():
    db = SessionLocal()
    print("Buscando posters vacíos...")
    
    # Peliculas
    page = 1
    updated = 0
    while True:
        data = vimeus_get("/api/listing/movies", {"page": page})
        if not data: break
        items = data.get("result", [])
        if not items: break
        
        for item in items:
            tmdb_id = item.get("tmdb_id")
            if not tmdb_id: continue
            
            poster = item.get("poster") or ""
            backdrop = item.get("backdrop") or ""
            
            if poster or backdrop:
                movie = db.query(Movie).filter(Movie.tmdb_id == tmdb_id).first()
                if movie and (not movie.poster_path or not movie.backdrop_path):
                    movie.poster_path = poster
                    movie.backdrop_path = backdrop
                    updated += 1
                    
        print(f"Peliculas Pagina {page} procesada. Actualizadas: {updated}", flush=True)
        db.commit()
        if page >= data.get("pages", 1): break
        page += 1
        time.sleep(0.1)

    # Series
    page = 1
    updated_series = 0
    while True:
        data = vimeus_get("/api/listing/series", {"page": page})
        if not data: break
        items = data.get("result", [])
        if not items: break
        
        for item in items:
            tmdb_id = item.get("tmdb_id")
            if not tmdb_id: continue
            
            poster = item.get("poster") or ""
            backdrop = item.get("backdrop") or ""
            
            if poster or backdrop:
                series = db.query(Series).filter(Series.tmdb_id == tmdb_id).first()
                if series and (not series.poster_path or not series.backdrop_path):
                    series.poster_path = poster
                    series.backdrop_path = backdrop
                    updated_series += 1
                    
        print(f"Series Pagina {page} procesada. Actualizadas: {updated_series}", flush=True)
        db.commit()
        if page >= data.get("pages", 1): break
        page += 1
        time.sleep(0.1)
        
    db.close()
    print(f"Completado. Peliculas actualizadas: {updated}. Series actualizadas: {updated_series}", flush=True)

if __name__ == "__main__":
    fix_posters()

from app.database import SessionLocal
from app.models import Series
from app.utils.tmdb_sync import sync_series_episodes_from_tmdb
from app.utils.vimeus_fetcher import sync_vimeus_links_for_series

def test():
    db = SessionLocal()
    # Get the first series
    series = db.query(Series).first()
    if not series:
        print("No series found in DB.")
        return

    print(f"Testing with Series: {series.title} (ID: {series.id}, TMDB: {series.tmdb_id})")
    print(f"Current seasons: {len(series.seasons)}")

    print("Running sync_series_episodes_from_tmdb...")
    sync_series_episodes_from_tmdb(series.id, series.tmdb_id, db)
    
    db.expire(series)
    series_refreshed = db.query(Series).filter(Series.id == series.id).first()
    print(f"Seasons after sync: {len(series_refreshed.seasons)}")
    
    print("Running sync_vimeus_links_for_series...")
    sync_vimeus_links_for_series(series_refreshed.id, series_refreshed.tmdb_id, series_refreshed.content_type, db)
    
    db.close()

if __name__ == "__main__":
    test()

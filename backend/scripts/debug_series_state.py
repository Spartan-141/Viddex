import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


def check_series_data():
    print("--- Series ---")
    series = supabase.table("series").select("*").execute()
    for s in series.data:
        print(f"ID: {s['id']} | Title: {s['title']}")

    print("\n--- Seasons ---")
    seasons = supabase.table("seasons").select("*").execute()
    for s in seasons.data:
        print(
            f"ID: {s['id']} | Series ID: {s['series_id']} | Season: {s['season_number']}"
        )

    print("\n--- Episodes ---")
    episodes = supabase.table("episodes").select("*").execute()
    for e in episodes.data:
        print(
            f"ID: {e['id']} | Season ID: {e['season_id']} | Ep: {e['episode_number']} | Name: {e['name']}"
        )

    print("\n--- Video Links ---")
    links = supabase.table("video_links").select("*").execute()
    for l in links.data:
        print(
            f"ID: {l['id']} | Movie ID: {l['movie_id']} | Episode ID: {l['episode_id']} | URL: {l['stream_url'][:50]}..."
        )


if __name__ == "__main__":
    check_series_data()

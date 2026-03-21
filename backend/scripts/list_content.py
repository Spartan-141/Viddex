from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()

URL = os.getenv("SUPABASE_URL")
KEY = os.getenv("SUPABASE_KEY")

supabase = create_client(URL, KEY)


def list_movies():
    res = supabase.table("movies").select("id, title, tmdb_id").execute()
    for m in res.data:
        print(f"Movie: {m['title']} | TMDB: {m['tmdb_id']} | UUID: {m['id']}")

    res_s = supabase.table("series").select("id, title, tmdb_id").execute()
    for s in res_s.data:
        print(f"Series: {s['title']} | TMDB: {s['tmdb_id']} | UUID: {s['id']}")


if __name__ == "__main__":
    list_movies()

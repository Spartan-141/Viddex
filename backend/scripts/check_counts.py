from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()

URL = os.getenv("SUPABASE_URL")
KEY = os.getenv("SUPABASE_KEY")

supabase = create_client(URL, KEY)


def check_counts():
    movies = supabase.table("movies").select("id", count="exact").execute()
    series = supabase.table("series").select("id", count="exact").execute()
    links = supabase.table("video_links").select("id", count="exact").execute()

    print(f"Movies: {movies.count}")
    print(f"Series: {series.count}")
    print(f"Video Links: {links.count}")


if __name__ == "__main__":
    check_counts()

from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()

URL = os.getenv("SUPABASE_URL")
KEY = os.getenv("SUPABASE_KEY")

supabase = create_client(URL, KEY)


def test_insert_series():
    data = {
        "tmdb_id": 999999,
        "title": "Test Series",
        "original_title": "Test Series",
        "overview": "Test Overview",
        "status": "published",
        "content_type": "series",
    }
    print(f"Intentando insertar serie de prueba: {data}")
    try:
        res = supabase.table("series").insert(data).execute()
        print("Éxito!")
        print(res.data)
    except Exception as e:
        print(f"Fallo crítico: {e}")


if __name__ == "__main__":
    test_insert_series()

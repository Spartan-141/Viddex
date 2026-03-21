from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()

URL = os.getenv("SUPABASE_URL")
KEY = os.getenv("SUPABASE_KEY")

supabase = create_client(URL, KEY)


def check_profiles():
    print("--- Perfiles Registrados ---")
    res = supabase.table("profiles").select("*").execute()
    for row in res.data:
        print(f"ID: {row['id']} | Username: {row['username']} | Role: {row['role']}")


if __name__ == "__main__":
    check_profiles()

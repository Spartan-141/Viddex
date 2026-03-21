from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()

URL = os.getenv("SUPABASE_URL")
KEY = os.getenv("SUPABASE_KEY")  # Service role key

supabase = create_client(URL, KEY)


def list_auth_users():
    try:
        # El cliente de python soporta auth.admin si la key es service_role
        res = supabase.auth.admin.list_users()
        print("--- Usuarios en Auth ---")
        for u in res:
            print(f"Email: {u.email} | ID: {u.id}")
    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    list_auth_users()

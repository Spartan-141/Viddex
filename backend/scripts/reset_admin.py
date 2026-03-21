from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()

URL = os.getenv("SUPABASE_URL")
KEY = os.getenv("SUPABASE_KEY")

supabase = create_client(URL, KEY)


def reset_password(user_id, new_password):
    try:
        res = supabase.auth.admin.update_user_by_id(
            user_id, attributes={"password": new_password}
        )
        print(f"Password reset for user ID: {user_id}")
    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    # ID de Manuel
    reset_password("afb10a9a-3a4d-4df7-a9cb-efa21737bad4", "viddex123")

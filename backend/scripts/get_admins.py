from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()

URL = os.getenv("SUPABASE_URL")
KEY = os.getenv("SUPABASE_KEY")

supabase = create_client(URL, KEY)


def get_admin_emails():
    # En Supabase, el cliente de python no puede acceder a auth.users directamente
    # a menos que usemos rpc o una vista que lo exponga.
    # Pero podemos intentar listar perfiles y ver si hay pistas.
    # Como no puedo leer auth.users directo, intentaré ver si hay una vista de admin.

    try:
        # Intentamos una consulta SQL directa via RPC si existe
        # O simplemente leer una tabla que hayamos creado
        print("Buscando usuarios...")
        res = supabase.table("profiles").select("*").execute()
        for p in res.data:
            print(f"Profile: {p['username']} ({p['role']}) - ID: {p['id']}")
    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    get_admin_emails()

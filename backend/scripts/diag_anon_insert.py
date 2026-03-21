"""
Diagnóstico de INSERT con clave ANON — corrección de sintaxis Python client
"""

import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv(dotenv_path="../frontend/.env", override=False)

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
ANON_KEY = os.getenv("VITE_SUPABASE_ANON_KEY")

# Login con clave anon
client = create_client(SUPABASE_URL, ANON_KEY)
auth_res = client.auth.sign_in_with_password(
    {"email": "josnuelrr2003@gmail.com", "password": "SpartanSupabase141.TK"}
)
print(f"✅ Sesión: {auth_res.user.email} (role en tabla: {'admin'})")

print("\n━━━━ TEST INSERT series (como hace Movies.jsx) ━━━━")
test_data = {
    "tmdb_id": 777666,
    "title": "DIAG TEST ANON",
    "status": "published",
    "content_type": "series",
}

try:
    res = client.table("series").insert(test_data).execute()
    if res.data:
        print(f"✅ INSERT EXITOSO: ID = {res.data[0]['id']}")
        # Limpiar
        client.table("series").delete().eq("tmdb_id", 777666).execute()
        print("   (registro eliminado)")
    else:
        print(f"⚠️  Sin datos retornados. Response: {res}")
except Exception as e:
    print(f"❌ INSERT FALLÓ: {e}")

print("\n━━━━ TEST INSERT movies (como hace Movies.jsx) ━━━━")
test_movie = {
    "tmdb_id": 555444,
    "title": "DIAG TEST MOVIE",
    "status": "published",
    "quality": "HD",
}
try:
    res = client.table("movies").insert(test_movie).execute()
    if res.data:
        print(f"✅ INSERT EXITOSO: ID = {res.data[0]['id']}")
        client.table("movies").delete().eq("tmdb_id", 555444).execute()
        print("   (registro eliminado)")
    else:
        print(f"⚠️  Sin datos. Response: {res}")
except Exception as e:
    print(f"❌ INSERT FALLÓ: {e}")

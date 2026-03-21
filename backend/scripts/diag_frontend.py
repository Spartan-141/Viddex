"""
Diagnóstico completo de la conexión Supabase desde el lado del FRONTEND.
Simula exactamente lo que hace la app React: login con clave ANON,
lectura de datos públicos y validación de perfil de administrador.
"""

import os, asyncio
from supabase import create_client
from dotenv import load_dotenv

load_dotenv(dotenv_path="../frontend/.env.local", override=False)
load_dotenv(dotenv_path="../frontend/.env", override=False)

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
ANON_KEY = os.getenv("VITE_SUPABASE_ANON_KEY")

print(f"URL:  {SUPABASE_URL}")
print(f"KEY:  {ANON_KEY[:30]}...\n")

# --- Paso 1: Intentar login con clave anon ---
print("━━━━ PASO 1: Login con clave anon ━━━━")
try:
    client = create_client(SUPABASE_URL, ANON_KEY)
    auth_res = client.auth.sign_in_with_password(
        {"email": "josnuelrr2003@gmail.com", "password": "SpartanSupabase141.TK"}
    )
    user = auth_res.user
    session = auth_res.session
    print(f"✅ Login exitoso — ID: {user.id}")
    print(f"   Email: {user.email}")
    print(f"   Confirmado: {user.email_confirmed_at is not None}")
    print(f"   Token (anon): {session.access_token[:40]}...")
except Exception as e:
    print(f"❌ LOGIN FALLÓ: {e}")
    print("\n⚠️  CAUSA PROBABLE: Email no confirmado o contraseña incorrecta.")
    print(
        "    Solución: Desactivar 'Email Confirmations' en Supabase > Auth > Settings"
    )
    exit(1)

# --- Paso 2: Leer perfil del usuario ---
print("\n━━━━ PASO 2: Leer perfil (como el AuthContext) ━━━━")
try:
    res = client.table("profiles").select("*").eq("id", user.id).single().execute()
    print(f"✅ Perfil cargado: username={res.data['username']} role={res.data['role']}")
except Exception as e:
    print(f"❌ No se pudo leer el perfil: {e}")

# --- Paso 3: Leer películas públicas ---
print("\n━━━━ PASO 3: Leer películas (datos públicos) ━━━━")
try:
    res = client.table("movies").select("id, title").execute()
    print(f"✅ Se recuperaron {len(res.data)} películas")
except Exception as e:
    print(f"❌ No se pudo leer movies: {e}")

# --- Paso 4: Intentar insertar una serie (como hace el CMS) ---
print("\n━━━━ PASO 4: Insertar serie (como hace el CMS) ━━━━")
try:
    test_data = {
        "tmdb_id": 888777,
        "title": "DIAGNOSE TEST",
        "status": "published",
        "content_type": "series",
    }
    res = client.table("series").insert(test_data).select().execute()
    print(f"✅ Insert exitoso: {res.data[0]['id']}")
    # Limpieza
    client.table("series").delete().eq("tmdb_id", 888777).execute()
    print("   (registro de prueba eliminado)")
except Exception as e:
    print(f"❌ INSERT FALLÓ: {e}")
    print("   CAUSA: El usuario autenticado no tiene permiso de INSERT.")

print("\n━━━━ Diagnóstico completado ━━━━")

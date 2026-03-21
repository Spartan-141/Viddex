# reset_db.py

import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv(
    "SUPABASE_SERVICE_ROLE_KEY"
)  # Necesitamos service_role para estas operaciones

if not SUPABASE_KEY:
    print(
        "❌ ERROR: Para resetear la DB necesitas SUPABASE_SERVICE_ROLE_KEY en el .env de backend."
    )
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def reset_database():
    print("🧹 Iniciando limpieza de base de datos...")

    # Lista de tablas a limpiar (en orden inverso de dependencia para evitar errores de FK)
    tables = [
        "watch_history",
        "watchlist",
        "video_links",
        "episodes",
        "seasons",
        "series",
        "movies",
        "reports",
        "profiles",
    ]

    for table in tables:
        print(f"  - Vaciando tabla: {table}...", end="", flush=True)
        try:
            # En Supabase Python, una forma de vaciar es borrar con un filtro que siempre sea cierto
            # O simplemente usar rpc si tenemos una función SQL
            # Aquí usaremos delete().neq("id", "00000000-0000-0000-0000-000000000000")
            supabase.table(table).delete().neq(
                "id", "00000000-0000-0000-0000-000000000000"
            ).execute()
            print(" ✅")
        except Exception as e:
            print(f" ❌ (Error: {e})")

    print("\n✨ Base de datos lista (vacía pero con estructura mantenida).")
    print(
        "💡 Nota: Si quieres borrar la estructura completa y re-ejecutar el schema.sql, es mejor hacerlo desde el SQL Editor de Supabase."
    )


if __name__ == "__main__":
    confirm = input(
        "⚠️ ¿ESTÁS SEGURO? Esto borrará TODO el contenido (películas, series, links...). (y/n): "
    )
    if confirm.lower() == "y":
        reset_database()
    else:
        print("Operación cancelada.")

#!/usr/bin/env python3
"""
diag_vimeus.py — Diagnóstico rápido de la API de Vimeus.
Ejecutar: python diag_vimeus.py
"""
import os, sys, json, requests

sys.path.insert(0, os.path.dirname(__file__))
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("VIMEUS_API_KEY", "")
VIEW_KEY = os.getenv("VIMEUS_VIEW_KEY", "")

print(f"=== Diagnóstico API Vimeus ===")
print(f"API_KEY  : {API_KEY[:15]}..." if API_KEY else "API_KEY  : ❌ VACÍA")
print(f"VIEW_KEY : {VIEW_KEY[:15]}..." if VIEW_KEY else "VIEW_KEY : ❌ VACÍA")
print()

endpoints = [
    "https://vimeus.com/api/listing/movies",
    "https://vimeus.com/api/listing/series",
]

for url in endpoints:
    print(f"→ GET {url}")
    try:
        r = requests.get(
            url,
            headers={"X-API-Key": API_KEY, "Accept": "application/json"},
            timeout=15,
        )
        print(f"  STATUS  : {r.status_code}")
        print(f"  HEADERS : Content-Type={r.headers.get('Content-Type','?')}")
        try:
            body = r.json()
            print(f"  JSON keys: {list(body.keys())}")
            data = body.get("data")
            if isinstance(data, dict):
                print(f"  data keys: {list(data.keys())}")
                items_key = "movies" if "movies" in data else list(data.keys())
                if isinstance(items_key, list):
                    print(f"  Items: (ninguno de los keys esperados)")
                else:
                    items = data.get(items_key, [])
                    print(f"  {items_key}: {len(items)} items")
                    if items:
                        print(
                            f"  Primer item: {json.dumps(items[0], indent=4, ensure_ascii=False)}"
                        )
            else:
                print(f"  data (crudo): {str(data)[:200]}")
            if body.get("error"):
                print(f"  ❌ Error de API: {body.get('message')}")
        except Exception as e:
            print(f"  Error parseando JSON: {e}")
            print(f"  Respuesta cruda (primeros 300): {r.text[:300]}")
    except Exception as e:
        print(f"  ❌ Error de conexión: {e}")
    print()

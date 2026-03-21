# app/utils/security.py
import jwt
import os
import time
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("STREAMING_SECRET_KEY", "default-fallback-secret-key")
ALGORITHM = "HS256"


def create_streaming_token(video_link_id: str, minutes: int = 1440):
    """
    Crea un token firmado para un video específico.
    Por defecto expira en 24 horas.
    """
    expire = int(time.time()) + (minutes * 60)
    payload = {"vid": video_link_id, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def get_signed_url(video_link_id: str):
    """
    Genera la URL completa firmada para el streaming.
    """
    BRIDGE_BASE_URL = os.getenv("BRIDGE_BASE_URL", "http://localhost:8000")
    token = create_streaming_token(video_link_id)
    return f"{BRIDGE_BASE_URL}/stream/{video_link_id}?token={token}"


def verify_streaming_token(token: str, video_link_id: str):
    """
    Verifica si el token es válido para el video solicitado.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("vid") == video_link_id
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return False

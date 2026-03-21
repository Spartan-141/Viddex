# bot.py (Telethon Version - Generador Pro)

import os
import asyncio
from telethon import TelegramClient, events
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import Base, VideoLink
from app.utils.security import create_streaming_token
import uuid

load_dotenv()

# Configuración Telegram
API_ID = int(os.getenv("TELEGRAM_API_ID"))
API_HASH = os.getenv("TELEGRAM_API_HASH")
BOT_TOKEN = os.getenv("BOT_TOKEN")
BRIDGE_BASE_URL = os.getenv("BRIDGE_BASE_URL", "http://localhost:8000")

# Configuración Base de Datos
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./viddex.db")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Cliente Telethon
client = TelegramClient("viddex_bot_v3", API_ID, API_HASH).start(bot_token=BOT_TOKEN)


def gen_uuid():
    return str(uuid.uuid4())


@client.on(events.NewMessage(pattern="/start", incoming=True))
async def start_handler(event):
    await event.respond(
        "👋 **¡Bienvenido al Generador VIDDEX Pro!**\n\n"
        "Envía un video directamente aquí para obtener un enlace de streaming seguro y persistente."
    )


@client.on(events.NewMessage(incoming=True))
async def media_handler(event):
    # Solo procesar videos o documentos que parezcan videos
    if not event.media:
        return

    document = None
    if event.video:
        document = event.video
    elif event.document:
        mime = event.document.mime_type or ""
        name = (event.file.name or "").lower()
        if mime.startswith("video/") or name.endswith((".mp4", ".mkv", ".avi", ".mov")):
            document = event.document

    if not document:
        return

    print(f"DEBUG: Procesando media de Telegram ({event.id})", flush=True)

    # Extraer metadatos
    chat_id = event.chat_id
    message_id = event.id
    file_size = event.file.size
    mime_type = event.document.mime_type

    # Atributos específicos de video
    duration = 0
    width = 0
    height = 0
    for attr in document.attributes:
        if hasattr(attr, "duration"):
            duration = attr.duration
        if hasattr(attr, "w"):
            width = attr.w
            height = attr.h

    # Guardar en base de datos
    db = SessionLocal()
    try:
        new_vid_id = gen_uuid()
        # Determinar título (usar texto de mensaje si no hay nombre de archivo)
        video_title = event.file.name or event.text or "Video sin nombre"
        if len(video_title) > 100:  # Limitar longitud si es un texto muy largo
            video_title = video_title[:97] + "..."

        video_link = VideoLink(
            id=new_vid_id,
            tg_chat_id=chat_id,
            tg_message_id=message_id,
            tg_access_hash=str(document.access_hash),
            tg_file_size=file_size,
            tg_mime_type=mime_type,
            tg_duration=duration,
            tg_width=width,
            tg_height=height,
            quality="HD",
            language="LAT",
            title=video_title,
        )
        db.add(video_link)
        db.commit()

        # Generar Token de Streaming
        token = create_streaming_token(new_vid_id)

        # Link final seguro (sin IDs de Telegram)
        # Formato: http://bridge/stream/{video_id}?token={token}
        final_url = f"{BRIDGE_BASE_URL}/stream/{new_vid_id}?token={token}"

        await event.reply(
            f"✅ **Procesado con éxito**\n"
            f"🎥 `{video_link.title}`\n"
            f"📏 {file_size / (1024*1024):.2f} MB | ⏱️ {duration}s\n\n"
            f"🚀 **Enlace Seguro de Streaming:**\n"
            f"`{final_url}`\n\n"
            f"⚠️ *Este enlace es válido para reproducción directa y administrativa.*"
        )
        print(f"DEBUG: Link generado para {new_vid_id}", flush=True)

    except Exception as e:
        print(f"ERROR DB: {e}", flush=True)
        await event.reply("❌ Error al guardar metadatos en el servidor.")
    finally:
        db.close()


if __name__ == "__main__":
    print("🤖 VIDDEX Telethon Bot iniciado...", flush=True)
    client.run_until_disconnected()

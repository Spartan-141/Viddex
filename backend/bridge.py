# bridge.py (Rediseño Pro aiohttp + Telethon)
import os
import re
import asyncio
import jwt
import time
from aiohttp import web
from telethon import TelegramClient
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import Base, VideoLink
from app.utils.security import verify_streaming_token

load_dotenv()

# Configuración
API_ID = int(os.getenv("TELEGRAM_API_ID"))
API_HASH = os.getenv("TELEGRAM_API_HASH")
BOT_TOKEN = os.getenv("BOT_TOKEN")
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./viddex.db")

# Cache simple en memoria para evitar latencia de Telegram
entity_cache = {}  # {chat_id: (entity, timestamp)}
message_cache = {}  # {video_id: (msg_obj, timestamp)}

# Cliente Telethon persistente
client = TelegramClient("viddex_bridge_v3", API_ID, API_HASH)

# Configuración DB
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def parse_range(range_str, file_size):
    if not range_str:
        return 0, file_size - 1
    match = re.search(r"bytes=(\d+)-(\d*)", range_str)
    if not match:
        return 0, file_size - 1
    start = int(match.group(1))
    end = match.group(2)
    end = int(end) if end else file_size - 1
    return start, min(end, file_size - 1)


async def get_cached_message(video, video_id):
    now = time.time()
    if video_id in message_cache:
        msg, ts = message_cache[video_id]
        if now - ts < 300:  # 5 minutos de cache
            return msg

    # Si no en cache, buscar entidad y mensaje
    if (
        video.tg_chat_id not in entity_cache
        or now - entity_cache[video.tg_chat_id][1] > 600
    ):
        entity = await client.get_input_entity(video.tg_chat_id)
        entity_cache[video.tg_chat_id] = (entity, now)
    else:
        entity = entity_cache[video.tg_chat_id][0]

    msg = await client.get_messages(entity, ids=video.tg_message_id)
    if msg and msg.media:
        message_cache[video_id] = (msg, now)
        return msg
    return None


async def stream_handler(request):
    video_id = request.match_info.get("video_id")
    token = request.query.get("token")

    # 1. Seguridad
    if not token or not verify_streaming_token(token, video_id):
        return web.Response(text="Unauthorized", status=403)

    # 2. Datos DB
    db = SessionLocal()
    video = db.query(VideoLink).filter(VideoLink.id == video_id).first()
    db.close()

    if not video or not video.tg_message_id:
        return web.Response(text="Video not found", status=404)

    file_size = video.tg_file_size
    range_header = request.headers.get("Range")
    start, end = parse_range(range_header, file_size)
    content_length = (end - start) + 1

    # 3. Cabeceras
    headers = {
        "Content-Type": video.tg_mime_type or "video/mp4",
        "Content-Range": f"bytes {start}-{end}/{file_size}",
        "Accept-Ranges": "bytes",
        "Content-Length": str(content_length),
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
    }

    response = web.StreamResponse(status=206 if range_header else 200, headers=headers)
    await response.prepare(request)

    try:
        # 4. Descarga directa con Telethon (Telethon ya maneja la alineación de 4KB internamente)
        msg = await get_cached_message(video, video_id)
        if not msg:
            raise Exception("Media unavailable")

        print(f"🎥 [STREAM] {video.title} | {start}-{end}/{file_size}", flush=True)

        async for chunk in client.iter_download(
            msg.media.document,
            offset=start,  # Dejar que Telethon haga el slice/alineación
            request_size=128 * 1024,
            limit=content_length,
        ):
            try:
                await response.write(chunk)
            except:
                break  # Desconexión normal (seek/stop)

    except Exception as e:
        print(f"❌ [STREAM ERROR] {video_id}: {e}", flush=True)
    finally:
        try:
            await response.write_eof()
        except:
            pass

    return response


async def init_app():
    app = web.Application()
    app.router.add_get("/stream/{video_id}", stream_handler)
    app.router.add_get("/health", lambda r: web.json_response({"status": "ready"}))
    return app


async def main():
    print("🚀 Iniciando Bridge Pro con Caché...", flush=True)
    await client.start(bot_token=BOT_TOKEN)

    app = await init_app()
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, "0.0.0.0", 8000)
    await site.start()

    print("✅ Streaming listo en el puerto 8000", flush=True)
    try:
        await asyncio.Event().wait()  # Esperar para siempre
    except (KeyboardInterrupt, asyncio.CancelledError):
        pass
    finally:
        if client.is_connected():
            await client.disconnect()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except (KeyboardInterrupt, SystemExit, asyncio.CancelledError):
        pass

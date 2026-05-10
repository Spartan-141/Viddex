# 🎬 VIDDEX — Streaming Next-Gen Platform

VIDDEX es una plataforma de streaming de video de alto rendimiento de código abierto, diseñada con una interfaz estilo Netflix dinámica, fluida y moderna (Mobile-First responsive). Su arquitectura permite funcionar tanto extrayendo enlaces directos de **Telegram** (usando un puente de transmisión sin descargar los archivos) o conectándose con catálogos masivos de plataformas como **Vimeus**.

## 🚀 Tecnologías Principales

### 💻 Frontend (Interfaz de Usuario)

Desarrollado con un enfoque en velocidad, estética premium y reactividad responsiva que escala desde pantallas gigantes hasta teléfonos móviles.

- **React 19**: Biblioteca principal para la construcción de interfaces concurrentes.
- **Vite 7**: Herramienta de construcción y servidor de desarrollo ultrarrápido.
- **Tailwind CSS 4**: Framework utilitario para un diseño moderno (incorporando variables CSS responsivas).
- **React Router 7**: Gestión de navegación, layouts y off-canvas sidebar "Drawer" móvil.
- **Lucide React**: Set de iconos optimizados.
- **Video.js**: Motor de reproducción robusto.

### ⚙️ Backend (API Core)

Una API RESTful robusta diseñada con control asíncrono y los mejores estándares.

- **FastAPI**: Framework web Python de altísimo rendimiento.
- **SQLAlchemy (SQLite)**: Base de datos relacional para el almacenamiento en caché de catálogos y metadata local.
- **TheMovieDB (TMDB) API**: El sistema autocompleta descripciones, fotos, listas de temporadas y duración desde la base de datos de películas más grande del mundo.
- **Background Tasks**: Sincronización transparente On-Demand ("Just in Time") de capítulos de series cuando el usuario los pide.

## 🔗 Ecosistema de Fuentes (Sources)

VIDDEX no hospeda los archivos MP4 locales, es un orquestador híbrido:

1. **Telegram Bridge (Bot & Streaming)**: Puede conectarse a Telegram vía un bot (MTProto / Telethon), leer la metadata de un video enviado a Telegram, registrarlo en la base de datos de Viddex y crear una URL temporal firmada local. Al dar Play, intercepta el flujo del archivo de Telegram al vuelo y lo sirve al Frontend por bloques (`aiohttp`), soporta "seeking", usando _cero_ de almacenamiento en disco.
2. **Vimeus Sync**: Integra endpoints para clonar de forma asíncrona grandes volúmenes de catálogos, detectando episodios faltantes y asociando links oficiales del panel de Vimeus automáticamente cuando el usuario accede a una serie.

## 🛠️ Arquitectura y Seguridad

- **Búsquedas Insensibles (Agnósticas)**: La caja principal busca por nombre omitiendo acentos, mayúsculas o puntuaciones especiales, priorizando experiencia de usuario.
- **Signed URLs**: Toda película almacenada con Telegram está cifrada en un token temporal JWT que expira automáticamente para evitar el robo de ancho de banda y distribución foránea.

---

## ⚡ Guía de Inicio y Despliegue

La solución requiere tres partes funcionando (Frontend, Backend API, y los puentes opcionales como el bot si se utilizará Telegram).

### Requisitos Previos

- **Python 3.10+** (Para el Backend FastAPI / Bots)
- **Node 18+** (Para el Frontend Vite)
- (Opcional) Credenciales `API_ID` y `API_HASH` en my.telegram.org

---

### Paso 1: Configurar Variables de Entorno

#### ➝ En el Backend:

Navega a la carpeta `backend/` y crea o edita tu `.env`:

```env
TELEGRAM_API_ID=tu_api_id
TELEGRAM_API_HASH=tu_api_hash
BOT_TOKEN=tu_token_de_bot_de_botfather

STREAMING_SECRET_KEY=alguna-clave-larga-y-segura
JWT_SECRET_KEY=otra-clave-secreta-para-login

TMDB_API_KEY=tu_api_key_de_themoviedb

# Solo si usas Vimeus:
VIMEUS_API_KEY=tu_key_vimeus
VIMEUS_VIEW_KEY=tu_view_key
```

#### ➝ En el Frontend:

Navega a la carpeta `frontend/` y ajusta el `.env`:

```env
# IP o dominio de tu servidor backend. Pon tu IP local en vez de localhost para entrar desde el móvil
VITE_API_URL=http://localhost:8001

VITE_TMDB_API_KEY=tu_key
VITE_TMDB_BASE_URL=https://api.themoviedb.org/3
VITE_TMDB_IMAGE_BASE=https://image.tmdb.org/t/p
```

---

### Paso 2: Instalación de Dependencias

Ejecuta lo siguiente desde la raíz del ecosistema:

**Instalar y Arrancar Backend:**

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

_(Nota: El servidor arranca en el puerto 8001. En el primer inicio se creará `viddex.db` en blanco)._

**Instalar y Arrancar Frontend:**

```bash
cd frontend
npm install
npm run dev -- --host
```

_(El frontend arranca en http://localhost:5173. El flag `--host` lo vuelve visible en toda la red WiFi)._

---

### Paso 3: Arrancar los Servicios Anexos (Si Usas Telegram)

Abre nuevas terminales en `backend` y usa el mismo entorno (venv) para correr el bot y el bridge.

**Terminal 3 (El Bot interceptor):**

```bash
cd backend
source venv/bin/activate
python bot.py
```

**Terminal 4 (El Servidor Puente HTTPS-a-Telegram):**

```bash
cd backend
source venv/bin/activate
python bridge.py
```

---

## 🧰 Scripts Utilitarios

Adentro de la carpeta `backend/scripts` encontrarás herramientas vitales que te ayudarán:

- `backend/1_populate_from_vimeus.py`: Útil para importar miles de películas de golpe desde un catálogo de Vimeus en blanco.
- `backend/scripts/diag_*.py`: Analizadores de salud del backend o diagnosticar JSON crudos de fuentes de terceros.

> **Advertencia de Git:** Por diseño del sistema, no subas nunca el archivo `viddex.db`, archivos `.session` ni las carpetas `.env` al repositorio de código fuente, manteniéndolas en tu Gitignore.

---

## 🪟 Guía Específica para Windows

### Requisitos Previos en Windows

- **Python 3.10+** (https://www.python.org/downloads/)
- **Node.js 18+** (https://nodejs.org/)
- **Visual C++ Build Tools** (requerido para bcrypt): https://visualstudio.microsoft.com/visual-cpp-build-tools/
- (Opcional) Credenciales de Telegram y TMDB

### Instalación paso a paso

#### 1. Backend

```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

#### 2. Frontend

```powershell
cd frontend
npm install
npm run dev -- --host
```

#### 3. Bridge de Streaming (Telegram)

En otra terminal con el venv activado:

```powershell
cd backend
.\venv\Scripts\activate
python bridge.py
```

### Problemas comunes en Windows

- **bcrypt falla al instalar**: Instalar Visual C++ Build Tools o usar `pip install bcrypt-windows`
- **Error de ruta**: Usar `.\venv\Scripts\activate` en lugar de `source venv/bin/activate`

---

## 📦 Empaquetado como .exe

### Opción 1: PyInstaller para Backend + Bridge

```powershell
pip install pyinstaller
pyinstaller --onefile --name viddex_bridge.exe backend/bridge.py
pyinstaller --onefile --name viddex_api.exe backend/app/main.py
```

### Opción 2: Aplicación Desktop con Tauri

```powershell
cd frontend
npm install -g create-tauri-app
npm create tauri-app@latest
# Seleccionar framework React y seguir instrucciones
```

### Opción 3: Paquete todo-en-uno

Crear script `run-windows.bat`:

```batch
@echo off
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt -q
start "VIDDEX API" cmd /c "uvicorn app.main:app --host 0.0.0.0 --port 8001"
start "VIDDEX Bridge" cmd /c "python bridge.py"
cd ..\frontend
npm install -q
npm run dev -- --host
```

---

© 2026 VIDDEX — Advanced Engineering for Digital Content.

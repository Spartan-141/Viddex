# VIDDEX — GUÍA DE RESET DE SUPABASE (v2.0) 🚀

Esta carpeta contiene todos los scripts necesarios para reconstruir la base de datos de VIDDEX desde cero. Sigue estos pasos para asegurar un sistema estable y sin errores.

## ⚠️ IMPORTANTE: LIMPIEZA PREVIA

Antes de comenzar, debes borrar todas las tablas existentes en tu proyecto de Supabase (o crear un proyecto nuevo).

- Puedes hacerlo desde el **SQL Editor** de Supabase con el comando `DROP SCHEMA public CASCADE; CREATE SCHEMA public;`.

---

## 🛠️ PASO 1: APLICAR LA ESTRUCTURA (SCHEMA)

Copia y pega el contenido de [schema.sql](./schema.sql) en el **SQL Editor** de Supabase y ejecútalo.

- Crea tablas para: Perfiles, Películas, Series, Temporadas, Episodios, Links, Watchlist, Historial y Reportes.

## 🛠️ PASO 2: ACTIVAR AUTOMATIZACIONES (FUNCTIONS)

Copia y pega el contenido de [functions.sql](./functions.sql) y ejecútalo.

- Activa la creación automática de perfiles y la actualización de marcas de tiempo.

## 🛠️ PASO 3: CONFIGURAR POLÍTICAS DE SEGURIDAD (RLS)

Copia y pega el contenido de [rls.sql](./rls.sql) y ejecútalo.

- Protege los datos de usuario y restringe la administración solo a usuarios autorizados.

## 🛠️ PASO 4: ASIGNAR ROL DE ADMINISTRADOR

Una vez que te hayas registrado en la web de VIDDEX, ve al **SQL Editor** y ejecuta lo siguiente (sustituyendo con tu correo):

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE username = 'tu_correo@ejemplo.com';
```

---

## ✅ VERIFICACIÓN FINAL

1. **Frontend**: Actualiza las URLs de Supabase en tus archivos `.env` (si has creado un proyecto nuevo).
2. **Backend**: Actualiza el `SUPABASE_KEY` (Service Role Key) en `backend/.env`.
3. **Registro**: Crea una cuenta nueva y verifica que aparece en la tabla `profiles` de la base de datos.
4. **Carga**: Intenta añadir una película desde TMDB en el panel `/admin/peliculas`.

---

> [!TIP]
> Si en algún momento deseas vaciar los datos de las tablas sin borrar la estructura, puedes usar el script de utilidad `backend/reset_db_data.py`.

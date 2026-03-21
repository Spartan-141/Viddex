-- =============================================================
-- VIDDEX — DATOS INICIALES (SEED)
-- =============================================================

-- 1. Ejemplo de inserción de categorías (Si las tuviéramos)
-- Actualmente no usamos tabla de géneros separada, pero se puede añadir aquí si se desea.

-- 2. Ejemplo de cómo convertir a un usuario en ADMIN (vía SQL Editor)
/*
UPDATE public.profiles 
SET role = 'admin' 
WHERE username = 'TU_USUARIO' OR id = 'TU_UUID_DE_AUTH';
*/

-- 3. Inserción de una película de prueba (opcional)
-- INSERT INTO public.movies (title, overview, tmdb_id, quality)
-- VALUES ('Viddex Test Movie', 'Película para verificar que todo funciona correctamente.', 0, '4K');

-- 4. Inserción de un reporte de prueba (opcional)
-- INSERT INTO public.reports (issue_type, description, status)
-- VALUES ('setup', 'Base de datos reconstruida con éxito.', 'resolved');

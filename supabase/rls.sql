-- =============================================================
-- VIDDEX — POLÍTICAS DE SEGURIDAD (RLS)
-- =============================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.series ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- 1. POLÍTICAS PARA: profiles
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. POLÍTICAS PARA: Contenido (Lectura pública, Escritura Admin)
-- Tablas: movies, series, seasons, episodes, video_links
CREATE POLICY "Content is viewable by everyone" ON public.movies FOR SELECT USING (true);
CREATE POLICY "Content is viewable by everyone" ON public.series FOR SELECT USING (true);
CREATE POLICY "Content is viewable by everyone" ON public.seasons FOR SELECT USING (true);
CREATE POLICY "Content is viewable by everyone" ON public.episodes FOR SELECT USING (true);
CREATE POLICY "Content is viewable by everyone" ON public.video_links FOR SELECT USING (true);

-- Escritura solo para Admins
CREATE POLICY "Admins can manage movies" ON public.movies FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can manage series" ON public.series FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can manage seasons" ON public.seasons FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can manage episodes" ON public.episodes FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can manage video_links" ON public.video_links FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 3. POLÍTICAS PARA: watchlist (Privado por usuario)
CREATE POLICY "Users can view own watchlist" ON public.watchlist FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own watchlist" ON public.watchlist FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own watchlist" ON public.watchlist FOR DELETE USING (auth.uid() = user_id);

-- 4. POLÍTICAS PARA: watch_history (Privado por usuario)
CREATE POLICY "Users can view own history" ON public.watch_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own history" ON public.watch_history FOR ALL USING (auth.uid() = user_id);

-- 5. POLÍTICAS PARA: reports
CREATE POLICY "Users can insert reports" ON public.reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view and manage reports" ON public.reports FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

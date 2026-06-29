-- ═══════════════════════════════════════════════════════════════════════════
-- AJSpinning · Foro comunitario — Actualizaciones Supabase 2026-06-29
-- ═══════════════════════════════════════════════════════════════════════════
-- Ejecuta este archivo completo desde Supabase → SQL Editor → New query.
-- Es idempotente: se puede ejecutar más de una vez sin errores.
-- Orden de ejecución: sigue el orden del archivo de arriba a abajo.
-- ═══════════════════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────────────────
-- 1. AMPLIAR TABLA profiles
--    Añade columnas nuevas para el perfil completo de usuario.
--    IF NOT EXISTS evita errores si la columna ya existe.
-- ───────────────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url    TEXT,
  ADD COLUMN IF NOT EXISTS bio           TEXT,
  ADD COLUMN IF NOT EXISTS fishing_zone  TEXT,
  ADD COLUMN IF NOT EXISTS species_prefs TEXT,
  ADD COLUMN IF NOT EXISTS experience    TEXT
    CHECK (experience IN ('beginner', 'intermediate', 'advanced', 'expert'));

-- Comentarios descriptivos en las columnas (opcionales pero útiles en la UI de Supabase)
COMMENT ON COLUMN public.profiles.avatar_url    IS 'URL pública del avatar en Supabase Storage bucket avatars';
COMMENT ON COLUMN public.profiles.bio           IS 'Presentación breve del usuario (máx. 300 caracteres)';
COMMENT ON COLUMN public.profiles.fishing_zone  IS 'Zona habitual de pesca (texto libre)';
COMMENT ON COLUMN public.profiles.species_prefs IS 'Especies preferidas (texto libre, ej: Trucha, Lucio)';
COMMENT ON COLUMN public.profiles.experience    IS 'Nivel de experiencia: beginner, intermediate, advanced, expert';


-- ───────────────────────────────────────────────────────────────────────────
-- 2. TRIGGER handle_new_user
--    Crea una fila en profiles automáticamente cuando un usuario se registra.
--    Sin este trigger, si el usuario no tiene fila en profiles,
--    el update de saveUsername no inserta nada y el perfil queda vacío.
--    ON CONFLICT DO NOTHING lo hace seguro para ejecutarlo más de una vez.
-- ───────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Elimina el trigger si ya existía (para evitar duplicado) y lo recrea
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- ───────────────────────────────────────────────────────────────────────────
-- 3. SEED DE CATEGORÍAS
--    Inserta las 6 categorías mínimas del foro.
--    ON CONFLICT (slug) DO NOTHING: no sobreescribe si ya existen.
--    Ajusta el orden (id) para que coincida con el orden visual que quieres.
-- ───────────────────────────────────────────────────────────────────────────

INSERT INTO public.categories (name, slug, icon) VALUES
  ('Zonas de pesca',    'zonas',     '🗺️'),
  ('Técnica y trucos',  'tecnica',   '🎣'),
  ('Especies',          'especies',  '🐟'),
  ('Material y equipo', 'material',  '🎒'),
  ('Preguntas',         'preguntas', '❓'),
  ('Capturas',          'capturas',  '📸')
ON CONFLICT (slug) DO NOTHING;


-- ───────────────────────────────────────────────────────────────────────────
-- 4. RLS — Row Level Security
--    Asegura que cada usuario solo puede modificar/eliminar su propio contenido.
--    Usamos DO $$ BEGIN ... END $$ para comprobar si la policy ya existe
--    antes de crearla, evitando el error "policy already exists".
--
--    IMPORTANTE: si tu base de datos ya tiene policies con nombres distintos
--    para las mismas operaciones, revísalas en el Dashboard:
--    Table Editor → [tabla] → RLS → Policies
-- ───────────────────────────────────────────────────────────────────────────

DO $$
BEGIN

  -- ── posts: lectura publica ──────────────────────────────────────────────
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'posts'
      AND policyname = 'Post: lectura publica'
  ) THEN
    CREATE POLICY "Post: lectura publica"
      ON public.posts
      FOR SELECT
      USING (true);
  END IF;

  -- ── posts: insertar si autenticado ──────────────────────────────────────
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'posts'
      AND policyname = 'Post: insertar autenticado'
  ) THEN
    CREATE POLICY "Post: insertar autenticado"
      ON public.posts
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- ── posts: actualizar el propio ─────────────────────────────────────────
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'posts'
      AND policyname = 'Post: update propio'
  ) THEN
    CREATE POLICY "Post: update propio"
      ON public.posts
      FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;

  -- ── posts: eliminar el propio ───────────────────────────────────────────
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'posts'
      AND policyname = 'Post: delete propio'
  ) THEN
    CREATE POLICY "Post: delete propio"
      ON public.posts
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;


  -- ── comments: lectura publica ───────────────────────────────────────────
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'comments'
      AND policyname = 'Comment: lectura publica'
  ) THEN
    CREATE POLICY "Comment: lectura publica"
      ON public.comments
      FOR SELECT
      USING (true);
  END IF;

  -- ── comments: insertar si autenticado ──────────────────────────────────
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'comments'
      AND policyname = 'Comment: insertar autenticado'
  ) THEN
    CREATE POLICY "Comment: insertar autenticado"
      ON public.comments
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- ── comments: actualizar el propio ─────────────────────────────────────
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'comments'
      AND policyname = 'Comment: update propio'
  ) THEN
    CREATE POLICY "Comment: update propio"
      ON public.comments
      FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;

  -- ── comments: eliminar el propio ───────────────────────────────────────
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'comments'
      AND policyname = 'Comment: delete propio'
  ) THEN
    CREATE POLICY "Comment: delete propio"
      ON public.comments
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;


  -- ── profiles: lectura publica ───────────────────────────────────────────
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles'
      AND policyname = 'Profile: lectura publica'
  ) THEN
    CREATE POLICY "Profile: lectura publica"
      ON public.profiles
      FOR SELECT
      USING (true);
  END IF;

  -- ── profiles: insertar el propio (fallback si el trigger falla) ─────────
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles'
      AND policyname = 'Profile: insertar propio'
  ) THEN
    CREATE POLICY "Profile: insertar propio"
      ON public.profiles
      FOR INSERT
      WITH CHECK (auth.uid() = id);
  END IF;

  -- ── profiles: actualizar el propio ─────────────────────────────────────
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles'
      AND policyname = 'Profile: update propio'
  ) THEN
    CREATE POLICY "Profile: update propio"
      ON public.profiles
      FOR UPDATE
      USING (auth.uid() = id);
  END IF;


  -- ── categories: lectura publica (sin restricciones) ────────────────────
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'categories'
      AND policyname = 'Category: lectura publica'
  ) THEN
    CREATE POLICY "Category: lectura publica"
      ON public.categories
      FOR SELECT
      USING (true);
  END IF;


  -- ── votes: lectura del propio usuario ──────────────────────────────────
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'votes'
      AND policyname = 'Vote: lectura propia'
  ) THEN
    CREATE POLICY "Vote: lectura propia"
      ON public.votes
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  -- ── votes: insertar el propio ──────────────────────────────────────────
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'votes'
      AND policyname = 'Vote: insertar propio'
  ) THEN
    CREATE POLICY "Vote: insertar propio"
      ON public.votes
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- ── votes: eliminar el propio (para el toggle_vote RPC) ────────────────
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'votes'
      AND policyname = 'Vote: delete propio'
  ) THEN
    CREATE POLICY "Vote: delete propio"
      ON public.votes
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;

END $$;


-- ───────────────────────────────────────────────────────────────────────────
-- 5. HABILITAR RLS EN TODAS LAS TABLAS PÚBLICAS DEL FORO
--    ALTER TABLE ... ENABLE ROW LEVEL SECURITY es idempotente:
--    si ya estaba activado, no hace nada ni da error.
-- ───────────────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes      ENABLE ROW LEVEL SECURITY;


-- ───────────────────────────────────────────────────────────────────────────
-- 6. STORAGE BUCKET 'avatars' y RLS
--
--    ATENCIÓN: Estas sentencias pueden fallar si:
--    a) El bucket ya existe → el INSERT ON CONFLICT lo gestiona.
--    b) Las policies ya existen → usa las comprobaciones IF NOT EXISTS.
--
--    ALTERNATIVA MÁS SEGURA: Crea el bucket manualmente desde
--    Supabase Dashboard → Storage → New bucket → nombre: "avatars" → Public: ON
--    y ejecuta solo el bloque de policies (los CREATE POLICY de abajo).
--
--    Si quieres ejecutar todo desde aquí (incluido el bucket), descomenta
--    la línea INSERT INTO storage.buckets... de abajo.
-- ───────────────────────────────────────────────────────────────────────────

-- Descomenta las líneas de abajo si quieres crear el bucket desde SQL.
-- Si lo creas manualmente desde el Dashboard, déjalas comentadas.
--
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--   'avatars',
--   'avatars',
--   true,
--   2097152,   -- 2 MB en bytes
--   ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
-- )
-- ON CONFLICT (id) DO UPDATE
--   SET public             = true,
--       file_size_limit    = 2097152,
--       allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];


-- Policies RLS para storage.objects (bucket avatars)
-- Estas sí las puedes ejecutar siempre, incluso si el bucket
-- ya existe o si las has creado desde el Dashboard.

DO $$
BEGIN

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Avatar: lectura publica'
  ) THEN
    CREATE POLICY "Avatar: lectura publica"
      ON storage.objects
      FOR SELECT
      USING (bucket_id = 'avatars');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Avatar: upload propio'
  ) THEN
    CREATE POLICY "Avatar: upload propio"
      ON storage.objects
      FOR INSERT
      WITH CHECK (
        bucket_id = 'avatars'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Avatar: update propio'
  ) THEN
    CREATE POLICY "Avatar: update propio"
      ON storage.objects
      FOR UPDATE
      USING (
        bucket_id = 'avatars'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Avatar: delete propio'
  ) THEN
    CREATE POLICY "Avatar: delete propio"
      ON storage.objects
      FOR DELETE
      USING (
        bucket_id = 'avatars'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;

END $$;


-- ───────────────────────────────────────────────────────────────────────────
-- 7. VERIFICACIÓN FINAL
--    Ejecutar para confirmar que todo se ha aplicado correctamente.
--    Deberías ver:
--      - profiles con las 5 columnas nuevas
--      - categories con 6 filas
--      - trigger on_auth_user_created en auth.users
--      - policies en posts, comments, profiles, categories, votes, storage.objects
-- ───────────────────────────────────────────────────────────────────────────

-- Columnas de profiles
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Categorías insertadas
SELECT id, name, slug, icon FROM public.categories ORDER BY id;

-- Trigger existente
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- RLS activo en las tablas
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'posts', 'comments', 'categories', 'votes')
ORDER BY tablename;

-- Todas las policies del foro
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE schemaname IN ('public', 'storage')
  AND tablename IN ('profiles', 'posts', 'comments', 'categories', 'votes', 'objects')
ORDER BY schemaname, tablename, policyname;

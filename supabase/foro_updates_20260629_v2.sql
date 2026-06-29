-- ═══════════════════════════════════════════════════════════════════════════
-- AJSpinning · Foro comunitario — Actualizaciones v2 (2026-06-29)
-- ═══════════════════════════════════════════════════════════════════════════
-- Prerequisito: ejecuta primero foro_updates_20260629.sql si no lo has hecho.
-- Este archivo es idempotente. Ejecútalo completo desde Supabase → SQL Editor.
-- ═══════════════════════════════════════════════════════════════════════════


-- ── 1. FK directa posts.user_id → profiles(id)
--    Sin esta FK, PostgREST no puede hacer el join automático entre posts y
--    profiles, y la query select('*,profiles(username,...)') falla silenciosamente.
--    ON DELETE SET NULL: si se borra el perfil, el post queda con user_id = NULL.
ALTER TABLE public.posts
  DROP CONSTRAINT IF EXISTS posts_user_id_profiles_fkey;

ALTER TABLE public.posts
  ADD CONSTRAINT posts_user_id_profiles_fkey
  FOREIGN KEY (user_id)
  REFERENCES public.profiles(id)
  ON DELETE SET NULL;


-- ── 2. display_name en profiles
--    Nombre público visible en el foro (puede tener espacios, acentos, mayúsculas).
--    Si no se rellena, el foro usa username como fallback.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS display_name TEXT;

COMMENT ON COLUMN public.profiles.display_name IS
  'Nombre público visible en el foro (admite espacios, acentos, máx. 40 caracteres)';


-- ── 3. Tabla post_images
--    Almacena las URLs de las imágenes adjuntas a cada post.
--    ON DELETE CASCADE: si se borra el post, se borran sus imágenes automáticamente.
CREATE TABLE IF NOT EXISTS public.post_images (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id      uuid        NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url    text        NOT NULL,
  storage_path text        NOT NULL,
  position     int         DEFAULT 0,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE public.post_images ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.post_images IS
  'Imágenes adjuntas a los posts del foro (bucket forum-images en Storage)';


-- ── 4. RLS post_images
DO $$ BEGIN

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'post_images'
      AND policyname = 'PostImage: lectura publica'
  ) THEN
    CREATE POLICY "PostImage: lectura publica"
      ON public.post_images FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'post_images'
      AND policyname = 'PostImage: insertar propio'
  ) THEN
    CREATE POLICY "PostImage: insertar propio"
      ON public.post_images FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'post_images'
      AND policyname = 'PostImage: delete propio'
  ) THEN
    CREATE POLICY "PostImage: delete propio"
      ON public.post_images FOR DELETE
      USING (auth.uid() = user_id);
  END IF;

END $$;


-- ── 5. Storage RLS bucket forum-images
--
--    ANTES DE EJECUTAR ESTE BLOQUE:
--    Crea el bucket manualmente en Dashboard → Storage → New bucket
--      Nombre:         forum-images
--      Public bucket:  ON (activado)
--
--    Las políticas de abajo son idempotentes (IF NOT EXISTS).

DO $$ BEGIN

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'ForumImg: lectura publica'
  ) THEN
    CREATE POLICY "ForumImg: lectura publica"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'forum-images');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'ForumImg: upload propio'
  ) THEN
    CREATE POLICY "ForumImg: upload propio"
      ON storage.objects FOR INSERT
      WITH CHECK (
        bucket_id = 'forum-images'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'ForumImg: delete propio'
  ) THEN
    CREATE POLICY "ForumImg: delete propio"
      ON storage.objects FOR DELETE
      USING (
        bucket_id = 'forum-images'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;

END $$;


-- ── 6. Verificación final
SELECT
  c.column_name,
  c.data_type
FROM information_schema.columns c
WHERE c.table_schema = 'public'
  AND c.table_name = 'profiles'
  AND c.column_name IN ('display_name','avatar_url','bio','fishing_zone','species_prefs','experience')
ORDER BY c.ordinal_position;

SELECT tc.constraint_name, tc.table_name, kcu.column_name,
       ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'posts'
  AND kcu.column_name = 'user_id';

SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'post_images';

SELECT policyname, cmd
FROM pg_policies
WHERE schemaname IN ('public','storage')
  AND tablename IN ('post_images','objects')
  AND policyname LIKE '%PostImage%' OR policyname LIKE '%ForumImg%'
ORDER BY tablename, policyname;

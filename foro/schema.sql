-- ════════════════════════════════════════════════════════════════
-- AJSpinning · Foro comunitario — Esquema Supabase (revisió segura)
-- Versió MVP amb moderació preparada però no exposada al frontend
--
-- Com executar:
--   Supabase Dashboard → SQL Editor → enganxa tot el bloc → Run
-- ════════════════════════════════════════════════════════════════

-- ── Extensions ───────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ════════════════════════════════════════════════════════════════
-- TAULES
-- ════════════════════════════════════════════════════════════════

-- ── categories ───────────────────────────────────────────────
-- Gestionada únicament des del dashboard (sense política d'escriptura)
CREATE TABLE IF NOT EXISTS public.categories (
  id   serial PRIMARY KEY,
  slug text   UNIQUE NOT NULL,
  name text   NOT NULL,
  icon text   NOT NULL DEFAULT '🎣'
);

-- ── profiles ─────────────────────────────────────────────────
-- Una fila per usuari, creada automàticament pel trigger handle_new_user
CREATE TABLE IF NOT EXISTS public.profiles (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username   text UNIQUE CHECK(
               char_length(username) BETWEEN 3 AND 20
               AND username ~ '^[a-z0-9_]+$'
             ),
  created_at timestamptz DEFAULT now()
);
-- Nota: el camp is_moderator NO s'inclou aquí per evitar auto-assignació.
-- Quan calgui, afegir una taula separada `moderators` gestionada via service_role.

-- ── posts ────────────────────────────────────────────────────
-- upvotes i comment_count: NOMÉS modificables per funcions SECURITY DEFINER
-- hidden: true = ocult per moderació (visible únicament a l'autor)
CREATE TABLE IF NOT EXISTS public.posts (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    timestamptz DEFAULT now(),
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id   int         NOT NULL REFERENCES public.categories(id),
  title         text        NOT NULL CHECK(char_length(title) BETWEEN 5 AND 200),
  body          text        NOT NULL CHECK(char_length(body) >= 10),
  upvotes       int         NOT NULL DEFAULT 0 CHECK(upvotes >= 0),
  comment_count int         NOT NULL DEFAULT 0 CHECK(comment_count >= 0),
  hidden        boolean     NOT NULL DEFAULT false
);

-- ── comments ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.comments (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  post_id    uuid        NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id  uuid        REFERENCES public.comments(id) ON DELETE CASCADE,
  body       text        NOT NULL CHECK(char_length(body) >= 2),
  upvotes    int         NOT NULL DEFAULT 0 CHECK(upvotes >= 0),
  hidden     boolean     NOT NULL DEFAULT false
);

-- ── votes ────────────────────────────────────────────────────
-- NO hi ha política d'escriptura des del frontend.
-- INSERT i DELETE es fan exclusivament via toggle_vote() (SECURITY DEFINER).
-- Lectura: cada usuari veu només els seus propis vots (per saber quins ha votat).
CREATE TABLE IF NOT EXISTS public.votes (
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_id   uuid NOT NULL,
  target_type text NOT NULL CHECK(target_type IN ('post', 'comment')),
  PRIMARY KEY (user_id, target_id)
);

-- ── reports ──────────────────────────────────────────────────
-- Els usuaris poden denunciar contingut; la resolució és via dashboard.
-- UNIQUE(reporter_id, target_id): un sol report per usuari per contingut.
CREATE TABLE IF NOT EXISTS public.reports (
  id          serial      PRIMARY KEY,
  created_at  timestamptz DEFAULT now(),
  reporter_id uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  target_id   uuid        NOT NULL,
  target_type text        NOT NULL CHECK(target_type IN ('post', 'comment')),
  reason      text        NOT NULL CHECK(char_length(reason) BETWEEN 5 AND 500),
  resolved    boolean     NOT NULL DEFAULT false,
  UNIQUE(reporter_id, target_id)
);


-- ════════════════════════════════════════════════════════════════
-- DADES INICIALS
-- ════════════════════════════════════════════════════════════════

INSERT INTO public.categories (slug, name, icon) VALUES
  ('zonas',     'Zones de pesca',    '🗺️'),
  ('tecnica',   'Tècnica i trucs',   '🎣'),
  ('especies',  'Espècies',          '🐟'),
  ('material',  'Material i equip',  '⚙️'),
  ('preguntes', 'Preguntes',         '❓')
ON CONFLICT (slug) DO NOTHING;


-- ════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ════════════════════════════════════════════════════════════════

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports    ENABLE ROW LEVEL SECURITY;

-- ── categories: lectura pública, cap escriptura des del frontend
CREATE POLICY "categories_select"
  ON public.categories FOR SELECT TO public
  USING (true);

-- ── profiles ─────────────────────────────────────────────────
-- Lectura pública (cal per mostrar noms d'usuari als posts)
CREATE POLICY "profiles_select"
  ON public.profiles FOR SELECT TO public
  USING (true);

-- Inserció: auth.uid() ha de coincidir amb l'id del perfil
CREATE POLICY "profiles_insert"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- Actualització: USING (qui ho envia) + WITH CHECK (el resultat)
-- Permet canviar username però no l'id ni created_at
-- (Les columnes sensibles s'han de gestionar via dashboard o trigger si cal)
CREATE POLICY "profiles_update"
  ON public.profiles FOR UPDATE TO authenticated
  USING     (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ── posts ─────────────────────────────────────────────────────
-- Lectura: oculta posts amb hidden=true, excepte per al propi autor
CREATE POLICY "posts_select"
  ON public.posts FOR SELECT TO public
  USING (hidden = false OR auth.uid() = user_id);

-- Inserció: l'autor ha de ser el propi usuari
CREATE POLICY "posts_insert"
  ON public.posts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Eliminació: només l'autor pot esborrar
CREATE POLICY "posts_delete"
  ON public.posts FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- NO hi ha UPDATE policy per a posts:
-- · upvotes i comment_count es gestionen per funcions SECURITY DEFINER
-- · hidden el gestiona el moderador via dashboard (service_role)
-- · l'edició de posts no és al MVP

-- ── comments ──────────────────────────────────────────────────
CREATE POLICY "comments_select"
  ON public.comments FOR SELECT TO public
  USING (hidden = false OR auth.uid() = user_id);

CREATE POLICY "comments_insert"
  ON public.comments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "comments_delete"
  ON public.comments FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- NO hi ha UPDATE policy per a comments (ídem posts)

-- ── votes ──────────────────────────────────────────────────────
-- SELECT: cada usuari veu únicament els seus propis vots
CREATE POLICY "votes_select"
  ON public.votes FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- NO hi ha INSERT ni DELETE policy:
-- tota la lògica passa per toggle_vote() (SECURITY DEFINER)

-- ── reports ───────────────────────────────────────────────────
-- Inserció: reporter_id ha de ser l'usuari que fa la crida
CREATE POLICY "reports_insert"
  ON public.reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

-- NO hi ha SELECT: els moderadors consulten via dashboard
-- NO hi ha UPDATE ni DELETE des del frontend


-- ════════════════════════════════════════════════════════════════
-- FUNCIONS SECURITY DEFINER
-- Totes amb SET search_path = public (evita search_path injection)
-- REVOKE PUBLIC + GRANT authenticated on les callable des del frontend
-- ════════════════════════════════════════════════════════════════

-- ── toggle_vote ───────────────────────────────────────────────
-- Operació atòmica: comprova autenticació + duplicat dins la mateixa
-- transacció, elimina o afegeix el vot, actualitza el comptador.
-- Retorna: { voted: boolean, upvotes: integer }
--
-- Crida des del frontend:
--   const { data } = await sb.rpc('toggle_vote', {
--     p_target_id: 'uuid', p_target_type: 'post' | 'comment'
--   })

CREATE OR REPLACE FUNCTION public.toggle_vote(
  p_target_id   uuid,
  p_target_type text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid   uuid := auth.uid();
  v_voted boolean;
  v_count int;
BEGIN
  -- 1. Autenticació obligatòria
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated'
      USING HINT = 'Cal iniciar sessió per votar';
  END IF;

  -- 2. Validació del tipus
  IF p_target_type NOT IN ('post', 'comment') THEN
    RAISE EXCEPTION 'invalid_target_type'
      USING HINT = 'p_target_type ha de ser post o comment';
  END IF;

  -- 3. Comprova si l'usuari ja ha votat (dins la transacció → sense race)
  SELECT EXISTS(
    SELECT 1 FROM public.votes
    WHERE user_id = v_uid AND target_id = p_target_id
  ) INTO v_voted;

  IF v_voted THEN
    -- 4a. Elimina el vot existent
    DELETE FROM public.votes
    WHERE user_id = v_uid AND target_id = p_target_id;

    IF p_target_type = 'post' THEN
      UPDATE public.posts
        SET upvotes = GREATEST(0, upvotes - 1)
        WHERE id = p_target_id
        RETURNING upvotes INTO v_count;
    ELSE
      UPDATE public.comments
        SET upvotes = GREATEST(0, upvotes - 1)
        WHERE id = p_target_id
        RETURNING upvotes INTO v_count;
    END IF;

    RETURN json_build_object('voted', false, 'upvotes', COALESCE(v_count, 0));

  ELSE
    -- 4b. Afegeix el vot (ON CONFLICT com a seguretat addicional contra races)
    INSERT INTO public.votes (user_id, target_id, target_type)
    VALUES (v_uid, p_target_id, p_target_type)
    ON CONFLICT (user_id, target_id) DO NOTHING;

    IF p_target_type = 'post' THEN
      UPDATE public.posts
        SET upvotes = upvotes + 1
        WHERE id = p_target_id
        RETURNING upvotes INTO v_count;
    ELSE
      UPDATE public.comments
        SET upvotes = upvotes + 1
        WHERE id = p_target_id
        RETURNING upvotes INTO v_count;
    END IF;

    RETURN json_build_object('voted', true, 'upvotes', COALESCE(v_count, 0));
  END IF;
END;
$$;

-- Revoca l'accés per defecte a PUBLIC, concedeix només a authenticated
REVOKE EXECUTE ON FUNCTION public.toggle_vote(uuid, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.toggle_vote(uuid, text) TO authenticated;


-- ── handle_comment_count ──────────────────────────────────────
-- Trigger: actualitza posts.comment_count automàticament en INSERT/DELETE.
-- Elimina la necessitat que el frontend cridi cap RPC de comptador.
CREATE OR REPLACE FUNCTION public.handle_comment_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts
      SET comment_count = comment_count + 1
      WHERE id = NEW.post_id;

  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts
      SET comment_count = GREATEST(0, comment_count - 1)
      WHERE id = OLD.post_id;
  END IF;

  RETURN NULL; -- AFTER trigger, valor de retorn ignorat
END;
$$;

-- Els triggers no els pot invocar directament cap usuari
DROP TRIGGER IF EXISTS trg_comment_count ON public.comments;
CREATE TRIGGER trg_comment_count
  AFTER INSERT OR DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.handle_comment_count();


-- ── handle_new_user ───────────────────────────────────────────
-- Trigger: crea el perfil automàticament quan un usuari es registra.
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

DROP TRIGGER IF EXISTS trg_new_user ON auth.users;
CREATE TRIGGER trg_new_user
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ════════════════════════════════════════════════════════════════
-- NOTES DE MODERACIÓ (per implementar quan calgui)
-- ════════════════════════════════════════════════════════════════
--
-- Per ocultar un post o comentari com a moderador:
--   UPDATE public.posts    SET hidden = true WHERE id = '…';
--   UPDATE public.comments SET hidden = true WHERE id = '…';
--   (Executa des del SQL Editor amb el rol service_role)
--
-- Per assignar moderadors en el futur, afegir:
--   CREATE TABLE public.moderators (
--     user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
--     granted_at timestamptz DEFAULT now()
--   );
--   ALTER TABLE public.moderators ENABLE ROW LEVEL SECURITY;
--   CREATE POLICY "mod_self_check" ON public.moderators
--     FOR SELECT TO authenticated USING (auth.uid() = user_id);
--   -- Sense política d'escriptura: gestionat via service_role
--
-- Per veure reports pendents:
--   SELECT r.*, p.username AS reporter
--   FROM public.reports r
--   LEFT JOIN public.profiles p ON p.id = r.reporter_id
--   WHERE r.resolved = false
--   ORDER BY r.created_at DESC;
--
-- ════════════════════════════════════════════════════════════════

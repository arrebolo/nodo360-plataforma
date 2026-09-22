-- ============================================================================
-- MIGRACION 023: Projects System (Phase 27)
--
-- SUSTITUYE A docs/migrations/019_projects_system.sql, que queda marcada como
-- obsoleta y NO debe ejecutarse. Aquella nunca se aplico: las cuatro tablas no
-- existen en la base de datos.
--
-- El numero 019 ya estaba ocupado en esta carpeta por 019_mentor_course_review.sql,
-- de ahi la renumeracion a 023.
-- ============================================================================

-- Revision del original, cambio a cambio:
-- Revisada contra el esquema real de gcahtbecfidroepelcuw el 2026-09-21.
--
-- Cambios respecto al original docs/migrations/019_projects_system.sql:
--   1. Idempotente: DROP POLICY IF EXISTS antes de cada CREATE POLICY.
--   2. El enum course_review_vote se crea aqui si falta (el original dependia
--      de un DO block de la 016 que crea el tipo pero no lo usa).
--   3. Eliminada la recursion mutua de RLS projects <-> project_collaborators,
--      que habria provocado 42P17 "infinite recursion detected in policy".
--      Las politicas ya no hacen subconsultas entre tablas: usan funciones
--      SECURITY DEFINER.
--   4. Corregida la referencia ambigua "WHERE project_id = id", que comparaba
--      dos columnas de project_collaborators y nunca era cierta.
--   5. Todas las politicas UPDATE llevan WITH CHECK explicito. El original lo
--      omitia y Postgres reutiliza USING, lo que permitia al autor pasar su
--      propio proyecto a 'approved' saltandose la revision de dos mentores.
--   6. Trigger de transiciones de estado para el autor, con orden de ejecucion
--      explicito (01/02/03) para que no choque con el bump de ronda.
--   7. Trigger que impide a un colaborador mover su fila a otro proyecto.
--   8. REVOKE/GRANT explicitos: anon solo lee projects y project_updates.
--   9. SET search_path en todas las funciones SECURITY DEFINER.
--  10. is_admin se llama con notacion nombrada (check_user_id => ...).
--
-- Dependencias verificadas como existentes en la BD:
--   users(id, role, is_suspended) · entitlements(user_id, type, is_active,
--   expires_at) con entitlement_type que incluye 'full_platform' ·
--   courses(level, status) · course_enrollments(user_id, course_id,
--   completed_at) · update_updated_at_column() · is_admin(check_user_id uuid)
-- ============================================================================

BEGIN;

-- =====================================================
-- 1. ENUMS
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_status') THEN
    CREATE TYPE project_status AS ENUM (
      'draft', 'pending_review', 'changes_requested', 'approved',
      'in_progress', 'completed', 'rejected', 'archived'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_category') THEN
    CREATE TYPE project_category AS ENUM (
      'bitcoin', 'lightning', 'defi', 'education', 'tools', 'general'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_collaborator_status') THEN
    CREATE TYPE project_collaborator_status AS ENUM ('pending', 'accepted', 'declined');
  END IF;
END $$;

-- course_review_vote lo crea la migracion 016 en un DO block, pero su propia
-- tabla usa TEXT + CHECK, asi que el tipo queda creado y sin usar. Se recrea
-- aqui de forma defensiva para que esta migracion no dependa de ese efecto
-- colateral.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'course_review_vote') THEN
    CREATE TYPE course_review_vote AS ENUM ('approve', 'request_changes');
  END IF;
END $$;

-- =====================================================
-- 2. TABLAS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  description TEXT NOT NULL,
  category project_category NOT NULL DEFAULT 'general',

  status project_status NOT NULL DEFAULT 'draft',
  current_review_round INT NOT NULL DEFAULT 0,

  is_public BOOLEAN NOT NULL DEFAULT true,

  rejection_reason TEXT,
  approved_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_projects_author   ON public.projects(author_id);
CREATE INDEX IF NOT EXISTS idx_projects_status   ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_category ON public.projects(category);
CREATE INDEX IF NOT EXISTS idx_projects_public   ON public.projects(is_public, status)
  WHERE status IN ('approved', 'in_progress', 'completed');

CREATE TABLE IF NOT EXISTS public.project_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  review_round INT NOT NULL DEFAULT 1,
  vote course_review_vote NOT NULL,
  feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (project_id, reviewer_id, review_round)
);

CREATE INDEX IF NOT EXISTS idx_project_reviews_project ON public.project_reviews(project_id);
CREATE INDEX IF NOT EXISTS idx_project_reviews_round   ON public.project_reviews(project_id, review_round);

CREATE TABLE IF NOT EXISTS public.project_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status project_collaborator_status NOT NULL DEFAULT 'pending',
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_project_collaborators_project ON public.project_collaborators(project_id);
CREATE INDEX IF NOT EXISTS idx_project_collaborators_user    ON public.project_collaborators(user_id);

CREATE TABLE IF NOT EXISTS public.project_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_updates_project ON public.project_updates(project_id);

-- =====================================================
-- 3. FUNCIONES AUXILIARES PARA RLS
-- =====================================================
-- Son SECURITY DEFINER a proposito: al saltarse RLS rompen la recursion mutua
-- entre las politicas de projects y las de project_collaborators. Sin ellas,
-- leer projects dispara una politica que consulta project_collaborators, cuya
-- politica vuelve a consultar projects -> error 42P17.

CREATE OR REPLACE FUNCTION public.user_has_role(p_user_id UUID, p_roles TEXT[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = p_user_id AND role::TEXT = ANY(p_roles)
  );
$$;

CREATE OR REPLACE FUNCTION public.is_project_author(p_project_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = p_project_id AND author_id = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_project_collaborator(p_project_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_collaborators
    WHERE project_id = p_project_id
      AND user_id = p_user_id
      AND status = 'accepted'
  );
$$;

CREATE OR REPLACE FUNCTION public.project_is_publicly_visible(p_project_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = p_project_id
      AND is_public = true
      AND status IN ('approved', 'in_progress', 'completed')
  );
$$;

-- =====================================================
-- 4. FUNCIONES DE NEGOCIO
-- =====================================================

CREATE OR REPLACE FUNCTION public.check_project_eligibility(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_is_suspended BOOLEAN;
  v_is_premium BOOLEAN;
  v_beginner_courses_total INT;
  v_beginner_courses_completed INT;
BEGIN
  SELECT COALESCE(is_suspended, false) INTO v_is_suspended
  FROM public.users
  WHERE id = p_user_id;

  IF v_is_suspended IS NULL OR v_is_suspended THEN
    RETURN false;
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.entitlements
    WHERE user_id = p_user_id
      AND type = 'full_platform'
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > now())
  ) INTO v_is_premium;

  IF NOT v_is_premium THEN
    RETURN false;
  END IF;

  SELECT COUNT(*) INTO v_beginner_courses_total
  FROM public.courses
  WHERE level = 'beginner' AND status = 'published';

  IF v_beginner_courses_total = 0 THEN
    RETURN true;
  END IF;

  SELECT COUNT(DISTINCT ce.course_id) INTO v_beginner_courses_completed
  FROM public.course_enrollments ce
  JOIN public.courses c ON c.id = ce.course_id
  WHERE ce.user_id = p_user_id
    AND ce.completed_at IS NOT NULL
    AND c.level = 'beginner'
    AND c.status = 'published';

  RETURN v_beginner_courses_completed >= v_beginner_courses_total;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_project_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_approve_count INT;
  v_current_round INT;
BEGIN
  IF NEW.vote <> 'approve' THEN
    RETURN NEW;
  END IF;

  SELECT current_review_round INTO v_current_round
  FROM public.projects
  WHERE id = NEW.project_id;

  SELECT COUNT(*) INTO v_approve_count
  FROM public.project_reviews
  WHERE project_id = NEW.project_id
    AND review_round = v_current_round
    AND vote = 'approve';

  IF v_approve_count >= 2 THEN
    UPDATE public.projects
    SET status = 'approved',
        approved_at = now(),
        updated_at = now()
    WHERE id = NEW.project_id
      AND status = 'pending_review';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.bump_project_review_round()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.status = 'pending_review' AND OLD.status IN ('draft', 'changes_requested') THEN
    NEW.current_review_round := OLD.current_review_round + 1;
  END IF;

  RETURN NEW;
END;
$$;

-- Limita lo que el autor puede cambiar. WITH CHECK no ve la fila antigua, asi
-- que la maquina de estados se aplica aqui.
CREATE OR REPLACE FUNCTION public.enforce_project_author_limits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Sin sesion JWT solo se llega desde service_role (codigo de servidor, que
  -- ademas se salta RLS). No se restringe.
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF is_admin(check_user_id => auth.uid())
     OR user_has_role(auth.uid(), ARRAY['mentor', 'admin']) THEN
    RETURN NEW;
  END IF;

  -- La autoria no se reasigna
  NEW.author_id := OLD.author_id;

  -- Campos que solo mueve el flujo de revision
  NEW.approved_at        := OLD.approved_at;
  NEW.rejection_reason   := OLD.rejection_reason;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NOT (
         (OLD.status = 'draft'             AND NEW.status = 'pending_review')
      OR (OLD.status = 'changes_requested' AND NEW.status = 'pending_review')
      OR (OLD.status = 'approved'          AND NEW.status = 'in_progress')
      OR (OLD.status = 'in_progress'       AND NEW.status = 'completed')
      OR (OLD.status = 'draft'             AND NEW.status = 'draft')
    ) THEN
      RAISE EXCEPTION
        'Transicion de estado no permitida para el autor: % -> %', OLD.status, NEW.status
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Impide que un colaborador mueva su fila a otro proyecto o se la asigne a
-- otra persona. Sin esto, la politica de UPDATE (que solo puede comprobar
-- user_id = auth.uid()) permitiria cambiar project_id a voluntad.
CREATE OR REPLACE FUNCTION public.enforce_collaborator_row_identity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL OR is_admin(check_user_id => auth.uid()) THEN
    RETURN NEW;
  END IF;

  NEW.project_id := OLD.project_id;
  NEW.user_id    := OLD.user_id;
  NEW.invited_by := OLD.invited_by;

  IF NEW.status = 'accepted' AND OLD.status <> 'accepted' THEN
    NEW.joined_at := COALESCE(NEW.joined_at, now());
  END IF;

  RETURN NEW;
END;
$$;

-- =====================================================
-- 5. TRIGGERS
-- =====================================================
-- Los triggers BEFORE de una misma tabla se ejecutan en orden alfabetico de
-- nombre. El prefijo numerico fija el orden: primero se limita al autor,
-- despues se sube la ronda, por ultimo se sella updated_at.

DROP TRIGGER IF EXISTS trigger_01_enforce_project_author_limits ON public.projects;
CREATE TRIGGER trigger_01_enforce_project_author_limits
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_project_author_limits();

DROP TRIGGER IF EXISTS trigger_02_bump_review_round ON public.projects;
CREATE TRIGGER trigger_02_bump_review_round
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.bump_project_review_round();

DROP TRIGGER IF EXISTS trigger_03_projects_updated_at ON public.projects;
CREATE TRIGGER trigger_03_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_check_project_approval ON public.project_reviews;
CREATE TRIGGER trigger_check_project_approval
  AFTER INSERT ON public.project_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.check_project_approval();

DROP TRIGGER IF EXISTS trigger_enforce_collaborator_row_identity ON public.project_collaborators;
CREATE TRIGGER trigger_enforce_collaborator_row_identity
  BEFORE UPDATE ON public.project_collaborators
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_collaborator_row_identity();

-- =====================================================
-- 6. PRIVILEGIOS DE TABLA
-- =====================================================
-- Supabase concede por defecto ALL sobre las tablas nuevas de public a anon y
-- authenticated. La migracion original no lo revocaba, asi que anon quedaba
-- con INSERT/UPDATE/DELETE a nivel de tabla, contenido solo por RLS. Aqui se
-- fija el privilegio minimo de forma explicita.

REVOKE ALL ON public.projects              FROM anon, authenticated;
REVOKE ALL ON public.project_reviews       FROM anon, authenticated;
REVOKE ALL ON public.project_collaborators FROM anon, authenticated;
REVOKE ALL ON public.project_updates       FROM anon, authenticated;

-- anon: solo lectura, y solo de lo que ya es publico por RLS
GRANT SELECT ON public.projects        TO anon;
GRANT SELECT ON public.project_updates TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects              TO authenticated;
GRANT SELECT, INSERT                 ON public.project_reviews       TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_collaborators TO authenticated;
GRANT SELECT, INSERT, DELETE         ON public.project_updates       TO authenticated;

GRANT ALL ON public.projects              TO service_role;
GRANT ALL ON public.project_reviews       TO service_role;
GRANT ALL ON public.project_collaborators TO service_role;
GRANT ALL ON public.project_updates       TO service_role;

-- =====================================================
-- 7. ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.projects              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_reviews       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_updates       ENABLE ROW LEVEL SECURITY;

-- ---------- 7.1 projects ----------

DROP POLICY IF EXISTS "projects_public_read" ON public.projects;
CREATE POLICY "projects_public_read" ON public.projects
  FOR SELECT USING (
    is_public = true
    AND status IN ('approved', 'in_progress', 'completed')
  );

DROP POLICY IF EXISTS "projects_author_read" ON public.projects;
CREATE POLICY "projects_author_read" ON public.projects
  FOR SELECT USING (author_id = auth.uid());

-- Corregido: el original hacia "WHERE project_id = id" dentro de una
-- subconsulta sobre project_collaborators, donde ambas columnas existen, de
-- modo que comparaba pc.project_id con pc.id y nunca era cierto. Ademas
-- provocaba recursion mutua con las politicas de project_collaborators.
DROP POLICY IF EXISTS "projects_collaborator_read" ON public.projects;
CREATE POLICY "projects_collaborator_read" ON public.projects
  FOR SELECT USING (is_project_collaborator(id, auth.uid()));

DROP POLICY IF EXISTS "projects_mentor_read" ON public.projects;
CREATE POLICY "projects_mentor_read" ON public.projects
  FOR SELECT USING (
    status = 'pending_review'
    AND user_has_role(auth.uid(), ARRAY['mentor', 'admin'])
  );

DROP POLICY IF EXISTS "projects_admin_read" ON public.projects;
CREATE POLICY "projects_admin_read" ON public.projects
  FOR SELECT USING (is_admin(check_user_id => auth.uid()));

DROP POLICY IF EXISTS "projects_author_insert" ON public.projects;
CREATE POLICY "projects_author_insert" ON public.projects
  FOR INSERT WITH CHECK (
    author_id = auth.uid()
    AND status = 'draft'
    AND current_review_round = 0
    AND approved_at IS NULL
  );

-- WITH CHECK explicito. En el original se omitia y Postgres reutiliza la
-- expresion de USING, con lo que el autor podia pasar su borrador
-- directamente a 'approved'. Que estados puede tocar lo decide ahora el
-- trigger trigger_01_enforce_project_author_limits.
DROP POLICY IF EXISTS "projects_author_update" ON public.projects;
CREATE POLICY "projects_author_update" ON public.projects
  FOR UPDATE
  USING (
    author_id = auth.uid()
    AND status IN ('draft', 'changes_requested', 'approved', 'in_progress')
  )
  WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS "projects_admin_update" ON public.projects;
CREATE POLICY "projects_admin_update" ON public.projects
  FOR UPDATE
  USING (is_admin(check_user_id => auth.uid()))
  WITH CHECK (is_admin(check_user_id => auth.uid()));

DROP POLICY IF EXISTS "projects_mentor_update" ON public.projects;
CREATE POLICY "projects_mentor_update" ON public.projects
  FOR UPDATE
  USING (
    status = 'pending_review'
    AND user_has_role(auth.uid(), ARRAY['mentor', 'admin'])
  )
  WITH CHECK (user_has_role(auth.uid(), ARRAY['mentor', 'admin']));

DROP POLICY IF EXISTS "projects_author_delete" ON public.projects;
CREATE POLICY "projects_author_delete" ON public.projects
  FOR DELETE USING (
    author_id = auth.uid()
    AND status = 'draft'
  );

DROP POLICY IF EXISTS "projects_admin_delete" ON public.projects;
CREATE POLICY "projects_admin_delete" ON public.projects
  FOR DELETE USING (is_admin(check_user_id => auth.uid()));

-- ---------- 7.2 project_reviews ----------

DROP POLICY IF EXISTS "project_reviews_mentor_read" ON public.project_reviews;
CREATE POLICY "project_reviews_mentor_read" ON public.project_reviews
  FOR SELECT USING (user_has_role(auth.uid(), ARRAY['mentor', 'admin']));

DROP POLICY IF EXISTS "project_reviews_author_read" ON public.project_reviews;
CREATE POLICY "project_reviews_author_read" ON public.project_reviews
  FOR SELECT USING (is_project_author(project_id, auth.uid()));

DROP POLICY IF EXISTS "project_reviews_mentor_insert" ON public.project_reviews;
CREATE POLICY "project_reviews_mentor_insert" ON public.project_reviews
  FOR INSERT WITH CHECK (
    user_has_role(auth.uid(), ARRAY['mentor', 'admin'])
    AND reviewer_id = auth.uid()
    -- Un mentor no revisa su propio proyecto
    AND NOT is_project_author(project_id, auth.uid())
  );

-- Sin politicas de UPDATE ni DELETE: una review emitida no se modifica.

-- ---------- 7.3 project_collaborators ----------

DROP POLICY IF EXISTS "collaborators_author_read" ON public.project_collaborators;
CREATE POLICY "collaborators_author_read" ON public.project_collaborators
  FOR SELECT USING (is_project_author(project_id, auth.uid()));

DROP POLICY IF EXISTS "collaborators_self_read" ON public.project_collaborators;
CREATE POLICY "collaborators_self_read" ON public.project_collaborators
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "collaborators_admin_read" ON public.project_collaborators;
CREATE POLICY "collaborators_admin_read" ON public.project_collaborators
  FOR SELECT USING (is_admin(check_user_id => auth.uid()));

DROP POLICY IF EXISTS "collaborators_author_insert" ON public.project_collaborators;
CREATE POLICY "collaborators_author_insert" ON public.project_collaborators
  FOR INSERT WITH CHECK (
    is_project_author(project_id, auth.uid())
    AND invited_by = auth.uid()
    AND status = 'pending'
  );

-- WITH CHECK anade el pin de identidad; el trigger
-- trigger_enforce_collaborator_row_identity impide ademas mover la fila a
-- otro proyecto, que WITH CHECK por si solo no puede evitar.
DROP POLICY IF EXISTS "collaborators_self_update" ON public.project_collaborators;
CREATE POLICY "collaborators_self_update" ON public.project_collaborators
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND status IN ('accepted', 'declined')
  );

DROP POLICY IF EXISTS "collaborators_author_delete" ON public.project_collaborators;
CREATE POLICY "collaborators_author_delete" ON public.project_collaborators
  FOR DELETE USING (is_project_author(project_id, auth.uid()));

DROP POLICY IF EXISTS "collaborators_self_delete" ON public.project_collaborators;
CREATE POLICY "collaborators_self_delete" ON public.project_collaborators
  FOR DELETE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "collaborators_admin_all" ON public.project_collaborators;
CREATE POLICY "collaborators_admin_all" ON public.project_collaborators
  FOR ALL
  USING (is_admin(check_user_id => auth.uid()))
  WITH CHECK (is_admin(check_user_id => auth.uid()));

-- ---------- 7.4 project_updates ----------

DROP POLICY IF EXISTS "updates_public_read" ON public.project_updates;
CREATE POLICY "updates_public_read" ON public.project_updates
  FOR SELECT USING (project_is_publicly_visible(project_id));

-- El original no tenia esta politica: el autor de un proyecto archivado o
-- rechazado perdia el acceso a sus propias actualizaciones.
DROP POLICY IF EXISTS "updates_author_read" ON public.project_updates;
CREATE POLICY "updates_author_read" ON public.project_updates
  FOR SELECT USING (
    is_project_author(project_id, auth.uid())
    OR is_project_collaborator(project_id, auth.uid())
  );

DROP POLICY IF EXISTS "updates_admin_read" ON public.project_updates;
CREATE POLICY "updates_admin_read" ON public.project_updates
  FOR SELECT USING (is_admin(check_user_id => auth.uid()));

DROP POLICY IF EXISTS "updates_author_insert" ON public.project_updates;
CREATE POLICY "updates_author_insert" ON public.project_updates
  FOR INSERT WITH CHECK (
    author_id = auth.uid()
    AND is_project_author(project_id, auth.uid())
  );

DROP POLICY IF EXISTS "updates_collaborator_insert" ON public.project_updates;
CREATE POLICY "updates_collaborator_insert" ON public.project_updates
  FOR INSERT WITH CHECK (
    author_id = auth.uid()
    AND is_project_collaborator(project_id, auth.uid())
  );

-- Faltaba: la ruta DELETE /api/projects/[id]/updates/[updateId] existe.
DROP POLICY IF EXISTS "updates_author_delete" ON public.project_updates;
CREATE POLICY "updates_author_delete" ON public.project_updates
  FOR DELETE USING (
    author_id = auth.uid()
    OR is_project_author(project_id, auth.uid())
  );

DROP POLICY IF EXISTS "updates_admin_delete" ON public.project_updates;
CREATE POLICY "updates_admin_delete" ON public.project_updates
  FOR DELETE USING (is_admin(check_user_id => auth.uid()));

-- =====================================================
-- 8. COMENTARIOS
-- =====================================================

COMMENT ON TABLE public.projects              IS 'Proyectos comunitarios propuestos por usuarios';
COMMENT ON TABLE public.project_reviews       IS 'Reviews de mentores sobre proyectos (2 aprobaciones = approved)';
COMMENT ON TABLE public.project_collaborators IS 'Colaboradores invitados a proyectos';
COMMENT ON TABLE public.project_updates       IS 'Actualizaciones de progreso de proyectos';
COMMENT ON FUNCTION public.check_project_eligibility IS 'Verifica si un usuario puede crear proyectos (sin suspension + entitlement full_platform + cursos beginner completados)';
COMMENT ON FUNCTION public.enforce_project_author_limits IS 'Limita las transiciones de estado y los campos que puede tocar el autor; evita la autoaprobacion';
COMMENT ON FUNCTION public.is_project_collaborator IS 'SECURITY DEFINER para usar en politicas RLS sin provocar recursion entre projects y project_collaborators';

COMMIT;

-- ============================================================================
-- COMPROBACIONES POSTERIORES (ejecutar aparte, no forman parte de la migracion)
-- ============================================================================
-- 1. Que no haya recursion: como usuario autenticado normal,
--      SELECT id, title FROM projects LIMIT 5;
--    No debe devolver 42P17.
--
-- 2. Que el autor no pueda autoaprobarse: con sesion del autor de un borrador,
--      UPDATE projects SET status = 'approved' WHERE id = '<id>';
--    Debe fallar con 'Transicion de estado no permitida para el autor'.
--
-- 3. Privilegios de anon:
--      SELECT grantee, privilege_type FROM information_schema.role_table_grants
--      WHERE table_name IN ('projects','project_reviews','project_collaborators','project_updates')
--        AND grantee = 'anon';
--    Solo debe aparecer SELECT sobre projects y project_updates.

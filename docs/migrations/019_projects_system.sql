-- ============================================
-- MIGRATION 019: Projects System (Phase 27)
-- Fecha: 6 Febrero 2026
-- Descripción: Sistema de proyectos comunitarios
-- ============================================

-- =====================================================
-- 1. ENUMS
-- =====================================================

-- project_status enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_status') THEN
    CREATE TYPE project_status AS ENUM (
      'draft',
      'pending_review',
      'changes_requested',
      'approved',
      'in_progress',
      'completed',
      'rejected',
      'archived'
    );
  END IF;
END $$;

-- project_category enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_category') THEN
    CREATE TYPE project_category AS ENUM (
      'bitcoin',
      'lightning',
      'defi',
      'education',
      'tools',
      'general'
    );
  END IF;
END $$;

-- project_collaborator_status enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_collaborator_status') THEN
    CREATE TYPE project_collaborator_status AS ENUM (
      'pending',
      'accepted',
      'declined'
    );
  END IF;
END $$;

-- =====================================================
-- 2. TABLES
-- =====================================================

-- 2.1 projects
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Contenido
  title TEXT NOT NULL,
  summary TEXT NOT NULL,                     -- Resumen corto (max 300 chars)
  description TEXT NOT NULL,                 -- Descripción completa (HTML)
  category project_category NOT NULL DEFAULT 'general',

  -- Estado
  status project_status NOT NULL DEFAULT 'draft',
  current_review_round INT NOT NULL DEFAULT 0,

  -- Visibilidad
  is_public BOOLEAN NOT NULL DEFAULT true,

  -- Metadata
  rejection_reason TEXT,
  approved_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_projects_author ON projects(author_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);
CREATE INDEX IF NOT EXISTS idx_projects_public ON projects(is_public, status)
  WHERE status IN ('approved', 'in_progress', 'completed');

-- 2.2 project_reviews
CREATE TABLE IF NOT EXISTS project_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  review_round INT NOT NULL DEFAULT 1,
  vote course_review_vote NOT NULL,
  feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(project_id, reviewer_id, review_round)
);

CREATE INDEX IF NOT EXISTS idx_project_reviews_project ON project_reviews(project_id);
CREATE INDEX IF NOT EXISTS idx_project_reviews_round ON project_reviews(project_id, review_round);

-- 2.3 project_collaborators
CREATE TABLE IF NOT EXISTS project_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status project_collaborator_status NOT NULL DEFAULT 'pending',
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_project_collaborators_project ON project_collaborators(project_id);
CREATE INDEX IF NOT EXISTS idx_project_collaborators_user ON project_collaborators(user_id);

-- 2.4 project_updates
CREATE TABLE IF NOT EXISTS project_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_updates_project ON project_updates(project_id);

-- =====================================================
-- 3. FUNCTIONS
-- =====================================================

-- 3.1 Check project eligibility
CREATE OR REPLACE FUNCTION check_project_eligibility(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_suspended BOOLEAN;
  v_is_premium BOOLEAN;
  v_beginner_courses_total INT;
  v_beginner_courses_completed INT;
BEGIN
  -- 1. Verificar suspensión
  SELECT COALESCE(is_suspended, false) INTO v_is_suspended
  FROM users
  WHERE id = p_user_id;

  IF v_is_suspended THEN
    RETURN false;
  END IF;

  -- 2. Verificar entitlement premium activo (full_platform)
  SELECT EXISTS(
    SELECT 1 FROM entitlements
    WHERE user_id = p_user_id
      AND type = 'full_platform'
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > now())
  ) INTO v_is_premium;

  IF NOT v_is_premium THEN
    RETURN false;
  END IF;

  -- 3. Verificar cursos beginner completados
  SELECT COUNT(*) INTO v_beginner_courses_total
  FROM courses
  WHERE level = 'beginner' AND status = 'published';

  -- Si no hay cursos beginner, usuario es elegible
  IF v_beginner_courses_total = 0 THEN
    RETURN true;
  END IF;

  SELECT COUNT(DISTINCT ce.course_id) INTO v_beginner_courses_completed
  FROM course_enrollments ce
  JOIN courses c ON c.id = ce.course_id
  WHERE ce.user_id = p_user_id
    AND ce.completed_at IS NOT NULL
    AND c.level = 'beginner'
    AND c.status = 'published';

  RETURN v_beginner_courses_completed >= v_beginner_courses_total;
END;
$$;

-- 3.2 Auto-approve with 2 mentor votes
CREATE OR REPLACE FUNCTION check_project_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_approve_count INT;
  v_current_round INT;
BEGIN
  -- Solo procesar si el voto es 'approve'
  IF NEW.vote != 'approve' THEN
    RETURN NEW;
  END IF;

  -- Obtener ronda actual del proyecto
  SELECT current_review_round INTO v_current_round
  FROM projects
  WHERE id = NEW.project_id;

  -- Contar aprobaciones SOLO de la ronda actual
  SELECT COUNT(*) INTO v_approve_count
  FROM project_reviews
  WHERE project_id = NEW.project_id
    AND review_round = v_current_round
    AND vote = 'approve';

  -- Si hay 2+ aprobaciones, aprobar proyecto
  IF v_approve_count >= 2 THEN
    UPDATE projects
    SET status = 'approved',
        approved_at = now(),
        updated_at = now()
    WHERE id = NEW.project_id
      AND status = 'pending_review';
  END IF;

  RETURN NEW;
END;
$$;

-- 3.3 Bump review round on resubmit
CREATE OR REPLACE FUNCTION bump_project_review_round()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Cuando un proyecto pasa a pending_review desde draft o changes_requested
  IF NEW.status = 'pending_review' AND OLD.status IN ('draft', 'changes_requested') THEN
    NEW.current_review_round := OLD.current_review_round + 1;
  END IF;

  RETURN NEW;
END;
$$;

-- =====================================================
-- 4. TRIGGERS
-- =====================================================

DROP TRIGGER IF EXISTS trigger_check_project_approval ON project_reviews;
CREATE TRIGGER trigger_check_project_approval
  AFTER INSERT ON project_reviews
  FOR EACH ROW
  EXECUTE FUNCTION check_project_approval();

DROP TRIGGER IF EXISTS trigger_bump_review_round ON projects;
CREATE TRIGGER trigger_bump_review_round
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION bump_project_review_round();

DROP TRIGGER IF EXISTS trigger_projects_updated_at ON projects;
CREATE TRIGGER trigger_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. ROW LEVEL SECURITY
-- =====================================================

-- 5.1 projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Público: proyectos visibles aprobados+
CREATE POLICY "projects_public_read" ON projects
  FOR SELECT USING (
    is_public = true
    AND status IN ('approved', 'in_progress', 'completed')
  );

-- Autor: ve sus propios proyectos
CREATE POLICY "projects_author_read" ON projects
  FOR SELECT USING (author_id = auth.uid());

-- Colaboradores aceptados: ven el proyecto
CREATE POLICY "projects_collaborator_read" ON projects
  FOR SELECT USING (
    EXISTS(
      SELECT 1 FROM project_collaborators
      WHERE project_id = id
        AND user_id = auth.uid()
        AND status = 'accepted'
    )
  );

-- Mentores: ven proyectos en revisión
CREATE POLICY "projects_mentor_read" ON projects
  FOR SELECT USING (
    status = 'pending_review'
    AND EXISTS(
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('mentor', 'admin')
    )
  );

-- Admin: ve todo
CREATE POLICY "projects_admin_read" ON projects
  FOR SELECT USING (is_admin(auth.uid()));

-- Autor: puede insertar
CREATE POLICY "projects_author_insert" ON projects
  FOR INSERT WITH CHECK (author_id = auth.uid());

-- Autor: puede actualizar en ciertos estados
CREATE POLICY "projects_author_update" ON projects
  FOR UPDATE USING (
    author_id = auth.uid()
    AND status IN ('draft', 'changes_requested', 'approved', 'in_progress')
  );

-- Admin: puede actualizar cualquier proyecto
CREATE POLICY "projects_admin_update" ON projects
  FOR UPDATE USING (is_admin(auth.uid()));

-- Autor: puede borrar solo drafts
CREATE POLICY "projects_author_delete" ON projects
  FOR DELETE USING (
    author_id = auth.uid()
    AND status = 'draft'
  );

-- 5.2 project_reviews
ALTER TABLE project_reviews ENABLE ROW LEVEL SECURITY;

-- Mentores y admin leen reviews
CREATE POLICY "project_reviews_mentor_read" ON project_reviews
  FOR SELECT USING (
    EXISTS(
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('mentor', 'admin')
    )
  );

-- Autor del proyecto lee reviews de su proyecto
CREATE POLICY "project_reviews_author_read" ON project_reviews
  FOR SELECT USING (
    EXISTS(
      SELECT 1 FROM projects WHERE id = project_id AND author_id = auth.uid()
    )
  );

-- Solo mentores insertan reviews
CREATE POLICY "project_reviews_mentor_insert" ON project_reviews
  FOR INSERT WITH CHECK (
    EXISTS(
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('mentor', 'admin')
    )
    AND reviewer_id = auth.uid()
  );

-- 5.3 project_collaborators
ALTER TABLE project_collaborators ENABLE ROW LEVEL SECURITY;

-- Autor del proyecto ve todos los colaboradores
CREATE POLICY "collaborators_author_read" ON project_collaborators
  FOR SELECT USING (
    EXISTS(
      SELECT 1 FROM projects WHERE id = project_id AND author_id = auth.uid()
    )
  );

-- Colaborador ve su propia invitación
CREATE POLICY "collaborators_self_read" ON project_collaborators
  FOR SELECT USING (user_id = auth.uid());

-- Solo el autor del proyecto invita
CREATE POLICY "collaborators_author_insert" ON project_collaborators
  FOR INSERT WITH CHECK (
    EXISTS(
      SELECT 1 FROM projects WHERE id = project_id AND author_id = auth.uid()
    )
    AND invited_by = auth.uid()
  );

-- Colaborador actualiza su invitación (aceptar/rechazar)
CREATE POLICY "collaborators_self_update" ON project_collaborators
  FOR UPDATE USING (user_id = auth.uid());

-- Autor elimina colaboradores
CREATE POLICY "collaborators_author_delete" ON project_collaborators
  FOR DELETE USING (
    EXISTS(
      SELECT 1 FROM projects WHERE id = project_id AND author_id = auth.uid()
    )
  );

-- Admin gestiona todo
CREATE POLICY "collaborators_admin_all" ON project_collaborators
  FOR ALL USING (is_admin(auth.uid()));

-- 5.4 project_updates
ALTER TABLE project_updates ENABLE ROW LEVEL SECURITY;

-- Público: updates de proyectos públicos aprobados+
CREATE POLICY "updates_public_read" ON project_updates
  FOR SELECT USING (
    EXISTS(
      SELECT 1 FROM projects
      WHERE id = project_id
        AND is_public = true
        AND status IN ('approved', 'in_progress', 'completed')
    )
  );

-- Autor del proyecto inserta updates
CREATE POLICY "updates_author_insert" ON project_updates
  FOR INSERT WITH CHECK (
    EXISTS(
      SELECT 1 FROM projects
      WHERE id = project_id
        AND author_id = auth.uid()
        AND status IN ('approved', 'in_progress', 'completed')
    )
    AND author_id = auth.uid()
  );

-- Colaboradores aceptados insertan updates
CREATE POLICY "updates_collaborator_insert" ON project_updates
  FOR INSERT WITH CHECK (
    EXISTS(
      SELECT 1 FROM project_collaborators
      WHERE project_id = project_updates.project_id
        AND user_id = auth.uid()
        AND status = 'accepted'
    )
    AND author_id = auth.uid()
  );

-- Admin ve todo
CREATE POLICY "updates_admin_read" ON project_updates
  FOR SELECT USING (is_admin(auth.uid()));

-- =====================================================
-- 6. COMMENTS
-- =====================================================

COMMENT ON TABLE projects IS 'Proyectos comunitarios propuestos por usuarios';
COMMENT ON TABLE project_reviews IS 'Reviews de mentores sobre proyectos (2 aprobaciones = approved)';
COMMENT ON TABLE project_collaborators IS 'Colaboradores invitados a proyectos';
COMMENT ON TABLE project_updates IS 'Actualizaciones de progreso de proyectos';
COMMENT ON FUNCTION check_project_eligibility IS 'Verifica si usuario puede crear proyectos (premium + cursos básicos)';

-- =====================================================
-- MIGRACIÓN 009: SISTEMA DE MENTORES
-- =====================================================
-- Fecha: 2026-01-23
-- Descripción: Sistema completo de mentores con:
--   - Configuración global (plazas, mínimos, cooldowns)
--   - Sistema de puntos (650 mínimo para aplicar)
--   - Aplicaciones y votaciones
--   - Stats mensuales con mínimos obligatorios
--   - Avisos (2 antes de expulsión)
--   - Licencias (máx 60 días/año)
--   - Plazas: 2% hasta 20, 1% hasta 50, 0.75% después, mín 3
--   - Votación: <20 admin designa, 20+ votación secreta
--     (60% quórum, 66% aprobación, 14 días)
--   - Cooldown 6 meses para reaplicar
-- =====================================================


-- #####################################################
-- SECCIÓN 1: CONFIGURACIÓN GLOBAL DE MENTORES
-- #####################################################

CREATE TABLE IF NOT EXISTS public.mentor_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Clave de configuración
  config_key TEXT NOT NULL UNIQUE,
  config_value JSONB NOT NULL,

  -- Descripción
  description TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Insertar configuración inicial
INSERT INTO public.mentor_config (config_key, config_value, description) VALUES
('min_points_to_apply', '650', 'Puntos mínimos para aplicar a mentor'),
('plaza_tiers', '{"tier1_max": 20, "tier1_pct": 2, "tier2_max": 50, "tier2_pct": 1, "tier3_pct": 0.75, "minimum": 3}', 'Tiers de plazas: 2% hasta 20, 1% hasta 50, 0.75% después, mínimo 3'),
('monthly_minimums', '{"active_days": 10, "community_responses": 5, "content_reviews": 2, "governance_votes": 1, "mentoring_sessions": 1}', 'Mínimos mensuales obligatorios'),
('max_warnings', '2', 'Número de avisos antes de expulsión'),
('max_leave_days_year', '60', 'Máximo de días de licencia por año'),
('cooldown_months', '6', 'Meses de espera para reaplicar tras rechazo/expulsión'),
('voting_threshold', '20', 'Número de mentores a partir del cual se usa votación secreta'),
('voting_quorum_pct', '60', 'Porcentaje de quórum para votación válida'),
('voting_approval_pct', '66', 'Porcentaje de aprobación necesario'),
('voting_duration_days', '14', 'Duración de la votación en días')
ON CONFLICT (config_key) DO NOTHING;


-- #####################################################
-- SECCIÓN 2: PUNTOS DE MENTOR
-- #####################################################

CREATE TABLE IF NOT EXISTS public.mentor_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Categoría del punto
  category TEXT NOT NULL CHECK (category IN (
    'course_completion', 'lesson_completion', 'community_help',
    'content_review', 'mentoring_session', 'governance_participation',
    'badge_earned', 'streak_bonus', 'other'
  )),

  -- Puntos otorgados
  points INTEGER NOT NULL,

  -- Referencia opcional
  reference_type TEXT,
  reference_id UUID,

  -- Descripción
  description TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_mentor_points_user ON public.mentor_points(user_id);
CREATE INDEX IF NOT EXISTS idx_mentor_points_category ON public.mentor_points(user_id, category);
CREATE INDEX IF NOT EXISTS idx_mentor_points_created ON public.mentor_points(created_at DESC);


-- #####################################################
-- SECCIÓN 3: APLICACIONES DE MENTOR
-- #####################################################

CREATE TABLE IF NOT EXISTS public.mentor_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Puntos al momento de aplicar
  points_at_application INTEGER NOT NULL,

  -- Motivación
  motivation TEXT NOT NULL,
  experience TEXT,

  -- Estado
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'voting', 'approved', 'rejected', 'withdrawn'
  )),

  -- Método de decisión
  decision_method TEXT CHECK (decision_method IN ('admin_designation', 'secret_vote')),

  -- Resultado de votación (si aplica)
  votes_for INTEGER DEFAULT 0,
  votes_against INTEGER DEFAULT 0,
  votes_abstain INTEGER DEFAULT 0,
  total_eligible_voters INTEGER DEFAULT 0,
  quorum_met BOOLEAN,
  approval_met BOOLEAN,

  -- Decisión admin (si aplica)
  decided_by UUID REFERENCES public.users(id),
  decision_reason TEXT,

  -- Fechas
  voting_starts_at TIMESTAMPTZ,
  voting_ends_at TIMESTAMPTZ,
  decided_at TIMESTAMPTZ,

  -- Cooldown
  can_reapply_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_mentor_applications_user ON public.mentor_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_mentor_applications_status ON public.mentor_applications(status);
CREATE INDEX IF NOT EXISTS idx_mentor_applications_voting ON public.mentor_applications(voting_ends_at)
  WHERE status = 'voting';
CREATE INDEX IF NOT EXISTS idx_mentor_applications_cooldown ON public.mentor_applications(user_id, can_reapply_at);


-- #####################################################
-- SECCIÓN 4: VOTOS DE APLICACIONES
-- #####################################################

CREATE TABLE IF NOT EXISTS public.mentor_application_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES public.mentor_applications(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Voto secreto
  vote TEXT NOT NULL CHECK (vote IN ('for', 'against', 'abstain')),

  -- Comentario opcional (solo visible para admins)
  comment TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Un mentor solo puede votar una vez por aplicación
  UNIQUE(application_id, voter_id)
);

CREATE INDEX IF NOT EXISTS idx_mentor_votes_application ON public.mentor_application_votes(application_id);
CREATE INDEX IF NOT EXISTS idx_mentor_votes_voter ON public.mentor_application_votes(voter_id);


-- #####################################################
-- SECCIÓN 5: ESTADÍSTICAS MENSUALES DE MENTOR
-- #####################################################

CREATE TABLE IF NOT EXISTS public.mentor_monthly_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Período
  period_month DATE NOT NULL,

  -- Métricas de actividad
  active_days INTEGER DEFAULT 0,
  community_responses INTEGER DEFAULT 0,
  content_reviews INTEGER DEFAULT 0,
  governance_votes INTEGER DEFAULT 0,
  mentoring_sessions INTEGER DEFAULT 0,

  -- Cumplimiento
  meets_minimums BOOLEAN GENERATED ALWAYS AS (
    active_days >= 10
    AND community_responses >= 5
    AND content_reviews >= 2
    AND governance_votes >= 1
    AND mentoring_sessions >= 1
  ) STORED,

  -- Está de licencia este mes?
  on_leave BOOLEAN DEFAULT false,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  UNIQUE(user_id, period_month)
);

CREATE INDEX IF NOT EXISTS idx_mentor_stats_user ON public.mentor_monthly_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_mentor_stats_period ON public.mentor_monthly_stats(period_month);
CREATE INDEX IF NOT EXISTS idx_mentor_stats_compliance ON public.mentor_monthly_stats(user_id, meets_minimums)
  WHERE meets_minimums = false AND on_leave = false;


-- #####################################################
-- SECCIÓN 6: AVISOS DE MENTOR
-- #####################################################

CREATE TABLE IF NOT EXISTS public.mentor_warnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Tipo de aviso
  warning_type TEXT NOT NULL CHECK (warning_type IN (
    'missed_minimums', 'inactivity', 'conduct', 'other'
  )),

  -- Número de aviso (1 o 2)
  warning_number INTEGER NOT NULL CHECK (warning_number IN (1, 2)),

  -- Detalles
  reason TEXT NOT NULL,
  details JSONB,

  -- Mes incumplido (si aplica)
  reference_month DATE,

  -- Quién emitió el aviso
  issued_by UUID REFERENCES public.users(id),

  -- Estado
  is_active BOOLEAN DEFAULT true,
  acknowledged_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_mentor_warnings_user ON public.mentor_warnings(user_id);
CREATE INDEX IF NOT EXISTS idx_mentor_warnings_active ON public.mentor_warnings(user_id, is_active)
  WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_mentor_warnings_type ON public.mentor_warnings(warning_type);


-- #####################################################
-- SECCIÓN 7: LICENCIAS DE MENTOR
-- #####################################################

CREATE TABLE IF NOT EXISTS public.mentor_leaves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Fechas de licencia
  starts_at DATE NOT NULL,
  ends_at DATE NOT NULL,
  total_days INTEGER GENERATED ALWAYS AS (ends_at - starts_at + 1) STORED,

  -- Motivo
  reason TEXT NOT NULL,

  -- Estado
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),

  -- Aprobación
  approved_by UUID REFERENCES public.users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Validar que ends_at >= starts_at
  CONSTRAINT valid_leave_dates CHECK (ends_at >= starts_at)
);

CREATE INDEX IF NOT EXISTS idx_mentor_leaves_user ON public.mentor_leaves(user_id);
CREATE INDEX IF NOT EXISTS idx_mentor_leaves_dates ON public.mentor_leaves(starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_mentor_leaves_status ON public.mentor_leaves(status);
CREATE INDEX IF NOT EXISTS idx_mentor_leaves_active ON public.mentor_leaves(user_id, starts_at, ends_at)
  WHERE status = 'approved';


-- #####################################################
-- SECCIÓN 8: FUNCIONES
-- #####################################################

-- =====================================================
-- Función: Calcular plazas disponibles de mentor
-- Plazas = f(usuarios activos): 2% hasta 20, 1% hasta 50, 0.75% después, mín 3
-- =====================================================
CREATE OR REPLACE FUNCTION public.calculate_mentor_plazas()
RETURNS TABLE (
  total_active_users INTEGER,
  calculated_plazas INTEGER,
  current_mentors INTEGER,
  available_plazas INTEGER
) AS $$
DECLARE
  v_total_users INTEGER;
  v_plazas INTEGER;
  v_current_mentors INTEGER;
  v_tier1_max INTEGER;
  v_tier1_pct DECIMAL;
  v_tier2_max INTEGER;
  v_tier2_pct DECIMAL;
  v_tier3_pct DECIMAL;
  v_minimum INTEGER;
  v_config JSONB;
BEGIN
  -- Obtener configuración de plazas
  SELECT config_value INTO v_config FROM public.mentor_config WHERE config_key = 'plaza_tiers';
  v_tier1_max := (v_config->>'tier1_max')::INTEGER;
  v_tier1_pct := (v_config->>'tier1_pct')::DECIMAL;
  v_tier2_max := (v_config->>'tier2_max')::INTEGER;
  v_tier2_pct := (v_config->>'tier2_pct')::DECIMAL;
  v_tier3_pct := (v_config->>'tier3_pct')::DECIMAL;
  v_minimum := (v_config->>'minimum')::INTEGER;

  -- Contar usuarios activos (que han iniciado sesión en los últimos 90 días)
  SELECT COUNT(*) INTO v_total_users
  FROM public.users
  WHERE last_sign_in_at >= NOW() - INTERVAL '90 days';

  -- Calcular plazas según tier
  IF v_total_users <= 0 THEN
    v_plazas := v_minimum;
  ELSE
    -- Calcular progresivamente
    IF v_total_users <= (v_tier1_max / v_tier1_pct * 100)::INTEGER THEN
      v_plazas := GREATEST(v_minimum, CEIL(v_total_users * v_tier1_pct / 100)::INTEGER);
    ELSIF v_total_users <= (v_tier2_max / v_tier2_pct * 100)::INTEGER THEN
      v_plazas := GREATEST(v_minimum, CEIL(v_total_users * v_tier2_pct / 100)::INTEGER);
    ELSE
      v_plazas := GREATEST(v_minimum, CEIL(v_total_users * v_tier3_pct / 100)::INTEGER);
    END IF;
  END IF;

  -- Contar mentores activos actuales
  SELECT COUNT(*) INTO v_current_mentors
  FROM public.user_roles
  WHERE role = 'mentor' AND is_active = true;

  RETURN QUERY SELECT v_total_users, v_plazas, v_current_mentors, GREATEST(0, v_plazas - v_current_mentors);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =====================================================
-- Función: Obtener puntos totales de un usuario
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_mentor_points(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_total INTEGER;
BEGIN
  SELECT COALESCE(SUM(points), 0) INTO v_total
  FROM public.mentor_points
  WHERE user_id = p_user_id;

  RETURN v_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =====================================================
-- Función: Verificar si usuario puede aplicar a mentor
-- =====================================================
CREATE OR REPLACE FUNCTION public.can_apply_mentor(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_points INTEGER;
  v_min_points INTEGER;
  v_plazas INTEGER;
  v_reapply_at TIMESTAMPTZ;
  v_cooldown_months INTEGER;
BEGIN
  -- Obtener configuración
  SELECT (config_value)::INTEGER INTO v_min_points FROM public.mentor_config WHERE config_key = 'min_points_to_apply';
  SELECT (config_value)::INTEGER INTO v_cooldown_months FROM public.mentor_config WHERE config_key = 'cooldown_months';

  -- Obtener puntos del usuario
  v_points := public.get_mentor_points(p_user_id);

  -- Verificar si ya es mentor
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = p_user_id AND role = 'mentor' AND is_active = true) THEN
    RETURN jsonb_build_object('can_apply', false, 'reason', 'Ya eres mentor activo', 'current_points', v_points, 'min_points', v_min_points);
  END IF;

  -- Verificar puntos mínimos
  IF v_points < v_min_points THEN
    RETURN jsonb_build_object('can_apply', false, 'reason', 'No tienes suficientes puntos', 'current_points', v_points, 'min_points', v_min_points);
  END IF;

  -- Verificar cooldown (aplicación previa rechazada o expulsión)
  SELECT ma.can_reapply_at INTO v_reapply_at
  FROM public.mentor_applications ma
  WHERE ma.user_id = p_user_id AND ma.status IN ('rejected', 'withdrawn')
  ORDER BY ma.created_at DESC LIMIT 1;

  IF v_reapply_at IS NOT NULL AND v_reapply_at > NOW() THEN
    RETURN jsonb_build_object('can_apply', false, 'reason', 'Debes esperar el período de cooldown', 'current_points', v_points, 'can_reapply_at', v_reapply_at);
  END IF;

  -- Verificar si tiene aplicación pendiente o en votación
  IF EXISTS (
    SELECT 1 FROM public.mentor_applications
    WHERE user_id = p_user_id AND status IN ('pending', 'voting')
  ) THEN
    RETURN jsonb_build_object('can_apply', false, 'reason', 'Ya tienes una aplicación en proceso', 'current_points', v_points);
  END IF;

  -- Verificar plazas disponibles
  SELECT p.available_plazas INTO v_plazas FROM public.calculate_mentor_plazas() p;

  IF v_plazas <= 0 THEN
    RETURN jsonb_build_object('can_apply', false, 'reason', 'No hay plazas disponibles actualmente', 'current_points', v_points, 'available_plazas', 0);
  END IF;

  -- Puede aplicar
  RETURN jsonb_build_object('can_apply', true, 'reason', 'Puedes aplicar a mentor', 'current_points', v_points, 'min_points', v_min_points, 'available_plazas', v_plazas);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =====================================================
-- Función: Enviar aplicación de mentor
-- =====================================================
CREATE OR REPLACE FUNCTION public.submit_mentor_application(
  p_user_id UUID,
  p_motivation TEXT,
  p_experience TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_can_apply JSONB;
  v_points INTEGER;
  v_mentor_count INTEGER;
  v_threshold INTEGER;
  v_app_id UUID;
  v_method TEXT;
BEGIN
  -- Verificar elegibilidad
  v_can_apply := public.can_apply_mentor(p_user_id);
  IF NOT (v_can_apply->>'can_apply')::BOOLEAN THEN
    RETURN v_can_apply;
  END IF;

  v_points := public.get_mentor_points(p_user_id);

  -- Determinar método de decisión
  SELECT COUNT(*) INTO v_mentor_count FROM public.user_roles WHERE role = 'mentor' AND is_active = true;
  SELECT (config_value)::INTEGER INTO v_threshold FROM public.mentor_config WHERE config_key = 'voting_threshold';

  IF v_mentor_count < v_threshold THEN
    v_method := 'admin_designation';
  ELSE
    v_method := 'secret_vote';
  END IF;

  -- Crear aplicación
  INSERT INTO public.mentor_applications (
    user_id, points_at_application, motivation, experience,
    status, decision_method, voting_starts_at, voting_ends_at, total_eligible_voters
  ) VALUES (
    p_user_id, v_points, p_motivation, p_experience,
    CASE WHEN v_method = 'admin_designation' THEN 'pending' ELSE 'voting' END,
    v_method,
    CASE WHEN v_method = 'secret_vote' THEN NOW() ELSE NULL END,
    CASE WHEN v_method = 'secret_vote' THEN NOW() + INTERVAL '14 days' ELSE NULL END,
    CASE WHEN v_method = 'secret_vote' THEN v_mentor_count ELSE NULL END
  ) RETURNING id INTO v_app_id;

  RETURN jsonb_build_object(
    'success', true,
    'application_id', v_app_id,
    'decision_method', v_method,
    'message', CASE WHEN v_method = 'admin_designation'
      THEN 'Aplicación enviada. Un administrador revisará tu solicitud.'
      ELSE 'Aplicación enviada. Los mentores votarán durante 14 días.'
    END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =====================================================
-- Función: Votar en aplicación de mentor (votación secreta)
-- =====================================================
CREATE OR REPLACE FUNCTION public.vote_mentor_application(
  p_voter_id UUID,
  p_application_id UUID,
  p_vote TEXT,
  p_comment TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_app RECORD;
  v_is_mentor BOOLEAN;
BEGIN
  -- Verificar que es mentor activo
  SELECT EXISTS(
    SELECT 1 FROM public.user_roles WHERE user_id = p_voter_id AND role = 'mentor' AND is_active = true
  ) INTO v_is_mentor;

  IF NOT v_is_mentor THEN
    RETURN jsonb_build_object('success', false, 'error', 'Solo mentores pueden votar');
  END IF;

  -- Verificar aplicación
  SELECT * INTO v_app FROM public.mentor_applications WHERE id = p_application_id;

  IF v_app IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Aplicación no encontrada');
  END IF;

  IF v_app.status != 'voting' THEN
    RETURN jsonb_build_object('success', false, 'error', 'La votación no está activa');
  END IF;

  IF v_app.voting_ends_at < NOW() THEN
    RETURN jsonb_build_object('success', false, 'error', 'La votación ha expirado');
  END IF;

  IF v_app.user_id = p_voter_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'No puedes votar en tu propia aplicación');
  END IF;

  -- Insertar o actualizar voto
  INSERT INTO public.mentor_application_votes (application_id, voter_id, vote, comment)
  VALUES (p_application_id, p_voter_id, p_vote, p_comment)
  ON CONFLICT (application_id, voter_id) DO UPDATE SET
    vote = EXCLUDED.vote,
    comment = EXCLUDED.comment;

  -- Actualizar contadores
  UPDATE public.mentor_applications SET
    votes_for = (SELECT COUNT(*) FROM public.mentor_application_votes WHERE application_id = p_application_id AND vote = 'for'),
    votes_against = (SELECT COUNT(*) FROM public.mentor_application_votes WHERE application_id = p_application_id AND vote = 'against'),
    votes_abstain = (SELECT COUNT(*) FROM public.mentor_application_votes WHERE application_id = p_application_id AND vote = 'abstain')
  WHERE id = p_application_id;

  RETURN jsonb_build_object('success', true, 'message', 'Voto registrado');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =====================================================
-- Función: Resolver aplicación de mentor
-- (admin decide si <20 mentores, o resuelve votación si 20+)
-- =====================================================
CREATE OR REPLACE FUNCTION public.resolve_mentor_application(
  p_application_id UUID,
  p_resolved_by UUID DEFAULT NULL,
  p_approved BOOLEAN DEFAULT NULL,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_app RECORD;
  v_total_votes INTEGER;
  v_quorum_pct INTEGER;
  v_approval_pct INTEGER;
  v_cooldown_months INTEGER;
  v_actual_quorum DECIMAL;
  v_actual_approval DECIMAL;
  v_quorum_met BOOLEAN;
  v_approval_met BOOLEAN;
  v_is_approved BOOLEAN;
BEGIN
  -- Obtener aplicación
  SELECT * INTO v_app FROM public.mentor_applications WHERE id = p_application_id;

  IF v_app IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Aplicación no encontrada');
  END IF;

  IF v_app.status NOT IN ('voting', 'pending') THEN
    RETURN jsonb_build_object('success', false, 'error', 'La aplicación no está en estado resoluble (status: ' || v_app.status || ')');
  END IF;

  SELECT (config_value)::INTEGER INTO v_cooldown_months FROM public.mentor_config WHERE config_key = 'cooldown_months';

  -- ===== DECISIÓN POR ADMIN =====
  IF v_app.decision_method = 'admin_designation' THEN
    -- Verificar que hay un admin resolviendo
    IF p_resolved_by IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Se requiere un admin para resolver esta aplicación');
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = p_resolved_by AND role = 'admin' AND is_active = true
    ) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Solo admins pueden resolver designaciones directas');
    END IF;

    IF p_approved IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Se requiere indicar si se aprueba o rechaza');
    END IF;

    v_is_approved := p_approved;

    UPDATE public.mentor_applications SET
      status = CASE WHEN p_approved THEN 'approved' ELSE 'rejected' END,
      decided_by = p_resolved_by,
      decision_reason = p_reason,
      decided_at = NOW(),
      can_reapply_at = CASE WHEN NOT p_approved THEN NOW() + (v_cooldown_months || ' months')::INTERVAL ELSE NULL END,
      updated_at = NOW()
    WHERE id = p_application_id;

  -- ===== DECISIÓN POR VOTACIÓN =====
  ELSIF v_app.decision_method = 'secret_vote' THEN
    -- Obtener configuración de votación
    SELECT (config_value)::INTEGER INTO v_quorum_pct FROM public.mentor_config WHERE config_key = 'voting_quorum_pct';
    SELECT (config_value)::INTEGER INTO v_approval_pct FROM public.mentor_config WHERE config_key = 'voting_approval_pct';

    -- Calcular quórum (votos totales / elegibles)
    v_total_votes := v_app.votes_for + v_app.votes_against + v_app.votes_abstain;
    v_actual_quorum := CASE WHEN v_app.total_eligible_voters > 0
      THEN (v_total_votes::DECIMAL / v_app.total_eligible_voters * 100)
      ELSE 0 END;
    v_quorum_met := v_actual_quorum >= v_quorum_pct;

    -- Calcular aprobación (votos a favor / (a favor + en contra))
    v_actual_approval := CASE WHEN (v_app.votes_for + v_app.votes_against) > 0
      THEN (v_app.votes_for::DECIMAL / (v_app.votes_for + v_app.votes_against) * 100)
      ELSE 0 END;
    v_approval_met := v_actual_approval >= v_approval_pct;

    v_is_approved := v_quorum_met AND v_approval_met;

    UPDATE public.mentor_applications SET
      status = CASE WHEN v_is_approved THEN 'approved' ELSE 'rejected' END,
      quorum_met = v_quorum_met,
      approval_met = v_approval_met,
      decided_by = p_resolved_by,
      decided_at = NOW(),
      can_reapply_at = CASE WHEN NOT v_is_approved THEN NOW() + (v_cooldown_months || ' months')::INTERVAL ELSE NULL END,
      updated_at = NOW()
    WHERE id = p_application_id;

  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Método de decisión desconocido: ' || v_app.decision_method);
  END IF;

  -- Si fue aprobado, otorgar rol de mentor
  IF v_is_approved THEN
    INSERT INTO public.user_roles (user_id, role, notes)
    VALUES (v_app.user_id, 'mentor', COALESCE(p_reason, 'Aprobado como mentor'))
    ON CONFLICT (user_id, role) DO UPDATE SET is_active = true, updated_at = NOW();

    -- Registrar punto inicial (0 puntos, marca de inicio)
    INSERT INTO public.mentor_points (user_id, category, points, description)
    VALUES (v_app.user_id, 'other', 0, 'Inicio como mentor - aplicación aprobada');
  END IF;

  -- Construir respuesta
  IF v_app.decision_method = 'secret_vote' THEN
    RETURN jsonb_build_object(
      'success', true,
      'approved', v_is_approved,
      'reason', CASE
        WHEN v_is_approved THEN 'Aprobado por votación secreta'
        WHEN NOT v_quorum_met THEN 'Rechazado: no se alcanzó el quórum (' || ROUND(v_actual_quorum) || '% de ' || v_quorum_pct || '% requerido)'
        ELSE 'Rechazado: no se alcanzó la aprobación (' || ROUND(v_actual_approval) || '% de ' || v_approval_pct || '% requerido)'
      END,
      'quorum_met', v_quorum_met,
      'approval_met', v_approval_met,
      'votes_for', v_app.votes_for,
      'votes_against', v_app.votes_against,
      'votes_abstain', v_app.votes_abstain,
      'total_eligible', v_app.total_eligible_voters
    );
  ELSE
    RETURN jsonb_build_object(
      'success', true,
      'approved', v_is_approved,
      'reason', CASE WHEN v_is_approved
        THEN 'Aprobado por designación de admin'
        ELSE COALESCE(p_reason, 'Rechazado por admin')
      END
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =====================================================
-- Función: Remover status de mentor
-- =====================================================
CREATE OR REPLACE FUNCTION public.remove_mentor_status(
  p_user_id UUID,
  p_reason TEXT,
  p_removed_by UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_new_role TEXT;
  v_cooldown_until TIMESTAMPTZ;
  v_cooldown_months INTEGER;
  v_has_instructor_cert BOOLEAN;
BEGIN
  -- Verificar que es mentor activo
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_user_id AND role = 'mentor' AND is_active = true
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'El usuario no es mentor activo');
  END IF;

  -- Obtener cooldown
  SELECT (config_value)::INTEGER INTO v_cooldown_months FROM public.mentor_config WHERE config_key = 'cooldown_months';
  v_cooldown_until := NOW() + (v_cooldown_months || ' months')::INTERVAL;

  -- Determinar nuevo rol: si tiene certificación de instructor activa, mantener instructor
  SELECT EXISTS (
    SELECT 1 FROM public.instructor_certifications
    WHERE user_id = p_user_id AND status = 'active' AND expires_at > NOW()
  ) INTO v_has_instructor_cert;

  IF v_has_instructor_cert THEN
    v_new_role := 'instructor';
  ELSE
    v_new_role := 'student';
  END IF;

  -- Desactivar rol de mentor
  UPDATE public.user_roles SET is_active = false, updated_at = NOW()
  WHERE user_id = p_user_id AND role = 'mentor';

  -- Registrar punto negativo con la razón
  INSERT INTO public.mentor_points (user_id, category, points, description)
  VALUES (p_user_id, 'other', -100, 'Mentor removido: ' || p_reason);

  -- Registrar cooldown en la aplicación aprobada más reciente
  UPDATE public.mentor_applications SET
    can_reapply_at = v_cooldown_until,
    updated_at = NOW()
  WHERE id = (
    SELECT id FROM public.mentor_applications
    WHERE user_id = p_user_id AND status = 'approved'
    ORDER BY decided_at DESC LIMIT 1
  );

  RETURN jsonb_build_object(
    'success', true,
    'new_role', v_new_role,
    'cooldown_until', v_cooldown_until,
    'reason', p_reason
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =====================================================
-- Función: Evaluar mínimos mensuales de un mentor
-- =====================================================
CREATE OR REPLACE FUNCTION public.evaluate_mentor_monthly(
  p_user_id UUID,
  p_year INTEGER DEFAULT EXTRACT(YEAR FROM NOW())::INTEGER,
  p_month INTEGER DEFAULT EXTRACT(MONTH FROM NOW() - INTERVAL '1 month')::INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_stats RECORD;
  v_period DATE;
  v_on_leave BOOLEAN;
  v_active_warnings INTEGER;
  v_max_warnings INTEGER;
  v_new_warning_number INTEGER;
  v_failures JSONB := '[]'::JSONB;
  v_minimums JSONB;
  v_remove_result JSONB;
BEGIN
  v_period := make_date(p_year, p_month, 1);

  -- Verificar que es mentor activo
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_user_id AND role = 'mentor' AND is_active = true
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'El usuario no es mentor activo');
  END IF;

  -- Verificar si está de licencia ese mes
  SELECT EXISTS (
    SELECT 1 FROM public.mentor_leaves
    WHERE user_id = p_user_id AND status = 'approved'
    AND starts_at <= (v_period + INTERVAL '1 month' - INTERVAL '1 day')::DATE
    AND ends_at >= v_period
  ) INTO v_on_leave;

  IF v_on_leave THEN
    UPDATE public.mentor_monthly_stats SET on_leave = true, updated_at = NOW()
    WHERE user_id = p_user_id AND period_month = v_period;

    RETURN jsonb_build_object('success', true, 'met_requirements', true, 'on_leave', true, 'failures', '[]'::JSONB);
  END IF;

  -- Obtener mínimos de configuración
  SELECT config_value INTO v_minimums FROM public.mentor_config WHERE config_key = 'monthly_minimums';

  -- Obtener o crear stats del mes
  INSERT INTO public.mentor_monthly_stats (user_id, period_month)
  VALUES (p_user_id, v_period)
  ON CONFLICT (user_id, period_month) DO NOTHING;

  SELECT * INTO v_stats FROM public.mentor_monthly_stats
  WHERE user_id = p_user_id AND period_month = v_period;

  -- Evaluar cada mínimo
  IF v_stats.active_days < (v_minimums->>'active_days')::INTEGER THEN
    v_failures := v_failures || jsonb_build_array(jsonb_build_object(
      'metric', 'active_days', 'required', (v_minimums->>'active_days')::INTEGER, 'actual', v_stats.active_days
    ));
  END IF;

  IF v_stats.community_responses < (v_minimums->>'community_responses')::INTEGER THEN
    v_failures := v_failures || jsonb_build_array(jsonb_build_object(
      'metric', 'community_responses', 'required', (v_minimums->>'community_responses')::INTEGER, 'actual', v_stats.community_responses
    ));
  END IF;

  IF v_stats.content_reviews < (v_minimums->>'content_reviews')::INTEGER THEN
    v_failures := v_failures || jsonb_build_array(jsonb_build_object(
      'metric', 'content_reviews', 'required', (v_minimums->>'content_reviews')::INTEGER, 'actual', v_stats.content_reviews
    ));
  END IF;

  IF v_stats.governance_votes < (v_minimums->>'governance_votes')::INTEGER THEN
    v_failures := v_failures || jsonb_build_array(jsonb_build_object(
      'metric', 'governance_votes', 'required', (v_minimums->>'governance_votes')::INTEGER, 'actual', v_stats.governance_votes
    ));
  END IF;

  IF v_stats.mentoring_sessions < (v_minimums->>'mentoring_sessions')::INTEGER THEN
    v_failures := v_failures || jsonb_build_array(jsonb_build_object(
      'metric', 'mentoring_sessions', 'required', (v_minimums->>'mentoring_sessions')::INTEGER, 'actual', v_stats.mentoring_sessions
    ));
  END IF;

  -- Si cumple todos los mínimos
  IF jsonb_array_length(v_failures) = 0 THEN
    RETURN jsonb_build_object('success', true, 'met_requirements', true, 'on_leave', false, 'failures', '[]'::JSONB);
  END IF;

  -- No cumplió: obtener warnings activos
  SELECT (config_value)::INTEGER INTO v_max_warnings FROM public.mentor_config WHERE config_key = 'max_warnings';

  SELECT COUNT(*) INTO v_active_warnings
  FROM public.mentor_warnings
  WHERE user_id = p_user_id AND is_active = true;

  v_new_warning_number := v_active_warnings + 1;

  -- Si ya tiene 2 warnings activos, expulsar
  IF v_new_warning_number > v_max_warnings THEN
    v_remove_result := public.remove_mentor_status(
      p_user_id,
      'Expulsión automática: 3er incumplimiento mensual (' || TO_CHAR(v_period, 'Month YYYY') || ')',
      NULL
    );

    RETURN jsonb_build_object(
      'success', true,
      'met_requirements', false,
      'on_leave', false,
      'failures', v_failures,
      'expelled', true,
      'warning_number', v_new_warning_number,
      'remove_result', v_remove_result
    );
  END IF;

  -- Emitir warning
  INSERT INTO public.mentor_warnings (user_id, warning_type, warning_number, reason, reference_month, issued_by, details)
  VALUES (
    p_user_id, 'missed_minimums', v_new_warning_number,
    'No cumplió los mínimos mensuales de ' || TO_CHAR(v_period, 'Month YYYY'),
    v_period, NULL, v_failures
  );

  RETURN jsonb_build_object(
    'success', true,
    'met_requirements', false,
    'on_leave', false,
    'failures', v_failures,
    'expelled', false,
    'warning_number', v_new_warning_number
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =====================================================
-- Función: Solicitar licencia de mentor
-- =====================================================
CREATE OR REPLACE FUNCTION public.request_mentor_leave(
  p_user_id UUID,
  p_starts_at DATE,
  p_ends_at DATE,
  p_reason TEXT
)
RETURNS UUID AS $$
DECLARE
  v_max_days INTEGER;
  v_used_days INTEGER;
  v_requested_days INTEGER;
  v_leave_id UUID;
  v_year INTEGER;
BEGIN
  -- Verificar que es mentor activo
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_user_id AND role = 'mentor' AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Solo mentores activos pueden solicitar licencia';
  END IF;

  -- Validar fechas
  IF p_ends_at < p_starts_at THEN
    RAISE EXCEPTION 'La fecha de fin debe ser posterior a la de inicio';
  END IF;

  v_requested_days := p_ends_at - p_starts_at + 1;
  v_year := EXTRACT(YEAR FROM p_starts_at)::INTEGER;

  -- Obtener máximo de días
  SELECT (config_value)::INTEGER INTO v_max_days FROM public.mentor_config WHERE config_key = 'max_leave_days_year';

  -- Calcular días ya usados este año
  SELECT COALESCE(SUM(
    LEAST(ends_at, (v_year || '-12-31')::DATE) - GREATEST(starts_at, (v_year || '-01-01')::DATE) + 1
  ), 0) INTO v_used_days
  FROM public.mentor_leaves
  WHERE user_id = p_user_id AND status = 'approved'
  AND starts_at <= (v_year || '-12-31')::DATE
  AND ends_at >= (v_year || '-01-01')::DATE;

  -- Verificar límite anual
  IF (v_used_days + v_requested_days) > v_max_days THEN
    RAISE EXCEPTION 'Excedes el límite de % días de licencia por año. Ya usados: %, solicitados: %',
      v_max_days, v_used_days, v_requested_days;
  END IF;

  -- Crear solicitud
  INSERT INTO public.mentor_leaves (user_id, starts_at, ends_at, reason)
  VALUES (p_user_id, p_starts_at, p_ends_at, p_reason)
  RETURNING id INTO v_leave_id;

  RETURN v_leave_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =====================================================
-- Función: Resolver votaciones expiradas (para cron)
-- =====================================================
CREATE OR REPLACE FUNCTION public.resolve_expired_mentor_votes()
RETURNS INTEGER AS $$
DECLARE
  v_app RECORD;
  v_count INTEGER := 0;
BEGIN
  FOR v_app IN
    SELECT id FROM public.mentor_applications
    WHERE status = 'voting' AND voting_ends_at <= NOW()
  LOOP
    PERFORM public.resolve_mentor_application(v_app.id);
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =====================================================
-- Función: Obtener días de licencia restantes del año
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_mentor_leave_balance(p_user_id UUID, p_year INTEGER DEFAULT EXTRACT(YEAR FROM NOW())::INTEGER)
RETURNS TABLE (
  max_days INTEGER,
  used_days INTEGER,
  remaining_days INTEGER
) AS $$
DECLARE
  v_max INTEGER;
  v_used INTEGER;
BEGIN
  SELECT (config_value)::INTEGER INTO v_max FROM public.mentor_config WHERE config_key = 'max_leave_days_year';

  SELECT COALESCE(SUM(
    LEAST(ends_at, (p_year || '-12-31')::DATE) - GREATEST(starts_at, (p_year || '-01-01')::DATE) + 1
  ), 0) INTO v_used
  FROM public.mentor_leaves
  WHERE user_id = p_user_id AND status = 'approved'
  AND starts_at <= (p_year || '-12-31')::DATE
  AND ends_at >= (p_year || '-01-01')::DATE;

  RETURN QUERY SELECT v_max, v_used, GREATEST(0, v_max - v_used);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- #####################################################
-- SECCIÓN 9: TRIGGERS
-- #####################################################

DROP TRIGGER IF EXISTS trigger_mentor_config_updated_at ON public.mentor_config;
CREATE TRIGGER trigger_mentor_config_updated_at
  BEFORE UPDATE ON public.mentor_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_mentor_applications_updated_at ON public.mentor_applications;
CREATE TRIGGER trigger_mentor_applications_updated_at
  BEFORE UPDATE ON public.mentor_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_mentor_stats_updated_at ON public.mentor_monthly_stats;
CREATE TRIGGER trigger_mentor_stats_updated_at
  BEFORE UPDATE ON public.mentor_monthly_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_mentor_leaves_updated_at ON public.mentor_leaves;
CREATE TRIGGER trigger_mentor_leaves_updated_at
  BEFORE UPDATE ON public.mentor_leaves
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- #####################################################
-- SECCIÓN 10: POLÍTICAS RLS (ACTUALIZADAS)
-- #####################################################

ALTER TABLE public.mentor_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_application_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_monthly_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_warnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_leaves ENABLE ROW LEVEL SECURITY;

-- mentor_config: solo lectura para autenticados
CREATE POLICY "mentor_config_select" ON public.mentor_config FOR SELECT TO authenticated USING (true);

-- mentor_points: usuarios ven sus propios, admins todo
CREATE POLICY "mentor_points_select" ON public.mentor_points FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- mentor_applications: usuarios ven suyas, mentores ven voting, admins todo
CREATE POLICY "mentor_applications_select" ON public.mentor_applications FOR SELECT TO authenticated
  USING (user_id = auth.uid()
    OR (status = 'voting' AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'mentor'))
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "mentor_applications_insert" ON public.mentor_applications FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- mentor_application_votes: SOLO insertar, nadie puede ver (secreto)
CREATE POLICY "mentor_votes_insert" ON public.mentor_application_votes FOR INSERT TO authenticated
  WITH CHECK (voter_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'mentor')
    AND EXISTS (SELECT 1 FROM public.mentor_applications WHERE id = application_id AND status = 'voting'));

-- mentor_monthly_stats: usuarios ven suyas, admins todo
CREATE POLICY "mentor_monthly_stats_select" ON public.mentor_monthly_stats FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- mentor_warnings: usuarios ven suyas, admins todo e insertan
CREATE POLICY "mentor_warnings_select" ON public.mentor_warnings FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "mentor_warnings_insert" ON public.mentor_warnings FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- mentor_leaves: usuarios ven suyas e insertan, admins todo
CREATE POLICY "mentor_leaves_select" ON public.mentor_leaves FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "mentor_leaves_insert" ON public.mentor_leaves FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "mentor_leaves_update" ON public.mentor_leaves FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));


-- #####################################################
-- SECCIÓN 11: COMENTARIOS
-- #####################################################

COMMENT ON TABLE public.mentor_config IS 'Configuración global del sistema de mentores (plazas, mínimos, cooldowns)';
COMMENT ON TABLE public.mentor_points IS 'Puntos acumulados por usuarios para aplicar a mentor (650 mínimo)';
COMMENT ON TABLE public.mentor_applications IS 'Aplicaciones para ser mentor (admin designa <20, votación secreta 20+)';
COMMENT ON TABLE public.mentor_application_votes IS 'Votos secretos en aplicaciones (60% quórum, 66% aprobación)';
COMMENT ON TABLE public.mentor_monthly_stats IS 'Estadísticas mensuales con mínimos obligatorios';
COMMENT ON TABLE public.mentor_warnings IS 'Avisos a mentores (2 antes de expulsión)';
COMMENT ON TABLE public.mentor_leaves IS 'Licencias de mentores (máx 60 días/año)';

COMMENT ON FUNCTION public.calculate_mentor_plazas IS 'Calcula plazas disponibles: 2% hasta 20, 1% hasta 50, 0.75% después, mín 3';
COMMENT ON FUNCTION public.get_mentor_points IS 'Obtiene puntos totales de un usuario para mentor';
COMMENT ON FUNCTION public.can_apply_mentor IS 'Verifica elegibilidad para aplicar a mentor, retorna JSONB con can_apply y razón';
COMMENT ON FUNCTION public.submit_mentor_application IS 'Envía aplicación de mentor, retorna JSONB con resultado y método de decisión';
COMMENT ON FUNCTION public.vote_mentor_application IS 'Registra voto secreto en aplicación, retorna JSONB con success/error';
COMMENT ON FUNCTION public.resolve_mentor_vote IS 'Resuelve votación de aplicación (quórum + aprobación)';
COMMENT ON FUNCTION public.admin_decide_mentor_application IS 'Designación directa por admin cuando hay <20 mentores';
COMMENT ON FUNCTION public.evaluate_mentor_monthly IS 'Evalúa mínimos mensuales y emite avisos/expulsiones';
COMMENT ON FUNCTION public.request_mentor_leave IS 'Solicita licencia validando límite anual de 60 días';
COMMENT ON FUNCTION public.resolve_expired_mentor_votes IS 'Resuelve votaciones expiradas (para cron job)';
COMMENT ON FUNCTION public.get_mentor_leave_balance IS 'Obtiene balance de días de licencia restantes del año';


-- Verificar tablas creadas
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'mentor%' ORDER BY tablename;

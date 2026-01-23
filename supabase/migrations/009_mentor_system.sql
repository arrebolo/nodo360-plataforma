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
RETURNS TABLE (
  can_apply BOOLEAN,
  reason TEXT,
  current_points INTEGER,
  min_points INTEGER,
  available_plazas INTEGER,
  can_reapply_at TIMESTAMPTZ
) AS $$
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
    RETURN QUERY SELECT false, 'Ya eres mentor activo'::TEXT, v_points, v_min_points, 0, NULL::TIMESTAMPTZ;
    RETURN;
  END IF;

  -- Verificar puntos mínimos
  IF v_points < v_min_points THEN
    RETURN QUERY SELECT false, 'No tienes suficientes puntos'::TEXT, v_points, v_min_points, 0, NULL::TIMESTAMPTZ;
    RETURN;
  END IF;

  -- Verificar cooldown (aplicación previa rechazada o expulsión)
  SELECT can_reapply_at INTO v_reapply_at
  FROM public.mentor_applications
  WHERE user_id = p_user_id AND status IN ('rejected', 'withdrawn')
  ORDER BY created_at DESC LIMIT 1;

  IF v_reapply_at IS NOT NULL AND v_reapply_at > NOW() THEN
    RETURN QUERY SELECT false, 'Debes esperar el período de cooldown'::TEXT, v_points, v_min_points, 0, v_reapply_at;
    RETURN;
  END IF;

  -- Verificar si tiene aplicación pendiente o en votación
  IF EXISTS (
    SELECT 1 FROM public.mentor_applications
    WHERE user_id = p_user_id AND status IN ('pending', 'voting')
  ) THEN
    RETURN QUERY SELECT false, 'Ya tienes una aplicación en proceso'::TEXT, v_points, v_min_points, 0, NULL::TIMESTAMPTZ;
    RETURN;
  END IF;

  -- Verificar plazas disponibles
  SELECT p.available_plazas INTO v_plazas FROM public.calculate_mentor_plazas() p;

  IF v_plazas <= 0 THEN
    RETURN QUERY SELECT false, 'No hay plazas disponibles actualmente'::TEXT, v_points, v_min_points, v_plazas, NULL::TIMESTAMPTZ;
    RETURN;
  END IF;

  -- Puede aplicar
  RETURN QUERY SELECT true, 'Puedes aplicar a mentor'::TEXT, v_points, v_min_points, v_plazas, NULL::TIMESTAMPTZ;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =====================================================
-- Función: Iniciar proceso de aplicación
-- =====================================================
CREATE OR REPLACE FUNCTION public.submit_mentor_application(
  p_user_id UUID,
  p_motivation TEXT,
  p_experience TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_can_apply BOOLEAN;
  v_reason TEXT;
  v_points INTEGER;
  v_current_mentors INTEGER;
  v_voting_threshold INTEGER;
  v_voting_days INTEGER;
  v_application_id UUID;
  v_decision_method TEXT;
BEGIN
  -- Verificar elegibilidad
  SELECT ca.can_apply, ca.reason, ca.current_points
  INTO v_can_apply, v_reason, v_points
  FROM public.can_apply_mentor(p_user_id) ca;

  IF NOT v_can_apply THEN
    RAISE EXCEPTION 'No puedes aplicar: %', v_reason;
  END IF;

  -- Determinar método de decisión
  SELECT COUNT(*) INTO v_current_mentors
  FROM public.user_roles WHERE role = 'mentor' AND is_active = true;

  SELECT (config_value)::INTEGER INTO v_voting_threshold
  FROM public.mentor_config WHERE config_key = 'voting_threshold';

  SELECT (config_value)::INTEGER INTO v_voting_days
  FROM public.mentor_config WHERE config_key = 'voting_duration_days';

  IF v_current_mentors < v_voting_threshold THEN
    v_decision_method := 'admin_designation';
  ELSE
    v_decision_method := 'secret_vote';
  END IF;

  -- Crear aplicación
  INSERT INTO public.mentor_applications (
    user_id, points_at_application, motivation, experience,
    status, decision_method,
    total_eligible_voters,
    voting_starts_at, voting_ends_at
  ) VALUES (
    p_user_id, v_points, p_motivation, p_experience,
    CASE WHEN v_decision_method = 'secret_vote' THEN 'voting' ELSE 'pending' END,
    v_decision_method,
    CASE WHEN v_decision_method = 'secret_vote' THEN v_current_mentors ELSE 0 END,
    CASE WHEN v_decision_method = 'secret_vote' THEN NOW() ELSE NULL END,
    CASE WHEN v_decision_method = 'secret_vote' THEN NOW() + (v_voting_days || ' days')::INTERVAL ELSE NULL END
  )
  RETURNING id INTO v_application_id;

  RETURN v_application_id;
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
RETURNS BOOLEAN AS $$
DECLARE
  v_application RECORD;
BEGIN
  -- Verificar que el votante es mentor activo
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_voter_id AND role = 'mentor' AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Solo mentores activos pueden votar';
  END IF;

  -- Obtener aplicación
  SELECT * INTO v_application FROM public.mentor_applications
  WHERE id = p_application_id AND status = 'voting';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Aplicación no encontrada o no está en votación';
  END IF;

  -- Verificar que la votación no ha expirado
  IF v_application.voting_ends_at < NOW() THEN
    RAISE EXCEPTION 'El período de votación ha terminado';
  END IF;

  -- Verificar que no es el aplicante votando por sí mismo
  IF v_application.user_id = p_voter_id THEN
    RAISE EXCEPTION 'No puedes votar en tu propia aplicación';
  END IF;

  -- Registrar voto
  INSERT INTO public.mentor_application_votes (application_id, voter_id, vote, comment)
  VALUES (p_application_id, p_voter_id, p_vote, p_comment)
  ON CONFLICT (application_id, voter_id) DO UPDATE SET
    vote = EXCLUDED.vote,
    comment = EXCLUDED.comment,
    created_at = NOW();

  -- Actualizar conteos en la aplicación
  UPDATE public.mentor_applications SET
    votes_for = (SELECT COUNT(*) FROM public.mentor_application_votes WHERE application_id = p_application_id AND vote = 'for'),
    votes_against = (SELECT COUNT(*) FROM public.mentor_application_votes WHERE application_id = p_application_id AND vote = 'against'),
    votes_abstain = (SELECT COUNT(*) FROM public.mentor_application_votes WHERE application_id = p_application_id AND vote = 'abstain'),
    updated_at = NOW()
  WHERE id = p_application_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =====================================================
-- Función: Resolver votación de aplicación
-- (llamada por cron o manualmente cuando expira votación)
-- =====================================================
CREATE OR REPLACE FUNCTION public.resolve_mentor_vote(p_application_id UUID)
RETURNS TABLE (
  resolved BOOLEAN,
  result TEXT,
  quorum_met BOOLEAN,
  approval_met BOOLEAN,
  vote_summary TEXT
) AS $$
DECLARE
  v_app RECORD;
  v_total_votes INTEGER;
  v_quorum_pct INTEGER;
  v_approval_pct INTEGER;
  v_cooldown_months INTEGER;
  v_quorum_met BOOLEAN;
  v_approval_met BOOLEAN;
  v_actual_quorum DECIMAL;
  v_actual_approval DECIMAL;
BEGIN
  -- Obtener aplicación
  SELECT * INTO v_app FROM public.mentor_applications WHERE id = p_application_id AND status = 'voting';
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Aplicación no encontrada o no está en votación'::TEXT, false, false, ''::TEXT;
    RETURN;
  END IF;

  -- Obtener configuración
  SELECT (config_value)::INTEGER INTO v_quorum_pct FROM public.mentor_config WHERE config_key = 'voting_quorum_pct';
  SELECT (config_value)::INTEGER INTO v_approval_pct FROM public.mentor_config WHERE config_key = 'voting_approval_pct';
  SELECT (config_value)::INTEGER INTO v_cooldown_months FROM public.mentor_config WHERE config_key = 'cooldown_months';

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

  -- Determinar resultado
  IF v_quorum_met AND v_approval_met THEN
    -- Aprobado
    UPDATE public.mentor_applications SET
      status = 'approved',
      quorum_met = true,
      approval_met = true,
      decided_at = NOW(),
      updated_at = NOW()
    WHERE id = p_application_id;

    -- Otorgar rol de mentor
    INSERT INTO public.user_roles (user_id, role, notes)
    VALUES (v_app.user_id, 'mentor', 'Aprobado por votación secreta')
    ON CONFLICT (user_id, role) DO UPDATE SET is_active = true, updated_at = NOW();

    RETURN QUERY SELECT true, 'approved'::TEXT, true, true,
      format('Quórum: %s%% (%s/%s), Aprobación: %s%% (%s/%s)',
        ROUND(v_actual_quorum), v_total_votes, v_app.total_eligible_voters,
        ROUND(v_actual_approval), v_app.votes_for, v_app.votes_for + v_app.votes_against)::TEXT;
  ELSE
    -- Rechazado
    UPDATE public.mentor_applications SET
      status = 'rejected',
      quorum_met = v_quorum_met,
      approval_met = v_approval_met,
      decided_at = NOW(),
      can_reapply_at = NOW() + (v_cooldown_months || ' months')::INTERVAL,
      updated_at = NOW()
    WHERE id = p_application_id;

    RETURN QUERY SELECT true, 'rejected'::TEXT, v_quorum_met, v_approval_met,
      format('Quórum: %s%% (%s/%s), Aprobación: %s%% (%s/%s)',
        ROUND(v_actual_quorum), v_total_votes, v_app.total_eligible_voters,
        ROUND(v_actual_approval), v_app.votes_for, v_app.votes_for + v_app.votes_against)::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =====================================================
-- Función: Designación directa por admin (< 20 mentores)
-- =====================================================
CREATE OR REPLACE FUNCTION public.admin_decide_mentor_application(
  p_admin_id UUID,
  p_application_id UUID,
  p_approved BOOLEAN,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_app RECORD;
  v_cooldown_months INTEGER;
BEGIN
  -- Verificar que es admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_admin_id AND role = 'admin' AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Solo admins pueden designar mentores directamente';
  END IF;

  -- Obtener aplicación
  SELECT * INTO v_app FROM public.mentor_applications
  WHERE id = p_application_id AND status = 'pending' AND decision_method = 'admin_designation';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Aplicación no encontrada o no es para designación admin';
  END IF;

  SELECT (config_value)::INTEGER INTO v_cooldown_months FROM public.mentor_config WHERE config_key = 'cooldown_months';

  IF p_approved THEN
    -- Aprobar
    UPDATE public.mentor_applications SET
      status = 'approved',
      decided_by = p_admin_id,
      decision_reason = p_reason,
      decided_at = NOW(),
      updated_at = NOW()
    WHERE id = p_application_id;

    -- Otorgar rol de mentor
    INSERT INTO public.user_roles (user_id, role, notes)
    VALUES (v_app.user_id, 'mentor', 'Designado por admin: ' || COALESCE(p_reason, 'Sin razón especificada'))
    ON CONFLICT (user_id, role) DO UPDATE SET is_active = true, updated_at = NOW();
  ELSE
    -- Rechazar
    UPDATE public.mentor_applications SET
      status = 'rejected',
      decided_by = p_admin_id,
      decision_reason = p_reason,
      decided_at = NOW(),
      can_reapply_at = NOW() + (v_cooldown_months || ' months')::INTERVAL,
      updated_at = NOW()
    WHERE id = p_application_id;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =====================================================
-- Función: Evaluar mínimos mensuales de un mentor
-- =====================================================
CREATE OR REPLACE FUNCTION public.evaluate_mentor_monthly(
  p_user_id UUID,
  p_month DATE DEFAULT DATE_TRUNC('month', NOW() - INTERVAL '1 month')::DATE
)
RETURNS TABLE (
  meets_requirements BOOLEAN,
  is_on_leave BOOLEAN,
  warning_issued BOOLEAN,
  warning_number INTEGER,
  expelled BOOLEAN
) AS $$
DECLARE
  v_stats RECORD;
  v_on_leave BOOLEAN;
  v_active_warnings INTEGER;
  v_max_warnings INTEGER;
  v_new_warning_number INTEGER;
BEGIN
  -- Verificar si el mentor está de licencia ese mes
  SELECT EXISTS (
    SELECT 1 FROM public.mentor_leaves
    WHERE user_id = p_user_id AND status = 'approved'
    AND starts_at <= (p_month + INTERVAL '1 month' - INTERVAL '1 day')::DATE
    AND ends_at >= p_month
  ) INTO v_on_leave;

  -- Si está de licencia, no evaluar
  IF v_on_leave THEN
    UPDATE public.mentor_monthly_stats SET on_leave = true, updated_at = NOW()
    WHERE user_id = p_user_id AND period_month = p_month;

    RETURN QUERY SELECT true, true, false, 0, false;
    RETURN;
  END IF;

  -- Obtener stats del mes
  SELECT * INTO v_stats FROM public.mentor_monthly_stats
  WHERE user_id = p_user_id AND period_month = p_month;

  IF NOT FOUND THEN
    -- No hay stats = no cumplió
    INSERT INTO public.mentor_monthly_stats (user_id, period_month)
    VALUES (p_user_id, p_month);

    SELECT * INTO v_stats FROM public.mentor_monthly_stats
    WHERE user_id = p_user_id AND period_month = p_month;
  END IF;

  -- Si cumple mínimos, todo bien
  IF v_stats.meets_minimums THEN
    RETURN QUERY SELECT true, false, false, 0, false;
    RETURN;
  END IF;

  -- No cumplió: emitir aviso
  SELECT (config_value)::INTEGER INTO v_max_warnings FROM public.mentor_config WHERE config_key = 'max_warnings';

  SELECT COUNT(*) INTO v_active_warnings
  FROM public.mentor_warnings
  WHERE user_id = p_user_id AND is_active = true;

  v_new_warning_number := v_active_warnings + 1;

  IF v_new_warning_number > v_max_warnings THEN
    -- Expulsar: desactivar rol de mentor
    UPDATE public.user_roles SET is_active = false, updated_at = NOW()
    WHERE user_id = p_user_id AND role = 'mentor';

    -- Registrar cooldown en la última aplicación
    UPDATE public.mentor_applications SET
      can_reapply_at = NOW() + (
        (SELECT (config_value)::INTEGER FROM public.mentor_config WHERE config_key = 'cooldown_months') || ' months'
      )::INTERVAL,
      updated_at = NOW()
    WHERE user_id = p_user_id AND status = 'approved'
    ORDER BY decided_at DESC LIMIT 1;

    RETURN QUERY SELECT false, false, false, v_max_warnings, true;
    RETURN;
  END IF;

  -- Emitir aviso
  INSERT INTO public.mentor_warnings (user_id, warning_type, warning_number, reason, reference_month, issued_by)
  VALUES (
    p_user_id, 'missed_minimums', v_new_warning_number,
    'No cumplió los mínimos mensuales de ' || TO_CHAR(p_month, 'Month YYYY'),
    p_month, NULL
  );

  RETURN QUERY SELECT false, false, true, v_new_warning_number, false;
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
    PERFORM public.resolve_mentor_vote(v_app.id);
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
-- SECCIÓN 10: POLÍTICAS RLS
-- #####################################################

-- === RLS: mentor_config ===
ALTER TABLE public.mentor_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Config is viewable by everyone" ON public.mentor_config;
CREATE POLICY "Config is viewable by everyone" ON public.mentor_config FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only admins can manage config" ON public.mentor_config;
CREATE POLICY "Only admins can manage config" ON public.mentor_config FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true));

-- === RLS: mentor_points ===
ALTER TABLE public.mentor_points ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own points" ON public.mentor_points;
CREATE POLICY "Users can view own points" ON public.mentor_points FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all points" ON public.mentor_points;
CREATE POLICY "Admins can manage all points" ON public.mentor_points FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true));

-- === RLS: mentor_applications ===
ALTER TABLE public.mentor_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own applications" ON public.mentor_applications;
CREATE POLICY "Users can view own applications" ON public.mentor_applications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own applications" ON public.mentor_applications;
CREATE POLICY "Users can insert own applications" ON public.mentor_applications FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Mentors can view voting applications" ON public.mentor_applications;
CREATE POLICY "Mentors can view voting applications" ON public.mentor_applications FOR SELECT
  USING (
    status = 'voting'
    AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'mentor' AND is_active = true)
  );

DROP POLICY IF EXISTS "Admins can manage all applications" ON public.mentor_applications;
CREATE POLICY "Admins can manage all applications" ON public.mentor_applications FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true));

-- === RLS: mentor_application_votes ===
ALTER TABLE public.mentor_application_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Voters can view own votes" ON public.mentor_application_votes;
CREATE POLICY "Voters can view own votes" ON public.mentor_application_votes FOR SELECT USING (auth.uid() = voter_id);

DROP POLICY IF EXISTS "Mentors can insert votes" ON public.mentor_application_votes;
CREATE POLICY "Mentors can insert votes" ON public.mentor_application_votes FOR INSERT
  WITH CHECK (
    auth.uid() = voter_id
    AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'mentor' AND is_active = true)
  );

DROP POLICY IF EXISTS "Mentors can update own votes" ON public.mentor_application_votes;
CREATE POLICY "Mentors can update own votes" ON public.mentor_application_votes FOR UPDATE
  USING (auth.uid() = voter_id);

DROP POLICY IF EXISTS "Admins can view all votes" ON public.mentor_application_votes;
CREATE POLICY "Admins can view all votes" ON public.mentor_application_votes FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true));

-- === RLS: mentor_monthly_stats ===
ALTER TABLE public.mentor_monthly_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own stats" ON public.mentor_monthly_stats;
CREATE POLICY "Users can view own stats" ON public.mentor_monthly_stats FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all stats" ON public.mentor_monthly_stats;
CREATE POLICY "Admins can manage all stats" ON public.mentor_monthly_stats FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true));

-- === RLS: mentor_warnings ===
ALTER TABLE public.mentor_warnings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own warnings" ON public.mentor_warnings;
CREATE POLICY "Users can view own warnings" ON public.mentor_warnings FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all warnings" ON public.mentor_warnings;
CREATE POLICY "Admins can manage all warnings" ON public.mentor_warnings FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true));

-- === RLS: mentor_leaves ===
ALTER TABLE public.mentor_leaves ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own leaves" ON public.mentor_leaves;
CREATE POLICY "Users can view own leaves" ON public.mentor_leaves FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own leaves" ON public.mentor_leaves;
CREATE POLICY "Users can insert own leaves" ON public.mentor_leaves FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all leaves" ON public.mentor_leaves;
CREATE POLICY "Admins can manage all leaves" ON public.mentor_leaves FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true));


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
COMMENT ON FUNCTION public.can_apply_mentor IS 'Verifica elegibilidad para aplicar a mentor (puntos, cooldown, plazas)';
COMMENT ON FUNCTION public.submit_mentor_application IS 'Crea aplicación de mentor (determina si admin designa o votación)';
COMMENT ON FUNCTION public.vote_mentor_application IS 'Registra voto secreto en aplicación de mentor';
COMMENT ON FUNCTION public.resolve_mentor_vote IS 'Resuelve votación de aplicación (quórum + aprobación)';
COMMENT ON FUNCTION public.admin_decide_mentor_application IS 'Designación directa por admin cuando hay <20 mentores';
COMMENT ON FUNCTION public.evaluate_mentor_monthly IS 'Evalúa mínimos mensuales y emite avisos/expulsiones';
COMMENT ON FUNCTION public.request_mentor_leave IS 'Solicita licencia validando límite anual de 60 días';
COMMENT ON FUNCTION public.resolve_expired_mentor_votes IS 'Resuelve votaciones expiradas (para cron job)';
COMMENT ON FUNCTION public.get_mentor_leave_balance IS 'Obtiene balance de días de licencia restantes del año';


-- Verificar tablas creadas
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'mentor%' ORDER BY tablename;

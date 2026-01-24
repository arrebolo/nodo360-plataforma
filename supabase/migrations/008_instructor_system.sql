-- =====================================================
-- MIGRACIÓN 008: SISTEMA DE INSTRUCTORES
-- =====================================================
-- Fecha: 2026-01-23
-- Descripción: Sistema completo de certificación de instructores
--   - Exámenes por ruta (4 rutas)
--   - 10 modelos de examen por ruta, selección aleatoria sin repetir
--   - 20 preguntas por examen, dificultad alta
--   - 80% para aprobar (16/20), 25-30 min límite
--   - Cooldown 15 días si falla
--   - Si agota 10 modelos, espera 6 meses
--   - Certificación caduca a los 2 años
--   - Aviso 60 días antes de caducidad
-- =====================================================


-- #####################################################
-- SECCIÓN 1: TABLA DE EXÁMENES POR RUTA
-- #####################################################

CREATE TABLE IF NOT EXISTS public.instructor_exams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  learning_path_id UUID NOT NULL REFERENCES public.learning_paths(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  slug TEXT UNIQUE NOT NULL,
  total_questions INTEGER NOT NULL DEFAULT 20,
  pass_threshold INTEGER NOT NULL DEFAULT 80,
  time_limit_minutes INTEGER NOT NULL DEFAULT 30,
  total_models INTEGER NOT NULL DEFAULT 10,
  cooldown_days INTEGER NOT NULL DEFAULT 15,
  exhausted_cooldown_months INTEGER NOT NULL DEFAULT 6,
  certification_validity_years INTEGER NOT NULL DEFAULT 2,
  renewal_warning_days INTEGER NOT NULL DEFAULT 60,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_instructor_exams_path ON public.instructor_exams(learning_path_id);
CREATE INDEX IF NOT EXISTS idx_instructor_exams_slug ON public.instructor_exams(slug);
CREATE INDEX IF NOT EXISTS idx_instructor_exams_active ON public.instructor_exams(is_active) WHERE is_active = true;


-- #####################################################
-- SECCIÓN 2: MODELOS DE EXAMEN (10 por ruta)
-- #####################################################

CREATE TABLE IF NOT EXISTS public.instructor_exam_models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID NOT NULL REFERENCES public.instructor_exams(id) ON DELETE CASCADE,
  model_number INTEGER NOT NULL,
  title TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(exam_id, model_number),
  CONSTRAINT valid_model_number CHECK (model_number >= 1 AND model_number <= 10)
);

CREATE INDEX IF NOT EXISTS idx_exam_models_exam ON public.instructor_exam_models(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_models_active ON public.instructor_exam_models(exam_id, is_active) WHERE is_active = true;


-- #####################################################
-- SECCIÓN 3: PREGUNTAS DE EXAMEN (20 por modelo)
-- #####################################################

CREATE TABLE IF NOT EXISTS public.instructor_exam_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_id UUID NOT NULL REFERENCES public.instructor_exam_models(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  explanation TEXT,
  options JSONB NOT NULL,
  correct_answer INTEGER NOT NULL,
  order_index INTEGER NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'hard' CHECK (difficulty IN ('medium', 'hard', 'expert')),
  points INTEGER DEFAULT 1,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT valid_correct_answer CHECK (correct_answer >= 0 AND correct_answer <= 3),
  CONSTRAINT valid_options CHECK (jsonb_array_length(options) = 4),
  CONSTRAINT valid_order_index CHECK (order_index >= 1 AND order_index <= 20),
  UNIQUE(model_id, order_index)
);

CREATE INDEX IF NOT EXISTS idx_exam_questions_model ON public.instructor_exam_questions(model_id);
CREATE INDEX IF NOT EXISTS idx_exam_questions_order ON public.instructor_exam_questions(model_id, order_index);
CREATE INDEX IF NOT EXISTS idx_exam_questions_category ON public.instructor_exam_questions(category);


-- #####################################################
-- SECCIÓN 4: INTENTOS DE EXAMEN
-- #####################################################

CREATE TABLE IF NOT EXISTS public.instructor_exam_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES public.instructor_exams(id) ON DELETE CASCADE,
  model_id UUID NOT NULL REFERENCES public.instructor_exam_models(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  passed BOOLEAN NOT NULL,
  answers JSONB NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL,
  time_spent_seconds INTEGER NOT NULL,
  time_limit_exceeded BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('in_progress', 'completed', 'timed_out', 'abandoned')),
  next_attempt_available_at TIMESTAMPTZ,
  models_exhausted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_exam_attempts_user ON public.instructor_exam_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_exam ON public.instructor_exam_attempts(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_user_exam ON public.instructor_exam_attempts(user_id, exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_completed ON public.instructor_exam_attempts(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_passed ON public.instructor_exam_attempts(user_id, passed) WHERE passed = true;
CREATE INDEX IF NOT EXISTS idx_exam_attempts_cooldown ON public.instructor_exam_attempts(user_id, next_attempt_available_at);


-- #####################################################
-- SECCIÓN 5: CERTIFICACIONES DE INSTRUCTOR
-- #####################################################

CREATE TABLE IF NOT EXISTS public.instructor_certifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES public.instructor_exams(id) ON DELETE CASCADE,
  learning_path_id UUID NOT NULL REFERENCES public.learning_paths(id) ON DELETE CASCADE,
  attempt_id UUID NOT NULL REFERENCES public.instructor_exam_attempts(id) ON DELETE CASCADE,
  certification_number TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked', 'renewal_pending')),
  issued_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  renewed_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  revoked_reason TEXT,
  renewal_warning_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, learning_path_id)
);

CREATE INDEX IF NOT EXISTS idx_certifications_user ON public.instructor_certifications(user_id);
CREATE INDEX IF NOT EXISTS idx_certifications_path ON public.instructor_certifications(learning_path_id);
CREATE INDEX IF NOT EXISTS idx_certifications_status ON public.instructor_certifications(status);
CREATE INDEX IF NOT EXISTS idx_certifications_expires ON public.instructor_certifications(expires_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_certifications_renewal_warning ON public.instructor_certifications(expires_at, renewal_warning_sent)
  WHERE status = 'active' AND renewal_warning_sent = false;
CREATE INDEX IF NOT EXISTS idx_certifications_number ON public.instructor_certifications(certification_number);


-- #####################################################
-- SECCIÓN 6: PERFILES DE INSTRUCTOR
-- #####################################################

CREATE TABLE IF NOT EXISTS public.instructor_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  bio TEXT,
  headline TEXT,
  specialties TEXT[],
  certified_paths UUID[],
  total_courses INTEGER DEFAULT 0,
  total_students INTEGER DEFAULT 0,
  total_revenue_cents INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  accepts_messages BOOLEAN DEFAULT true,
  max_courses INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_instructor_profiles_user ON public.instructor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_instructor_profiles_active ON public.instructor_profiles(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_instructor_profiles_verified ON public.instructor_profiles(is_verified) WHERE is_verified = true;
CREATE INDEX IF NOT EXISTS idx_instructor_profiles_rating ON public.instructor_profiles(average_rating DESC);


-- #####################################################
-- SECCIÓN 7: FUNCIONES
-- #####################################################

-- =====================================================
-- Función: Verificar si usuario puede intentar examen
-- =====================================================
CREATE OR REPLACE FUNCTION public.can_attempt_exam(p_user_id UUID, p_exam_id UUID)
RETURNS TABLE (
  can_attempt BOOLEAN,
  reason TEXT,
  next_available_at TIMESTAMPTZ,
  models_used INTEGER,
  total_models INTEGER
) AS $$
DECLARE
  v_last_attempt RECORD;
  v_exam RECORD;
  v_models_used INTEGER;
  v_total_models INTEGER;
  v_next_available TIMESTAMPTZ;
BEGIN
  -- Obtener configuración del examen
  SELECT * INTO v_exam FROM public.instructor_exams WHERE id = p_exam_id AND is_active = true;
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Examen no encontrado o inactivo'::TEXT, NULL::TIMESTAMPTZ, 0, 0;
    RETURN;
  END IF;

  v_total_models := v_exam.total_models;

  -- Verificar si ya tiene certificación activa para esta ruta
  IF EXISTS (
    SELECT 1 FROM public.instructor_certifications
    WHERE user_id = p_user_id AND exam_id = p_exam_id AND status = 'active' AND expires_at > NOW()
  ) THEN
    RETURN QUERY SELECT false, 'Ya tienes una certificación activa para esta ruta'::TEXT, NULL::TIMESTAMPTZ, 0, v_total_models;
    RETURN;
  END IF;

  -- Contar modelos ya usados
  SELECT COUNT(DISTINCT model_id) INTO v_models_used
  FROM public.instructor_exam_attempts
  WHERE user_id = p_user_id AND exam_id = p_exam_id AND status = 'completed';

  -- Si agotó todos los modelos, cooldown de 6 meses desde último intento
  IF v_models_used >= v_total_models THEN
    SELECT completed_at INTO v_next_available
    FROM public.instructor_exam_attempts
    WHERE user_id = p_user_id AND exam_id = p_exam_id AND status = 'completed'
    ORDER BY completed_at DESC LIMIT 1;

    v_next_available := v_next_available + (v_exam.exhausted_cooldown_months || ' months')::INTERVAL;

    IF v_next_available > NOW() THEN
      RETURN QUERY SELECT false, 'Has agotado todos los modelos. Debes esperar 6 meses.'::TEXT, v_next_available, v_models_used, v_total_models;
      RETURN;
    ELSE
      v_models_used := 0;
    END IF;
  END IF;

  -- Obtener último intento
  SELECT * INTO v_last_attempt
  FROM public.instructor_exam_attempts
  WHERE user_id = p_user_id AND exam_id = p_exam_id AND status = 'completed'
  ORDER BY completed_at DESC LIMIT 1;

  -- Si tiene intentos previos fallidos, verificar cooldown de 15 días
  IF FOUND AND NOT v_last_attempt.passed THEN
    v_next_available := v_last_attempt.completed_at + (v_exam.cooldown_days || ' days')::INTERVAL;
    IF v_next_available > NOW() THEN
      RETURN QUERY SELECT false, 'Debes esperar el período de cooldown.'::TEXT, v_next_available, v_models_used, v_total_models;
      RETURN;
    END IF;
  END IF;

  -- Puede intentar
  RETURN QUERY SELECT true, 'Puedes intentar el examen'::TEXT, NULL::TIMESTAMPTZ, v_models_used, v_total_models;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =====================================================
-- Función: Seleccionar modelo aleatorio no usado
-- =====================================================
CREATE OR REPLACE FUNCTION public.select_exam_model(p_user_id UUID, p_exam_id UUID)
RETURNS UUID AS $$
DECLARE
  v_model_id UUID;
  v_models_used UUID[];
  v_exhausted_cooldown_months INTEGER;
  v_last_exhausted_at TIMESTAMPTZ;
BEGIN
  SELECT exhausted_cooldown_months INTO v_exhausted_cooldown_months
  FROM public.instructor_exams WHERE id = p_exam_id;

  SELECT ARRAY_AGG(DISTINCT model_id) INTO v_models_used
  FROM public.instructor_exam_attempts
  WHERE user_id = p_user_id AND exam_id = p_exam_id AND status = 'completed';

  -- Si ya usó todos, verificar si pasó el cooldown para resetear
  IF v_models_used IS NOT NULL AND array_length(v_models_used, 1) >= 10 THEN
    SELECT completed_at INTO v_last_exhausted_at
    FROM public.instructor_exam_attempts
    WHERE user_id = p_user_id AND exam_id = p_exam_id AND status = 'completed'
    ORDER BY completed_at DESC LIMIT 1;

    IF v_last_exhausted_at + (v_exhausted_cooldown_months || ' months')::INTERVAL <= NOW() THEN
      v_models_used := NULL;
    ELSE
      RETURN NULL;
    END IF;
  END IF;

  -- Seleccionar modelo aleatorio no usado
  IF v_models_used IS NULL THEN
    SELECT id INTO v_model_id
    FROM public.instructor_exam_models
    WHERE exam_id = p_exam_id AND is_active = true
    ORDER BY random() LIMIT 1;
  ELSE
    SELECT id INTO v_model_id
    FROM public.instructor_exam_models
    WHERE exam_id = p_exam_id AND is_active = true
    AND id != ALL(v_models_used)
    ORDER BY random() LIMIT 1;
  END IF;

  RETURN v_model_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =====================================================
-- Función: Generar número de certificación de instructor
-- Formato: NODO360-INST-{RUTA}-{AÑO}-{SECUENCIAL}
-- =====================================================
CREATE OR REPLACE FUNCTION public.generate_instructor_cert_number(p_path_slug TEXT)
RETURNS TEXT AS $$
DECLARE
  v_year TEXT;
  v_count INTEGER;
  v_path_code TEXT;
BEGIN
  v_year := TO_CHAR(NOW(), 'YYYY');
  v_path_code := UPPER(LEFT(p_path_slug, 3));

  SELECT COUNT(*) + 1 INTO v_count
  FROM public.instructor_certifications ic
  JOIN public.instructor_exams ie ON ic.exam_id = ie.id
  JOIN public.learning_paths lp ON ie.learning_path_id = lp.id
  WHERE lp.slug = p_path_slug
  AND EXTRACT(YEAR FROM ic.issued_at) = EXTRACT(YEAR FROM NOW());

  RETURN 'NODO360-INST-' || v_path_code || '-' || v_year || '-' || LPAD(v_count::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =====================================================
-- Función: Emitir certificación tras aprobar examen
-- =====================================================
CREATE OR REPLACE FUNCTION public.issue_instructor_certification(
  p_user_id UUID,
  p_attempt_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_attempt RECORD;
  v_exam RECORD;
  v_path RECORD;
  v_cert_id UUID;
  v_cert_number TEXT;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Obtener datos del intento
  SELECT * INTO v_attempt FROM public.instructor_exam_attempts
  WHERE id = p_attempt_id AND user_id = p_user_id AND passed = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Intento no encontrado o no aprobado';
  END IF;

  -- Obtener examen y ruta
  SELECT * INTO v_exam FROM public.instructor_exams WHERE id = v_attempt.exam_id;
  SELECT * INTO v_path FROM public.learning_paths WHERE id = v_exam.learning_path_id;

  -- Generar número y fecha de expiración
  v_cert_number := public.generate_instructor_cert_number(v_path.slug);
  v_expires_at := NOW() + (v_exam.certification_validity_years || ' years')::INTERVAL;

  -- Insertar certificación (ON CONFLICT actualiza si ya existe para esa ruta)
  INSERT INTO public.instructor_certifications (
    user_id, exam_id, attempt_id, learning_path_id,
    certification_number, expires_at
  ) VALUES (
    p_user_id, v_attempt.exam_id, p_attempt_id, v_exam.learning_path_id,
    v_cert_number, v_expires_at
  )
  ON CONFLICT (user_id, learning_path_id) DO UPDATE SET
    exam_id = EXCLUDED.exam_id,
    attempt_id = EXCLUDED.attempt_id,
    certification_number = EXCLUDED.certification_number,
    status = 'active',
    issued_at = NOW(),
    expires_at = EXCLUDED.expires_at,
    renewed_at = NOW(),
    renewal_warning_sent = false,
    updated_at = NOW()
  RETURNING id INTO v_cert_id;

  -- Actualizar perfil de instructor (crear si no existe)
  INSERT INTO public.instructor_profiles (user_id, specialties, certified_paths)
  VALUES (p_user_id, ARRAY[v_path.slug], ARRAY[v_path.id])
  ON CONFLICT (user_id) DO UPDATE SET
    specialties = array_append(
      array_remove(instructor_profiles.specialties, v_path.slug),
      v_path.slug
    ),
    certified_paths = array_append(
      array_remove(instructor_profiles.certified_paths, v_path.id),
      v_path.id
    ),
    updated_at = NOW();

  -- Otorgar rol de instructor
  INSERT INTO public.user_roles (user_id, role, notes)
  VALUES (p_user_id, 'instructor', 'Certificación aprobada: ' || v_path.title)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN v_cert_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =====================================================
-- Función: Verificar certificaciones próximas a expirar
-- =====================================================
CREATE OR REPLACE FUNCTION public.check_expiring_certifications()
RETURNS TABLE (
  certification_id UUID,
  user_id UUID,
  exam_title TEXT,
  path_title TEXT,
  expires_at TIMESTAMPTZ,
  days_remaining INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ic.id,
    ic.user_id,
    ie.title,
    lp.title,
    ic.expires_at,
    EXTRACT(DAY FROM ic.expires_at - NOW())::INTEGER as days_remaining
  FROM public.instructor_certifications ic
  JOIN public.instructor_exams ie ON ic.exam_id = ie.id
  JOIN public.learning_paths lp ON ie.learning_path_id = lp.id
  WHERE ic.status = 'active'
  AND ic.renewal_warning_sent = false
  AND ic.expires_at <= NOW() + (ie.renewal_warning_days || ' days')::INTERVAL
  AND ic.expires_at > NOW()
  ORDER BY ic.expires_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =====================================================
-- Función: Expirar certificaciones vencidas
-- =====================================================
CREATE OR REPLACE FUNCTION public.expire_certifications()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.instructor_certifications
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'active' AND expires_at <= NOW();

  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- Actualizar perfiles: remover especialidades expiradas
  UPDATE public.instructor_profiles ip
  SET
    specialties = (
      SELECT COALESCE(ARRAY_AGG(DISTINCT lp.slug), '{}')
      FROM public.instructor_certifications ic
      JOIN public.instructor_exams ie ON ic.exam_id = ie.id
      JOIN public.learning_paths lp ON ie.learning_path_id = lp.id
      WHERE ic.user_id = ip.user_id AND ic.status = 'active'
    ),
    certified_paths = (
      SELECT COALESCE(ARRAY_AGG(DISTINCT ic.learning_path_id), '{}')
      FROM public.instructor_certifications ic
      WHERE ic.user_id = ip.user_id AND ic.status = 'active'
    ),
    updated_at = NOW()
  WHERE user_id IN (
    SELECT user_id FROM public.instructor_certifications
    WHERE status = 'expired' AND updated_at >= NOW() - INTERVAL '1 minute'
  );

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =====================================================
-- Función: Calcular resultado del intento (trigger)
-- =====================================================
CREATE OR REPLACE FUNCTION public.calculate_exam_attempt_result()
RETURNS TRIGGER AS $$
DECLARE
  v_models_used INTEGER;
  v_total_models INTEGER;
  v_cooldown_days INTEGER;
  v_exhausted_months INTEGER;
  v_time_limit INTEGER;
BEGIN
  -- Obtener configuración del examen
  SELECT time_limit_minutes, total_models, cooldown_days, exhausted_cooldown_months
  INTO v_time_limit, v_total_models, v_cooldown_days, v_exhausted_months
  FROM public.instructor_exams WHERE id = NEW.exam_id;

  -- Calcular score
  NEW.score := ROUND(NEW.correct_answers::DECIMAL / NULLIF(NEW.total_questions, 0) * 100);

  -- Calcular si aprobó (80%)
  NEW.passed := NEW.score >= 80;

  -- Calcular tiempo
  NEW.time_spent_seconds := EXTRACT(EPOCH FROM (NEW.completed_at - NEW.started_at))::INTEGER;

  -- Verificar si excedió tiempo
  NEW.time_limit_exceeded := NEW.time_spent_seconds > (v_time_limit * 60);

  -- Si excedió tiempo, no aprobado
  IF NEW.time_limit_exceeded THEN
    NEW.passed := false;
    NEW.status := 'timed_out';
  END IF;

  -- Si no aprobó, calcular próximo intento disponible
  IF NOT NEW.passed THEN
    SELECT COUNT(DISTINCT model_id) + 1 INTO v_models_used
    FROM public.instructor_exam_attempts
    WHERE user_id = NEW.user_id AND exam_id = NEW.exam_id AND status = 'completed';

    IF v_models_used >= v_total_models THEN
      NEW.models_exhausted := true;
      NEW.next_attempt_available_at := NEW.completed_at + (v_exhausted_months || ' months')::INTERVAL;
    ELSE
      NEW.next_attempt_available_at := NEW.completed_at + (v_cooldown_days || ' days')::INTERVAL;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- #####################################################
-- SECCIÓN 8: TRIGGERS
-- #####################################################

DROP TRIGGER IF EXISTS trigger_calculate_exam_result ON public.instructor_exam_attempts;
CREATE TRIGGER trigger_calculate_exam_result
  BEFORE INSERT ON public.instructor_exam_attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_exam_attempt_result();

DROP TRIGGER IF EXISTS trigger_instructor_exams_updated_at ON public.instructor_exams;
CREATE TRIGGER trigger_instructor_exams_updated_at
  BEFORE UPDATE ON public.instructor_exams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_exam_models_updated_at ON public.instructor_exam_models;
CREATE TRIGGER trigger_exam_models_updated_at
  BEFORE UPDATE ON public.instructor_exam_models
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_exam_questions_updated_at ON public.instructor_exam_questions;
CREATE TRIGGER trigger_exam_questions_updated_at
  BEFORE UPDATE ON public.instructor_exam_questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_certifications_updated_at ON public.instructor_certifications;
CREATE TRIGGER trigger_certifications_updated_at
  BEFORE UPDATE ON public.instructor_certifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_instructor_profiles_updated_at ON public.instructor_profiles;
CREATE TRIGGER trigger_instructor_profiles_updated_at
  BEFORE UPDATE ON public.instructor_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- #####################################################
-- SECCIÓN 9: POLÍTICAS RLS
-- #####################################################

-- === RLS: instructor_exams ===
ALTER TABLE public.instructor_exams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active exams" ON public.instructor_exams;
CREATE POLICY "Anyone can view active exams" ON public.instructor_exams FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage exams" ON public.instructor_exams;
CREATE POLICY "Admins can manage exams" ON public.instructor_exams FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true));

-- === RLS: instructor_exam_models ===
ALTER TABLE public.instructor_exam_models ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage exam models" ON public.instructor_exam_models;
CREATE POLICY "Admins can manage exam models" ON public.instructor_exam_models FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true));

DROP POLICY IF EXISTS "Users can view assigned models" ON public.instructor_exam_models;
CREATE POLICY "Users can view assigned models" ON public.instructor_exam_models FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.instructor_exam_attempts
    WHERE user_id = auth.uid() AND model_id = instructor_exam_models.id
  ));

-- === RLS: instructor_exam_questions ===
ALTER TABLE public.instructor_exam_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage questions" ON public.instructor_exam_questions;
CREATE POLICY "Admins can manage questions" ON public.instructor_exam_questions FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true));

DROP POLICY IF EXISTS "Users can view questions of assigned model" ON public.instructor_exam_questions;
CREATE POLICY "Users can view questions of assigned model" ON public.instructor_exam_questions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.instructor_exam_attempts
    WHERE user_id = auth.uid() AND model_id = instructor_exam_questions.model_id
    AND status = 'in_progress'
  ));

-- === RLS: instructor_exam_attempts ===
ALTER TABLE public.instructor_exam_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own attempts" ON public.instructor_exam_attempts;
CREATE POLICY "Users can view own attempts" ON public.instructor_exam_attempts FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own attempts" ON public.instructor_exam_attempts;
CREATE POLICY "Users can insert own attempts" ON public.instructor_exam_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own in-progress attempts" ON public.instructor_exam_attempts;
CREATE POLICY "Users can update own in-progress attempts" ON public.instructor_exam_attempts FOR UPDATE
  USING (auth.uid() = user_id AND status = 'in_progress');

DROP POLICY IF EXISTS "Admins can view all attempts" ON public.instructor_exam_attempts;
CREATE POLICY "Admins can view all attempts" ON public.instructor_exam_attempts FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true));

-- === RLS: instructor_certifications ===
ALTER TABLE public.instructor_certifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own certifications" ON public.instructor_certifications;
CREATE POLICY "Users can view own certifications" ON public.instructor_certifications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Active certifications are public" ON public.instructor_certifications;
CREATE POLICY "Active certifications are public" ON public.instructor_certifications FOR SELECT USING (status = 'active');

DROP POLICY IF EXISTS "Admins can manage certifications" ON public.instructor_certifications;
CREATE POLICY "Admins can manage certifications" ON public.instructor_certifications FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true));

-- === RLS: instructor_profiles ===
ALTER TABLE public.instructor_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active profiles are public" ON public.instructor_profiles;
CREATE POLICY "Active profiles are public" ON public.instructor_profiles FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.instructor_profiles;
CREATE POLICY "Users can update own profile" ON public.instructor_profiles FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage profiles" ON public.instructor_profiles;
CREATE POLICY "Admins can manage profiles" ON public.instructor_profiles FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true));


-- #####################################################
-- SECCIÓN 10: DATOS INICIALES
-- #####################################################

-- Crear exámenes para las rutas activas
INSERT INTO public.instructor_exams (learning_path_id, title, description, slug)
SELECT
  lp.id,
  'Examen de Instructor - ' || lp.title,
  'Examen de certificación para instructores en la ruta ' || lp.title || '. ' ||
  '20 preguntas de dificultad alta. Necesitas 80% (16/20) para aprobar. Tiempo límite: 30 minutos.',
  'instructor-exam-' || lp.slug
FROM public.learning_paths lp
WHERE lp.is_active = true
ON CONFLICT (slug) DO NOTHING;

-- Crear 10 modelos (A-J) por cada examen
INSERT INTO public.instructor_exam_models (exam_id, model_number, title)
SELECT
  ie.id,
  model_num,
  'Modelo ' || CHR(64 + model_num)
FROM public.instructor_exams ie
CROSS JOIN generate_series(1, 10) AS model_num
ON CONFLICT (exam_id, model_number) DO NOTHING;


-- #####################################################
-- SECCIÓN 11: COMENTARIOS
-- #####################################################

COMMENT ON TABLE public.instructor_exams IS 'Definición de exámenes de certificación por ruta';
COMMENT ON TABLE public.instructor_exam_models IS '10 modelos de examen por ruta, selección aleatoria';
COMMENT ON TABLE public.instructor_exam_questions IS 'Preguntas de cada modelo (20 por modelo, dificultad alta)';
COMMENT ON TABLE public.instructor_exam_attempts IS 'Intentos de examen con cooldowns y control de modelos';
COMMENT ON TABLE public.instructor_certifications IS 'Certificaciones de instructor (válidas 2 años)';
COMMENT ON TABLE public.instructor_profiles IS 'Perfil público del instructor con especialidades y stats';

COMMENT ON FUNCTION public.can_attempt_exam IS 'Verifica si usuario puede intentar examen (cooldowns, modelos)';
COMMENT ON FUNCTION public.select_exam_model IS 'Selecciona modelo aleatorio no usado para el usuario';
COMMENT ON FUNCTION public.generate_instructor_cert_number IS 'Genera número único de certificación de instructor';
COMMENT ON FUNCTION public.issue_instructor_certification IS 'Emite certificación tras aprobar examen y actualiza perfil';
COMMENT ON FUNCTION public.check_expiring_certifications IS 'Lista certificaciones próximas a expirar (60 días)';
COMMENT ON FUNCTION public.expire_certifications IS 'Expira certificaciones vencidas y actualiza perfiles';


-- Verificar tablas creadas
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'instructor%' ORDER BY tablename;

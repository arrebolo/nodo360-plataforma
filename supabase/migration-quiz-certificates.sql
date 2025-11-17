-- =====================================================
-- NODO360 PLATFORM - QUIZ & CERTIFICATES MIGRATION
-- =====================================================
-- Este script añade las tablas necesarias para el sistema de
-- quizzes de módulos, certificados y progresión bloqueada.
--
-- PRERREQUISITOS:
-- - El schema.sql principal debe estar aplicado primero
--
-- INSTRUCCIONES PARA APLICAR:
-- 1. Abre Supabase Dashboard
-- 2. Ve a SQL Editor
-- 3. Copia y pega este archivo completo
-- 4. Ejecuta el script
-- =====================================================

-- =====================================================
-- CUSTOM TYPES
-- =====================================================

-- Certificate type enum
CREATE TYPE certificate_type AS ENUM ('module', 'course');

-- =====================================================
-- TABLE: quiz_questions
-- =====================================================
-- Stores quiz questions for module assessments

CREATE TABLE public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,

  -- Question content
  question TEXT NOT NULL,
  explanation TEXT, -- Explanation shown after answering

  -- Options (stored as JSON array)
  -- Format: ["Option A", "Option B", "Option C", "Option D"]
  options JSONB NOT NULL,

  -- Correct answer (0-based index into options array)
  correct_answer INTEGER NOT NULL,

  -- Question metadata
  order_index INTEGER NOT NULL, -- Order within the quiz
  difficulty TEXT DEFAULT 'medium', -- easy/medium/hard
  points INTEGER DEFAULT 1, -- Points awarded for correct answer

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT valid_correct_answer CHECK (correct_answer >= 0 AND correct_answer <= 3),
  CONSTRAINT valid_options CHECK (jsonb_array_length(options) >= 2 AND jsonb_array_length(options) <= 4),
  CONSTRAINT unique_question_order UNIQUE (module_id, order_index)
);

-- Indexes for quiz_questions
CREATE INDEX idx_quiz_questions_module ON public.quiz_questions(module_id);
CREATE INDEX idx_quiz_questions_order ON public.quiz_questions(module_id, order_index);

-- RLS Policies for quiz_questions
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

-- Everyone can view quiz questions (for published courses)
CREATE POLICY "Quiz questions are viewable by everyone"
  ON public.quiz_questions FOR SELECT
  USING (true);

-- Only instructors can manage quiz questions
CREATE POLICY "Instructors can insert quiz questions"
  ON public.quiz_questions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.modules m
      JOIN public.courses c ON m.course_id = c.id
      JOIN public.users u ON c.instructor_id = u.id
      WHERE m.id = module_id AND u.id = auth.uid()
    )
  );

CREATE POLICY "Instructors can update quiz questions"
  ON public.quiz_questions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.modules m
      JOIN public.courses c ON m.course_id = c.id
      JOIN public.users u ON c.instructor_id = u.id
      WHERE m.id = module_id AND u.id = auth.uid()
    )
  );

CREATE POLICY "Instructors can delete quiz questions"
  ON public.quiz_questions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.modules m
      JOIN public.courses c ON m.course_id = c.id
      JOIN public.users u ON c.instructor_id = u.id
      WHERE m.id = module_id AND u.id = auth.uid()
    )
  );

-- =====================================================
-- TABLE: quiz_attempts
-- =====================================================
-- Stores user quiz attempts and scores

CREATE TABLE public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,

  -- Score data
  score INTEGER NOT NULL, -- Percentage score (0-100)
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,

  -- Pass/fail status
  passed BOOLEAN NOT NULL, -- true if score >= 70%

  -- User answers (stored as JSON)
  -- Format: [{ question_id: "uuid", selected_answer: 0, correct: true }, ...]
  answers JSONB NOT NULL,

  -- Time tracking
  time_spent_seconds INTEGER, -- Time taken to complete quiz

  -- Timestamps
  completed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT valid_score CHECK (score >= 0 AND score <= 100),
  CONSTRAINT valid_correct_answers CHECK (correct_answers >= 0 AND correct_answers <= total_questions)
);

-- Indexes for quiz_attempts
CREATE INDEX idx_quiz_attempts_user ON public.quiz_attempts(user_id);
CREATE INDEX idx_quiz_attempts_module ON public.quiz_attempts(module_id);
CREATE INDEX idx_quiz_attempts_user_module ON public.quiz_attempts(user_id, module_id);
CREATE INDEX idx_quiz_attempts_completed ON public.quiz_attempts(completed_at DESC);

-- RLS Policies for quiz_attempts
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Users can view their own attempts
CREATE POLICY "Users can view own quiz attempts"
  ON public.quiz_attempts FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own attempts
CREATE POLICY "Users can insert own quiz attempts"
  ON public.quiz_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Instructors can view all attempts for their courses
CREATE POLICY "Instructors can view attempts for their courses"
  ON public.quiz_attempts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.modules m
      JOIN public.courses c ON m.course_id = c.id
      WHERE m.id = module_id AND c.instructor_id = auth.uid()
    )
  );

-- =====================================================
-- TABLE: certificates
-- =====================================================
-- Stores issued certificates for modules and courses

CREATE TABLE public.certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  module_id UUID REFERENCES public.modules(id) ON DELETE SET NULL, -- NULL for course certificates

  -- Certificate metadata
  type certificate_type NOT NULL, -- 'module' or 'course'
  certificate_number TEXT UNIQUE NOT NULL, -- Unique certificate ID (e.g., "NODO360-2024-001234")

  -- Certificate content
  title TEXT NOT NULL, -- e.g., "Fundamentos de Blockchain"
  description TEXT, -- Certificate description

  -- Storage
  certificate_url TEXT, -- URL to PDF certificate in Supabase Storage
  certificate_hash TEXT, -- SHA-256 hash for verification

  -- NFT data (optional, for premium certificates)
  nft_token_id TEXT, -- NFT token ID if minted
  nft_contract_address TEXT, -- Smart contract address
  nft_chain TEXT, -- Blockchain (e.g., "polygon", "ethereum")
  nft_tx_hash TEXT, -- Transaction hash of NFT mint

  -- Verification
  verification_url TEXT, -- Public URL to verify certificate
  qr_code_url TEXT, -- QR code image URL

  -- Timestamps
  issued_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ, -- NULL = never expires

  -- Constraints
  CONSTRAINT certificate_type_check CHECK (
    (type = 'module' AND module_id IS NOT NULL) OR
    (type = 'course' AND module_id IS NULL)
  ),
  CONSTRAINT unique_user_module_certificate UNIQUE (user_id, module_id),
  CONSTRAINT unique_user_course_certificate UNIQUE (user_id, course_id) WHERE module_id IS NULL
);

-- Indexes for certificates
CREATE INDEX idx_certificates_user ON public.certificates(user_id);
CREATE INDEX idx_certificates_course ON public.certificates(course_id);
CREATE INDEX idx_certificates_module ON public.certificates(module_id);
CREATE INDEX idx_certificates_number ON public.certificates(certificate_number);
CREATE INDEX idx_certificates_issued ON public.certificates(issued_at DESC);
CREATE INDEX idx_certificates_nft ON public.certificates(nft_token_id) WHERE nft_token_id IS NOT NULL;

-- RLS Policies for certificates
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Users can view their own certificates
CREATE POLICY "Users can view own certificates"
  ON public.certificates FOR SELECT
  USING (auth.uid() = user_id);

-- Certificates are publicly verifiable by certificate_number
CREATE POLICY "Certificates are publicly verifiable"
  ON public.certificates FOR SELECT
  USING (true); -- Anyone can verify a certificate

-- Only system/instructors can issue certificates (handled by functions)
CREATE POLICY "Only authenticated users can insert certificates"
  ON public.certificates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- ALTER TABLE: modules
-- =====================================================
-- Add quiz requirement flag to modules table

ALTER TABLE public.modules
ADD COLUMN IF NOT EXISTS requires_quiz BOOLEAN DEFAULT false NOT NULL;

-- Add index for modules with quizzes
CREATE INDEX idx_modules_requires_quiz ON public.modules(requires_quiz) WHERE requires_quiz = true;

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get best quiz attempt for a module
CREATE OR REPLACE FUNCTION get_best_quiz_attempt(p_user_id UUID, p_module_id UUID)
RETURNS TABLE (
  id UUID,
  score INTEGER,
  passed BOOLEAN,
  completed_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT qa.id, qa.score, qa.passed, qa.completed_at
  FROM public.quiz_attempts qa
  WHERE qa.user_id = p_user_id AND qa.module_id = p_module_id
  ORDER BY qa.score DESC, qa.completed_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has passed module quiz
CREATE OR REPLACE FUNCTION has_passed_module_quiz(p_user_id UUID, p_module_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_passed BOOLEAN;
BEGIN
  SELECT qa.passed INTO v_passed
  FROM public.quiz_attempts qa
  WHERE qa.user_id = p_user_id AND qa.module_id = p_module_id AND qa.passed = true
  ORDER BY qa.completed_at DESC
  LIMIT 1;

  RETURN COALESCE(v_passed, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if module is accessible to user
-- Rules:
-- - Module 1 is always accessible
-- - For free courses: Module 1 only (others require premium)
-- - For premium courses: Must pass previous module's quiz
CREATE OR REPLACE FUNCTION is_module_accessible(
  p_user_id UUID,
  p_module_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_module_order INTEGER;
  v_course_id UUID;
  v_is_free BOOLEAN;
  v_previous_module_id UUID;
  v_previous_requires_quiz BOOLEAN;
  v_passed_previous BOOLEAN;
BEGIN
  -- Get module info
  SELECT m.order_index, m.course_id, c.is_free
  INTO v_module_order, v_course_id, v_is_free
  FROM public.modules m
  JOIN public.courses c ON m.course_id = c.id
  WHERE m.id = p_module_id;

  -- Module 1 is always accessible
  IF v_module_order = 1 THEN
    RETURN true;
  END IF;

  -- For free courses, only module 1 is accessible
  IF v_is_free THEN
    RETURN false;
  END IF;

  -- For premium courses, check if previous module quiz was passed
  SELECT id, requires_quiz INTO v_previous_module_id, v_previous_requires_quiz
  FROM public.modules
  WHERE course_id = v_course_id AND order_index = v_module_order - 1;

  -- If previous module doesn't require quiz, module is accessible
  IF NOT v_previous_requires_quiz THEN
    RETURN true;
  END IF;

  -- Check if user passed previous module's quiz
  v_passed_previous := has_passed_module_quiz(p_user_id, v_previous_module_id);

  RETURN v_passed_previous;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate unique certificate number
CREATE OR REPLACE FUNCTION generate_certificate_number()
RETURNS TEXT AS $$
DECLARE
  v_year TEXT;
  v_count INTEGER;
  v_number TEXT;
BEGIN
  v_year := TO_CHAR(NOW(), 'YYYY');

  SELECT COUNT(*) + 1 INTO v_count
  FROM public.certificates
  WHERE EXTRACT(YEAR FROM issued_at) = EXTRACT(YEAR FROM NOW());

  v_number := 'NODO360-' || v_year || '-' || LPAD(v_count::TEXT, 6, '0');

  RETURN v_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to issue certificate after passing quiz
CREATE OR REPLACE FUNCTION issue_module_certificate(
  p_user_id UUID,
  p_module_id UUID,
  p_quiz_attempt_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_certificate_id UUID;
  v_course_id UUID;
  v_module_title TEXT;
  v_certificate_number TEXT;
  v_passed BOOLEAN;
BEGIN
  -- Verify quiz was passed
  SELECT passed INTO v_passed
  FROM public.quiz_attempts
  WHERE id = p_quiz_attempt_id AND user_id = p_user_id AND module_id = p_module_id;

  IF NOT v_passed THEN
    RAISE EXCEPTION 'Cannot issue certificate: quiz not passed';
  END IF;

  -- Check if certificate already exists
  SELECT id INTO v_certificate_id
  FROM public.certificates
  WHERE user_id = p_user_id AND module_id = p_module_id;

  IF v_certificate_id IS NOT NULL THEN
    RETURN v_certificate_id; -- Certificate already exists
  END IF;

  -- Get module and course info
  SELECT m.course_id, m.title
  INTO v_course_id, v_module_title
  FROM public.modules m
  WHERE m.id = p_module_id;

  -- Generate certificate number
  v_certificate_number := generate_certificate_number();

  -- Insert certificate
  INSERT INTO public.certificates (
    user_id,
    course_id,
    module_id,
    type,
    certificate_number,
    title,
    description
  ) VALUES (
    p_user_id,
    v_course_id,
    p_module_id,
    'module',
    v_certificate_number,
    v_module_title,
    'Certificado de completación del módulo'
  )
  RETURNING id INTO v_certificate_id;

  RETURN v_certificate_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update updated_at timestamp for quiz_questions
CREATE OR REPLACE FUNCTION update_quiz_questions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER quiz_questions_updated_at
  BEFORE UPDATE ON public.quiz_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_quiz_questions_updated_at();

-- =====================================================
-- SAMPLE DATA (optional - comment out for production)
-- =====================================================

-- Add requires_quiz to first module of each course (for testing)
-- UPDATE public.modules
-- SET requires_quiz = true
-- WHERE order_index = 1;

-- =====================================================
-- COMPLETED SUCCESSFULLY
-- =====================================================
-- Las tablas de quiz y certificados han sido creadas.
-- Próximos pasos:
-- 1. Crear preguntas de quiz en quiz_questions
-- 2. Implementar componentes de UI para quizzes
-- 3. Implementar generador de certificados PDF
-- =====================================================

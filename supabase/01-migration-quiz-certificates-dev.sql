-- =====================================================
-- NODO360 PLATFORM - QUIZ & CERTIFICATES MIGRATION
-- =====================================================
-- Versión para DESARROLLO con DROP TABLE IF EXISTS
-- ⚠️ NO USAR EN PRODUCCIÓN - Borra datos existentes
--
-- Esta versión permite recrear las tablas durante desarrollo
-- Para producción, usar migration-quiz-certificates.sql
-- =====================================================

-- =====================================================
-- DROP EXISTING OBJECTS (DEVELOPMENT ONLY)
-- =====================================================

-- Drop functions first (they depend on tables)
DROP FUNCTION IF EXISTS issue_module_certificate(UUID, UUID, UUID);
DROP FUNCTION IF EXISTS generate_certificate_number();
DROP FUNCTION IF EXISTS is_module_accessible(UUID, UUID);
DROP FUNCTION IF EXISTS has_passed_module_quiz(UUID, UUID);
DROP FUNCTION IF EXISTS get_best_quiz_attempt(UUID, UUID);
DROP FUNCTION IF EXISTS update_quiz_questions_updated_at();

-- Drop tables (in reverse order of dependencies)
DROP TABLE IF EXISTS public.certificates CASCADE;
DROP TABLE IF EXISTS public.quiz_attempts CASCADE;
DROP TABLE IF EXISTS public.quiz_questions CASCADE;

-- Drop custom types
DROP TYPE IF EXISTS certificate_type CASCADE;

-- Remove column from modules (if exists)
ALTER TABLE public.modules DROP COLUMN IF EXISTS requires_quiz;

-- =====================================================
-- CUSTOM TYPES
-- =====================================================

CREATE TYPE certificate_type AS ENUM ('module', 'course');

-- =====================================================
-- TABLE: quiz_questions
-- =====================================================

CREATE TABLE public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,

  -- Question content
  question TEXT NOT NULL,
  explanation TEXT, -- Shown after answering

  -- Options (JSONB array: ["Option A", "Option B", "Option C", "Option D"])
  options JSONB NOT NULL,

  -- Correct answer (0-based index: 0, 1, 2, or 3)
  correct_answer INTEGER NOT NULL,

  -- Metadata
  order_index INTEGER NOT NULL, -- Order within quiz
  difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  points INTEGER DEFAULT 1,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT valid_correct_answer CHECK (correct_answer >= 0 AND correct_answer <= 3),
  CONSTRAINT valid_options CHECK (jsonb_array_length(options) >= 2 AND jsonb_array_length(options) <= 4),
  CONSTRAINT unique_question_order UNIQUE (module_id, order_index)
);

-- Indexes
CREATE INDEX idx_quiz_questions_module ON public.quiz_questions(module_id);
CREATE INDEX idx_quiz_questions_order ON public.quiz_questions(module_id, order_index);
CREATE INDEX idx_quiz_questions_difficulty ON public.quiz_questions(difficulty);

-- Comments
COMMENT ON TABLE public.quiz_questions IS 'Quiz questions for module assessments';
COMMENT ON COLUMN public.quiz_questions.options IS 'JSON array of 2-4 answer options';
COMMENT ON COLUMN public.quiz_questions.correct_answer IS 'Index (0-3) of the correct option';
COMMENT ON COLUMN public.quiz_questions.explanation IS 'Explanation shown after user answers';

-- =====================================================
-- TABLE: quiz_attempts
-- =====================================================

CREATE TABLE public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,

  -- Score data
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,

  -- Pass/fail
  passed BOOLEAN NOT NULL, -- true if score >= 70

  -- User answers (JSONB: [{ question_id, selected_answer, correct }, ...])
  answers JSONB NOT NULL,

  -- Time tracking
  time_spent_seconds INTEGER, -- Time taken in seconds

  -- Timestamps
  completed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT valid_correct_answers CHECK (correct_answers >= 0 AND correct_answers <= total_questions)
);

-- Indexes
CREATE INDEX idx_quiz_attempts_user ON public.quiz_attempts(user_id);
CREATE INDEX idx_quiz_attempts_module ON public.quiz_attempts(module_id);
CREATE INDEX idx_quiz_attempts_user_module ON public.quiz_attempts(user_id, module_id);
CREATE INDEX idx_quiz_attempts_completed ON public.quiz_attempts(completed_at DESC);
CREATE INDEX idx_quiz_attempts_passed ON public.quiz_attempts(passed) WHERE passed = true;

-- Comments
COMMENT ON TABLE public.quiz_attempts IS 'User quiz attempts and scores';
COMMENT ON COLUMN public.quiz_attempts.score IS 'Percentage score (0-100)';
COMMENT ON COLUMN public.quiz_attempts.passed IS 'True if score >= 70%';
COMMENT ON COLUMN public.quiz_attempts.answers IS 'JSON array of user answers with correctness';

-- =====================================================
-- TABLE: certificates
-- =====================================================

CREATE TABLE public.certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  module_id UUID REFERENCES public.modules(id) ON DELETE SET NULL, -- NULL for course certificates

  -- Certificate metadata
  type certificate_type NOT NULL,
  certificate_number TEXT UNIQUE NOT NULL, -- e.g., "NODO360-2024-001234"

  -- Content
  title TEXT NOT NULL,
  description TEXT,

  -- Storage
  certificate_url TEXT, -- URL to PDF in Supabase Storage
  certificate_hash TEXT, -- SHA-256 for verification

  -- NFT data (optional, for premium)
  nft_token_id TEXT,
  nft_contract_address TEXT,
  nft_chain TEXT,
  nft_tx_hash TEXT,

  -- Verification
  verification_url TEXT, -- Public verification URL
  qr_code_url TEXT, -- QR code image

  -- Timestamps
  issued_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ, -- NULL = never expires
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT certificate_type_check CHECK (
    (type = 'module' AND module_id IS NOT NULL) OR
    (type = 'course' AND module_id IS NULL)
  ),
  CONSTRAINT unique_user_module_certificate UNIQUE (user_id, module_id)
);

-- Indexes
CREATE INDEX idx_certificates_user ON public.certificates(user_id);
CREATE INDEX idx_certificates_course ON public.certificates(course_id);
CREATE INDEX idx_certificates_module ON public.certificates(module_id);
CREATE INDEX idx_certificates_number ON public.certificates(certificate_number);
CREATE INDEX idx_certificates_issued ON public.certificates(issued_at DESC);
CREATE INDEX idx_certificates_type ON public.certificates(type);
CREATE INDEX idx_certificates_nft ON public.certificates(nft_token_id) WHERE nft_token_id IS NOT NULL;

-- Unicidad para certificados de curso (module_id IS NULL)
CREATE UNIQUE INDEX unique_user_course_certificate
  ON public.certificates(user_id, course_id)
  WHERE module_id IS NULL;

-- Comments
COMMENT ON TABLE public.certificates IS 'Certificates for course and module completion';
COMMENT ON COLUMN public.certificates.type IS 'Either module or course certificate';
COMMENT ON COLUMN public.certificates.certificate_number IS 'Unique verification number';
COMMENT ON COLUMN public.certificates.module_id IS 'NULL for course certificates';

-- =====================================================
-- ALTER TABLE: modules
-- =====================================================

ALTER TABLE public.modules
ADD COLUMN IF NOT EXISTS requires_quiz BOOLEAN DEFAULT false NOT NULL;

CREATE INDEX IF NOT EXISTS idx_modules_requires_quiz
ON public.modules(requires_quiz) WHERE requires_quiz = true;

COMMENT ON COLUMN public.modules.requires_quiz IS 'Whether this module requires passing a quiz to unlock next module';

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- quiz_questions
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view quiz questions"
  ON public.quiz_questions FOR SELECT
  USING (true);

CREATE POLICY "Instructors can insert quiz questions"
  ON public.quiz_questions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.modules m
      JOIN public.courses c ON m.course_id = c.id
      WHERE m.id = module_id AND c.instructor_id = auth.uid()
    )
  );

CREATE POLICY "Instructors can update quiz questions"
  ON public.quiz_questions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.modules m
      JOIN public.courses c ON m.course_id = c.id
      WHERE m.id = module_id AND c.instructor_id = auth.uid()
    )
  );

CREATE POLICY "Instructors can delete quiz questions"
  ON public.quiz_questions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.modules m
      JOIN public.courses c ON m.course_id = c.id
      WHERE m.id = module_id AND c.instructor_id = auth.uid()
    )
  );

-- quiz_attempts
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quiz attempts"
  ON public.quiz_attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz attempts"
  ON public.quiz_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Instructors can view attempts for their courses"
  ON public.quiz_attempts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.modules m
      JOIN public.courses c ON m.course_id = c.id
      WHERE m.id = module_id AND c.instructor_id = auth.uid()
    )
  );

-- certificates
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own certificates"
  ON public.certificates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Certificates are publicly verifiable"
  ON public.certificates FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert own certificates"
  ON public.certificates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Get best quiz attempt for a module
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

-- Check if user has passed module quiz
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

-- Check if module is accessible
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
  SELECT m.order_index, m.course_id, c.is_free
  INTO v_module_order, v_course_id, v_is_free
  FROM public.modules m
  JOIN public.courses c ON m.course_id = c.id
  WHERE m.id = p_module_id;

  IF v_module_order = 1 THEN
    RETURN true;
  END IF;

  IF v_is_free THEN
    RETURN false;
  END IF;

  SELECT id, requires_quiz INTO v_previous_module_id, v_previous_requires_quiz
  FROM public.modules
  WHERE course_id = v_course_id AND order_index = v_module_order - 1;

  IF NOT v_previous_requires_quiz THEN
    RETURN true;
  END IF;

  v_passed_previous := has_passed_module_quiz(p_user_id, v_previous_module_id);

  RETURN v_passed_previous;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Generate unique certificate number
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

-- Issue module certificate after passing quiz
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
  SELECT passed INTO v_passed
  FROM public.quiz_attempts
  WHERE id = p_quiz_attempt_id AND user_id = p_user_id AND module_id = p_module_id;

  IF NOT v_passed THEN
    RAISE EXCEPTION 'Cannot issue certificate: quiz not passed';
  END IF;

  SELECT id INTO v_certificate_id
  FROM public.certificates
  WHERE user_id = p_user_id AND module_id = p_module_id;

  IF v_certificate_id IS NOT NULL THEN
    RETURN v_certificate_id;
  END IF;

  SELECT m.course_id, m.title
  INTO v_course_id, v_module_title
  FROM public.modules m
  WHERE m.id = p_module_id;

  v_certificate_number := generate_certificate_number();

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
-- VERIFICATION
-- =====================================================

-- Verify tables were created
DO $$
BEGIN
  ASSERT (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quiz_questions') = 1,
    'quiz_questions table not created';
  ASSERT (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quiz_attempts') = 1,
    'quiz_attempts table not created';
  ASSERT (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'certificates') = 1,
    'certificates table not created';

  RAISE NOTICE '✅ All tables created successfully';
END $$;

-- =====================================================
-- COMPLETED
-- =====================================================
-- Migration completed successfully!
-- Next: Run 02-seed-quiz-data.sql to insert sample data
-- =====================================================

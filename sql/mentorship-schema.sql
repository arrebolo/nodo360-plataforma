-- =============================================
-- SISTEMA DE MENTORÍA NODO360
-- Fecha: 2025-11-30
-- =============================================

-- =============================================
-- TIPOS ENUM
-- =============================================
DO $$ BEGIN
  CREATE TYPE educator_type AS ENUM ('instructor', 'mentor');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE educator_status AS ENUM ('pending', 'active', 'inactive', 'suspended');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE session_type AS ENUM ('videocall', 'chat', 'task_review');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE session_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_type AS ENUM ('free', 'credits', 'premium');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================
-- TABLA: educators (instructores y mentores)
-- =============================================
CREATE TABLE IF NOT EXISTS public.educators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  type educator_type NOT NULL DEFAULT 'instructor',
  status educator_status NOT NULL DEFAULT 'pending',

  display_name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  bio TEXT,
  tagline TEXT,
  avatar_url TEXT,
  banner_url TEXT,

  hourly_rate_credits INTEGER DEFAULT 0,
  offers_free_intro BOOLEAN DEFAULT true,
  free_intro_minutes INTEGER DEFAULT 10,

  rating_avg DECIMAL(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  total_students INTEGER DEFAULT 0,

  community_score INTEGER DEFAULT 0,
  community_contributions INTEGER DEFAULT 0,

  verified_at TIMESTAMPTZ,
  exam_passed_at TIMESTAMPTZ,
  promoted_to_mentor_at TIMESTAMPTZ,
  demoted_from_mentor_at TIMESTAMPTZ,

  is_available BOOLEAN DEFAULT true,
  last_active_at TIMESTAMPTZ DEFAULT now(),

  social_links JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(user_id)
);

-- =============================================
-- TABLA: specialties (especialidades)
-- =============================================
CREATE TABLE IF NOT EXISTS public.specialties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- TABLA: educator_specialties
-- =============================================
CREATE TABLE IF NOT EXISTS public.educator_specialties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  educator_id UUID NOT NULL REFERENCES public.educators(id) ON DELETE CASCADE,
  specialty_id UUID NOT NULL REFERENCES public.specialties(id) ON DELETE CASCADE,

  exam_score INTEGER,
  exam_passed BOOLEAN DEFAULT false,
  exam_taken_at TIMESTAMPTZ,

  level TEXT DEFAULT 'intermediate',

  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(educator_id, specialty_id)
);

-- =============================================
-- TABLA: educator_exams
-- =============================================
CREATE TABLE IF NOT EXISTS public.educator_exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  specialty_id UUID NOT NULL REFERENCES public.specialties(id),

  score INTEGER NOT NULL,
  max_score INTEGER NOT NULL DEFAULT 100,
  passed BOOLEAN NOT NULL,
  passing_score INTEGER NOT NULL DEFAULT 70,

  answers JSONB,

  taken_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);

-- =============================================
-- TABLA: educator_achievements
-- =============================================
CREATE TABLE IF NOT EXISTS public.educator_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  educator_id UUID NOT NULL REFERENCES public.educators(id) ON DELETE CASCADE,

  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,

  community_points INTEGER DEFAULT 0,

  awarded_at TIMESTAMPTZ DEFAULT now(),
  awarded_by UUID REFERENCES public.users(id)
);

-- =============================================
-- TABLA: educator_availability
-- =============================================
CREATE TABLE IF NOT EXISTS public.educator_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  educator_id UUID NOT NULL REFERENCES public.educators(id) ON DELETE CASCADE,

  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  timezone TEXT DEFAULT 'Europe/Madrid',

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(educator_id, day_of_week, start_time)
);

-- =============================================
-- TABLA: mentorship_sessions
-- =============================================
CREATE TABLE IF NOT EXISTS public.mentorship_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  educator_id UUID NOT NULL REFERENCES public.educators(id),
  student_id UUID NOT NULL REFERENCES public.users(id),

  session_type session_type NOT NULL,
  status session_status NOT NULL DEFAULT 'pending',

  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,

  payment_type payment_type NOT NULL DEFAULT 'credits',
  price_credits INTEGER DEFAULT 0,
  is_free_intro BOOLEAN DEFAULT false,

  title TEXT,
  description TEXT,
  specialty_id UUID REFERENCES public.specialties(id),

  meeting_url TEXT,
  meeting_id TEXT,

  educator_notes TEXT,

  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES public.users(id),
  cancellation_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- TABLA: session_reviews
-- =============================================
CREATE TABLE IF NOT EXISTS public.session_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.mentorship_sessions(id) ON DELETE CASCADE,

  reviewer_id UUID NOT NULL REFERENCES public.users(id),

  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,

  is_featured BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(session_id, reviewer_id)
);

-- =============================================
-- TABLA: session_notes
-- =============================================
CREATE TABLE IF NOT EXISTS public.session_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.mentorship_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id),

  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',

  is_private BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- TABLA: user_credits
-- =============================================
CREATE TABLE IF NOT EXISTS public.user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  balance INTEGER NOT NULL DEFAULT 0,
  lifetime_earned INTEGER NOT NULL DEFAULT 0,
  lifetime_spent INTEGER NOT NULL DEFAULT 0,

  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(user_id)
);

-- =============================================
-- TABLA: credit_transactions
-- =============================================
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id),

  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,

  type TEXT NOT NULL,
  description TEXT,

  session_id UUID REFERENCES public.mentorship_sessions(id),

  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- TABLA: educator_promotions (historial)
-- =============================================
CREATE TABLE IF NOT EXISTS public.educator_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  educator_id UUID NOT NULL REFERENCES public.educators(id),

  from_type educator_type NOT NULL,
  to_type educator_type NOT NULL,

  reason TEXT NOT NULL,
  promoted_by UUID REFERENCES public.users(id),

  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- ÍNDICES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_educators_type ON public.educators(type);
CREATE INDEX IF NOT EXISTS idx_educators_status ON public.educators(status);
CREATE INDEX IF NOT EXISTS idx_educators_user ON public.educators(user_id);
CREATE INDEX IF NOT EXISTS idx_educators_slug ON public.educators(slug);
CREATE INDEX IF NOT EXISTS idx_educators_available ON public.educators(is_available) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_sessions_educator ON public.mentorship_sessions(educator_id);
CREATE INDEX IF NOT EXISTS idx_sessions_student ON public.mentorship_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON public.mentorship_sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_scheduled ON public.mentorship_sessions(scheduled_at);

CREATE INDEX IF NOT EXISTS idx_reviews_session ON public.session_reviews(session_id);
CREATE INDEX IF NOT EXISTS idx_credits_user ON public.user_credits(user_id);

-- =============================================
-- RLS POLICIES
-- =============================================
ALTER TABLE public.educators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.educator_specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.educator_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentorship_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- Educators: público para ver activos
CREATE POLICY "Anyone can view active educators" ON public.educators
  FOR SELECT USING (status = 'active');

CREATE POLICY "Users can update own educator profile" ON public.educators
  FOR UPDATE USING (auth.uid() = user_id);

-- Specialties: público
CREATE POLICY "Anyone can view specialties" ON public.specialties
  FOR SELECT USING (is_active = true);

-- Educator specialties: público para ver
CREATE POLICY "Anyone can view educator specialties" ON public.educator_specialties
  FOR SELECT USING (true);

-- Availability: público para ver
CREATE POLICY "Anyone can view educator availability" ON public.educator_availability
  FOR SELECT USING (is_active = true);

CREATE POLICY "Educators can manage own availability" ON public.educator_availability
  FOR ALL USING (
    educator_id IN (SELECT id FROM public.educators WHERE user_id = auth.uid())
  );

-- Sessions: solo participantes
CREATE POLICY "Users can view own sessions as student" ON public.mentorship_sessions
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Educators can view own sessions" ON public.mentorship_sessions
  FOR SELECT USING (
    educator_id IN (SELECT id FROM public.educators WHERE user_id = auth.uid())
  );

CREATE POLICY "Students can create sessions" ON public.mentorship_sessions
  FOR INSERT WITH CHECK (auth.uid() = student_id);

-- Reviews: público para ver, autor para crear
CREATE POLICY "Anyone can view reviews" ON public.session_reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can create own reviews" ON public.session_reviews
  FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- Notes: solo el autor
CREATE POLICY "Users can manage own notes" ON public.session_notes
  FOR ALL USING (auth.uid() = user_id);

-- Credits: solo el usuario
CREATE POLICY "Users can view own credits" ON public.user_credits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own transactions" ON public.credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- =============================================
-- DATOS INICIALES: Especialidades
-- =============================================
INSERT INTO public.specialties (name, slug, description, icon, category, order_index) VALUES
  ('Bitcoin Fundamentals', 'bitcoin-fundamentals', 'Fundamentos de Bitcoin, protocolo y economía', '₿', 'bitcoin', 1),
  ('Trading & Análisis Técnico', 'trading-analisis', 'Estrategias de trading y análisis de mercados', '📊', 'trading', 2),
  ('DeFi & Finanzas Descentralizadas', 'defi', 'Protocolos DeFi, yield farming, liquidez', '🏦', 'defi', 3),
  ('Seguridad & Custodia', 'seguridad-custodia', 'Wallets, claves privadas, seguridad operativa', '🔐', 'security', 4),
  ('Desarrollo Blockchain', 'desarrollo-blockchain', 'Smart contracts, desarrollo Web3', '💻', 'development', 5),
  ('NFTs & Tokenización', 'nfts-tokenizacion', 'NFTs, tokenización de activos, metaverso', '🎨', 'nfts', 6),
  ('Minería & Nodos', 'mineria-nodos', 'Minería de Bitcoin, operación de nodos', '⛏️', 'mining', 7),
  ('Regulación & Fiscalidad', 'regulacion-fiscalidad', 'Marco legal, impuestos, compliance', '⚖️', 'legal', 8)
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- TRIGGER: updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_educators_updated_at ON public.educators;
CREATE TRIGGER update_educators_updated_at
  BEFORE UPDATE ON public.educators
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sessions_updated_at ON public.mentorship_sessions;
CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON public.mentorship_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notes_updated_at ON public.session_notes;
CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON public.session_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- FIN DEL SCHEMA DE MENTORÍA
-- =============================================

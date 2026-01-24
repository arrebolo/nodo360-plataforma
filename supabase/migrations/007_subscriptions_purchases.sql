-- =====================================================
-- MIGRACIÓN 007: SISTEMA DE SUSCRIPCIONES Y COMPRAS
-- =====================================================
-- Fecha: 2026-01-23
-- Descripción: Tablas para suscripciones premium, compras de cursos y revenue share
-- =====================================================

-- #####################################################
-- SECCIÓN 1: TABLA DE PRECIOS (histórico)
-- #####################################################

CREATE TABLE IF NOT EXISTS public.pricing_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Tipo de plan
  plan_type TEXT NOT NULL CHECK (plan_type IN ('monthly', 'annual', 'course')),

  -- Precio (en céntimos)
  price_cents INTEGER NOT NULL,

  -- Vigencia
  is_active BOOLEAN DEFAULT true,
  valid_from TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  valid_until TIMESTAMPTZ,

  -- Metadata
  name TEXT NOT NULL,
  description TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Insertar precios actuales
INSERT INTO public.pricing_plans (plan_type, price_cents, name, description) VALUES
('monthly', 2300, 'Premium Mensual', 'Acceso a todos los cursos premium por 1 mes'),
('annual', 23000, 'Premium Anual', 'Acceso a todos los cursos premium por 1 año (2 meses gratis)')
ON CONFLICT DO NOTHING;

-- #####################################################
-- SECCIÓN 2: TABLA DE SUSCRIPCIONES
-- #####################################################

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,

  -- Plan
  plan_type TEXT NOT NULL CHECK (plan_type IN ('monthly', 'annual')),
  pricing_plan_id UUID REFERENCES public.pricing_plans(id),

  -- Precio pagado (histórico)
  price_cents INTEGER NOT NULL,

  -- Estado
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'grace_period')),

  -- Fechas
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ NOT NULL,
  grace_period_ends_at TIMESTAMPTZ, -- 7 días después de ends_at
  cancelled_at TIMESTAMPTZ,

  -- Pago (para futuro)
  payment_provider TEXT,
  payment_id TEXT,

  -- Auto-renovación
  auto_renew BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_ends_at ON public.subscriptions(ends_at);
CREATE INDEX idx_subscriptions_grace ON public.subscriptions(grace_period_ends_at) WHERE status = 'grace_period';

-- #####################################################
-- SECCIÓN 3: TABLA DE COMPRAS DE CURSOS
-- #####################################################

CREATE TABLE IF NOT EXISTS public.course_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,

  -- Precio pagado (histórico)
  price_cents INTEGER NOT NULL,
  original_price_cents INTEGER, -- Precio original si hubo descuento

  -- Pago
  payment_provider TEXT,
  payment_id TEXT,

  -- Estado
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'refunded', 'failed')),

  -- Fechas
  purchased_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  refunded_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Un usuario solo puede comprar un curso una vez
  UNIQUE(user_id, course_id)
);

CREATE INDEX idx_course_purchases_user ON public.course_purchases(user_id);
CREATE INDEX idx_course_purchases_course ON public.course_purchases(course_id);
CREATE INDEX idx_course_purchases_status ON public.course_purchases(status);

-- #####################################################
-- SECCIÓN 4: TABLA DE TRANSACCIONES DE REVENUE
-- #####################################################

CREATE TABLE IF NOT EXISTS public.revenue_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Quién recibe el pago
  recipient_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,

  -- Origen del revenue
  source_type TEXT NOT NULL CHECK (source_type IN ('course_purchase', 'subscription_pool')),
  source_id UUID,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,

  -- Montos (en céntimos)
  gross_amount_cents INTEGER NOT NULL,
  platform_fee_cents INTEGER NOT NULL,
  net_amount_cents INTEGER NOT NULL,

  -- Porcentajes aplicados
  creator_percentage INTEGER NOT NULL,

  -- Estado de pago
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accumulated', 'paid', 'cancelled')),

  -- Co-autoría
  is_split BOOLEAN DEFAULT false,
  split_with_user_id UUID REFERENCES public.users(id),

  -- Período (para suscripciones)
  period_start DATE,
  period_end DATE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  paid_at TIMESTAMPTZ
);

CREATE INDEX idx_revenue_recipient ON public.revenue_transactions(recipient_id);
CREATE INDEX idx_revenue_status ON public.revenue_transactions(status);
CREATE INDEX idx_revenue_course ON public.revenue_transactions(course_id);
CREATE INDEX idx_revenue_period ON public.revenue_transactions(period_start, period_end);

-- #####################################################
-- SECCIÓN 5: TABLA DE PUNTOS DE SUSCRIPCIÓN (Revenue Share Modelo D)
-- #####################################################

CREATE TABLE IF NOT EXISTS public.subscription_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Período
  period_month DATE NOT NULL,

  -- Usuario que consumió
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,

  -- Curso/Instructor
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  instructor_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,

  -- Puntos
  lesson_points INTEGER DEFAULT 0,
  course_completion_points INTEGER DEFAULT 0,
  total_points INTEGER GENERATED ALWAYS AS (lesson_points + course_completion_points) STORED,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  UNIQUE(period_month, user_id, course_id)
);

CREATE INDEX idx_subscription_points_period ON public.subscription_points(period_month);
CREATE INDEX idx_subscription_points_instructor ON public.subscription_points(instructor_id);

-- #####################################################
-- SECCIÓN 6: FUNCIONES
-- #####################################################

-- Función para verificar si usuario tiene acceso premium
CREATE OR REPLACE FUNCTION public.has_premium_access(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = p_user_id
    AND status IN ('active', 'grace_period')
    AND (ends_at > NOW() OR grace_period_ends_at > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si usuario tiene acceso a un curso específico
CREATE OR REPLACE FUNCTION public.has_course_access(p_user_id UUID, p_course_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_free BOOLEAN;
BEGIN
  -- Verificar si el curso es gratis
  SELECT is_free INTO v_is_free FROM public.courses WHERE id = p_course_id;
  IF v_is_free THEN RETURN true; END IF;

  -- Verificar suscripción premium
  IF public.has_premium_access(p_user_id) THEN RETURN true; END IF;

  -- Verificar compra individual
  RETURN EXISTS (
    SELECT 1 FROM public.course_purchases
    WHERE user_id = p_user_id
    AND course_id = p_course_id
    AND status = 'completed'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para calcular grace_period_ends_at automáticamente
CREATE OR REPLACE FUNCTION public.set_grace_period()
RETURNS TRIGGER AS $$
BEGIN
  NEW.grace_period_ends_at := NEW.ends_at + INTERVAL '7 days';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- #####################################################
-- SECCIÓN 7: TRIGGERS
-- #####################################################

-- Trigger para auto-calcular grace_period
DROP TRIGGER IF EXISTS trigger_set_grace_period ON public.subscriptions;
CREATE TRIGGER trigger_set_grace_period
  BEFORE INSERT OR UPDATE OF ends_at ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_grace_period();

-- Triggers para updated_at
DROP TRIGGER IF EXISTS trigger_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER trigger_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_subscription_points_updated_at ON public.subscription_points;
CREATE TRIGGER trigger_subscription_points_updated_at
  BEFORE UPDATE ON public.subscription_points
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- #####################################################
-- SECCIÓN 8: POLÍTICAS RLS
-- #####################################################

-- === RLS: pricing_plans ===
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Pricing plans are viewable by everyone" ON public.pricing_plans;
CREATE POLICY "Pricing plans are viewable by everyone" ON public.pricing_plans FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Only admins can manage pricing" ON public.pricing_plans;
CREATE POLICY "Only admins can manage pricing" ON public.pricing_plans FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- === RLS: subscriptions ===
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can insert own subscriptions" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON public.subscriptions;
CREATE POLICY "Admins can manage all subscriptions" ON public.subscriptions FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- === RLS: course_purchases ===
ALTER TABLE public.course_purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own purchases" ON public.course_purchases;
CREATE POLICY "Users can view own purchases" ON public.course_purchases FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own purchases" ON public.course_purchases;
CREATE POLICY "Users can insert own purchases" ON public.course_purchases FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all purchases" ON public.course_purchases;
CREATE POLICY "Admins can manage all purchases" ON public.course_purchases FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- === RLS: revenue_transactions ===
ALTER TABLE public.revenue_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own revenue" ON public.revenue_transactions;
CREATE POLICY "Users can view own revenue" ON public.revenue_transactions FOR SELECT USING (auth.uid() = recipient_id);

DROP POLICY IF EXISTS "Admins can manage all revenue" ON public.revenue_transactions;
CREATE POLICY "Admins can manage all revenue" ON public.revenue_transactions FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- === RLS: subscription_points ===
ALTER TABLE public.subscription_points ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Instructors can view their points" ON public.subscription_points;
CREATE POLICY "Instructors can view their points" ON public.subscription_points FOR SELECT USING (auth.uid() = instructor_id);

DROP POLICY IF EXISTS "Admins can manage all points" ON public.subscription_points;
CREATE POLICY "Admins can manage all points" ON public.subscription_points FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- #####################################################
-- SECCIÓN 9: COMENTARIOS
-- #####################################################

COMMENT ON TABLE public.pricing_plans IS 'Histórico de precios de planes y cursos';
COMMENT ON TABLE public.subscriptions IS 'Suscripciones premium de usuarios';
COMMENT ON TABLE public.course_purchases IS 'Compras individuales de cursos';
COMMENT ON TABLE public.revenue_transactions IS 'Transacciones de revenue share para instructores';
COMMENT ON TABLE public.subscription_points IS 'Puntos mensuales para cálculo de revenue share (Modelo D)';

COMMENT ON FUNCTION public.has_premium_access IS 'Verifica si usuario tiene suscripción premium activa';
COMMENT ON FUNCTION public.has_course_access IS 'Verifica si usuario tiene acceso a un curso (gratis, premium, o comprado)';

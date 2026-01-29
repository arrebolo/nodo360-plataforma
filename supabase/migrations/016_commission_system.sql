-- =====================================================
-- MIGRACIÓN 016: SISTEMA DE COMISIONES PARA INSTRUCTORES Y MENTORES
-- =====================================================
-- Fecha: 2026-01-28
-- Descripción: Configuración de comisiones y funciones para procesar ventas
--
-- Modelo de negocio:
-- INSTRUCTOR:
--   - Venta directa: 35% instructor / 65% Nodo360
--   - Venta por referido: 40% instructor / 60% Nodo360
--
-- MENTOR:
--   - Venta directa: 45% mentor / 55% Nodo360
--   - Venta por referido: 50% mentor / 50% Nodo360
-- =====================================================

-- #####################################################
-- SECCIÓN 1: TABLA SYSTEM_SETTINGS (si no existe)
-- #####################################################

CREATE TABLE IF NOT EXISTS public.system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES public.users(id)
);

COMMENT ON TABLE public.system_settings IS 'Configuración global del sistema en formato key/value JSONB';

-- RLS para system_settings
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read system settings" ON public.system_settings;
CREATE POLICY "Anyone can read system settings" ON public.system_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only admins can modify system settings" ON public.system_settings;
CREATE POLICY "Only admins can modify system settings" ON public.system_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- #####################################################
-- SECCIÓN 2: CONFIGURACIÓN DE COMISIONES
-- #####################################################

INSERT INTO public.system_settings (key, value, description)
VALUES (
  'commission_rates',
  '{
    "instructor_base_percent": 35,
    "instructor_referral_percent": 40,
    "mentor_base_percent": 45,
    "mentor_referral_percent": 50,
    "referral_bonus_percent": 5,
    "minimum_payout_cents": 5000,
    "payout_schedule": "monthly"
  }'::jsonb,
  'Tasas de comisión: Instructor 35%/40% (base/referido), Mentor 45%/50% (base/referido)'
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    description = EXCLUDED.description,
    updated_at = NOW();

-- #####################################################
-- SECCIÓN 3: TABLA INSTRUCTOR_PAYOUTS (historial de pagos)
-- #####################################################

CREATE TABLE IF NOT EXISTS public.instructor_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Monto
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),

  -- Estado
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),

  -- Período cubierto
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Detalles de pago
  payment_method TEXT, -- stripe, paypal, bank_transfer
  payment_reference TEXT, -- ID de transacción externa

  -- Notas
  notes TEXT,
  failure_reason TEXT,

  -- Timestamps
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_instructor_payouts_instructor ON public.instructor_payouts(instructor_id);
CREATE INDEX IF NOT EXISTS idx_instructor_payouts_status ON public.instructor_payouts(status);
CREATE INDEX IF NOT EXISTS idx_instructor_payouts_period ON public.instructor_payouts(period_start, period_end);

-- RLS
ALTER TABLE public.instructor_payouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Instructors can view own payouts" ON public.instructor_payouts;
CREATE POLICY "Instructors can view own payouts" ON public.instructor_payouts
  FOR SELECT USING (instructor_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage all payouts" ON public.instructor_payouts;
CREATE POLICY "Admins can manage all payouts" ON public.instructor_payouts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

COMMENT ON TABLE public.instructor_payouts IS 'Historial de pagos realizados a instructores y mentores';

-- #####################################################
-- SECCIÓN 4: FUNCIÓN PARA PROCESAR COMISIÓN DE COMPRA
-- #####################################################

CREATE OR REPLACE FUNCTION public.process_course_purchase_commission(
  p_purchase_id UUID,
  p_referral_link_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_purchase course_purchases%ROWTYPE;
  v_course courses%ROWTYPE;
  v_seller_role TEXT;
  v_config JSONB;
  v_seller_percent INTEGER;
  v_platform_percent INTEGER;
  v_is_referral BOOLEAN := false;
  v_gross_cents INTEGER;
  v_seller_cents INTEGER;
  v_platform_cents INTEGER;
  v_transaction_id UUID;
BEGIN
  -- Obtener la compra
  SELECT * INTO v_purchase
  FROM course_purchases
  WHERE id = p_purchase_id AND status = 'completed';

  IF v_purchase.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'purchase_not_found_or_not_completed'
    );
  END IF;

  -- Verificar si ya existe transacción para esta compra
  IF EXISTS (
    SELECT 1 FROM revenue_transactions
    WHERE source_type = 'course_purchase' AND source_id = p_purchase_id
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'commission_already_processed'
    );
  END IF;

  -- Obtener el curso e instructor
  SELECT * INTO v_course
  FROM courses
  WHERE id = v_purchase.course_id;

  IF v_course.id IS NULL OR v_course.instructor_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'course_or_instructor_not_found'
    );
  END IF;

  -- Obtener el rol del vendedor (instructor o mentor)
  SELECT role INTO v_seller_role
  FROM users
  WHERE id = v_course.instructor_id;

  -- Default a instructor si no se encuentra
  IF v_seller_role IS NULL THEN
    v_seller_role := 'instructor';
  END IF;

  -- Obtener configuración de comisiones
  SELECT value INTO v_config
  FROM system_settings
  WHERE key = 'commission_rates';

  -- Verificar si hay referido válido del vendedor
  IF p_referral_link_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM referral_links
      WHERE id = p_referral_link_id
      AND instructor_id = v_course.instructor_id
    ) THEN
      v_is_referral := true;
    END IF;
  END IF;

  -- Determinar porcentaje según rol y si es referido
  IF v_seller_role = 'mentor' OR v_seller_role = 'admin' THEN
    -- Mentor o Admin: 45% base, 50% con referido
    IF v_is_referral THEN
      v_seller_percent := COALESCE((v_config->>'mentor_referral_percent')::INTEGER, 50);
    ELSE
      v_seller_percent := COALESCE((v_config->>'mentor_base_percent')::INTEGER, 45);
    END IF;
  ELSE
    -- Instructor: 35% base, 40% con referido
    IF v_is_referral THEN
      v_seller_percent := COALESCE((v_config->>'instructor_referral_percent')::INTEGER, 40);
    ELSE
      v_seller_percent := COALESCE((v_config->>'instructor_base_percent')::INTEGER, 35);
    END IF;
  END IF;

  v_platform_percent := 100 - v_seller_percent;

  -- Calcular montos
  v_gross_cents := v_purchase.price_cents;
  v_seller_cents := FLOOR(v_gross_cents * v_seller_percent / 100.0);
  v_platform_cents := v_gross_cents - v_seller_cents;

  -- Crear transacción de revenue
  INSERT INTO revenue_transactions (
    recipient_id,
    source_type,
    source_id,
    course_id,
    gross_amount_cents,
    platform_fee_cents,
    net_amount_cents,
    creator_percentage,
    status
  )
  VALUES (
    v_course.instructor_id,
    'course_purchase',
    p_purchase_id,
    v_course.id,
    v_gross_cents,
    v_platform_cents,
    v_seller_cents,
    v_seller_percent,
    'pending'
  )
  RETURNING id INTO v_transaction_id;

  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'instructor_id', v_course.instructor_id,
    'seller_role', v_seller_role,
    'gross_cents', v_gross_cents,
    'seller_cents', v_seller_cents,
    'platform_cents', v_platform_cents,
    'seller_percent', v_seller_percent,
    'is_referral', v_is_referral
  );
END;
$$;

COMMENT ON FUNCTION public.process_course_purchase_commission IS
  'Procesa la comisión de una compra según rol (instructor/mentor) y si es referido';

-- #####################################################
-- SECCIÓN 5: FUNCIÓN PARA OBTENER RESUMEN DE GANANCIAS
-- #####################################################

CREATE OR REPLACE FUNCTION public.get_instructor_earnings_summary(p_instructor_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  v_pending_cents INTEGER;
  v_accumulated_cents INTEGER;
  v_paid_cents INTEGER;
  v_total_sales INTEGER;
  v_this_month_cents INTEGER;
  v_last_month_cents INTEGER;
BEGIN
  -- Earnings pendientes (sin pagar)
  SELECT COALESCE(SUM(net_amount_cents), 0) INTO v_pending_cents
  FROM revenue_transactions
  WHERE recipient_id = p_instructor_id
  AND status IN ('pending', 'accumulated');

  -- Earnings acumulados
  SELECT COALESCE(SUM(net_amount_cents), 0) INTO v_accumulated_cents
  FROM revenue_transactions
  WHERE recipient_id = p_instructor_id
  AND status = 'accumulated';

  -- Total pagado
  SELECT COALESCE(SUM(net_amount_cents), 0) INTO v_paid_cents
  FROM revenue_transactions
  WHERE recipient_id = p_instructor_id
  AND status = 'paid';

  -- Total ventas
  SELECT COUNT(*) INTO v_total_sales
  FROM revenue_transactions
  WHERE recipient_id = p_instructor_id
  AND source_type = 'course_purchase';

  -- Este mes
  SELECT COALESCE(SUM(net_amount_cents), 0) INTO v_this_month_cents
  FROM revenue_transactions
  WHERE recipient_id = p_instructor_id
  AND created_at >= date_trunc('month', CURRENT_DATE);

  -- Mes pasado
  SELECT COALESCE(SUM(net_amount_cents), 0) INTO v_last_month_cents
  FROM revenue_transactions
  WHERE recipient_id = p_instructor_id
  AND created_at >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month')
  AND created_at < date_trunc('month', CURRENT_DATE);

  RETURN jsonb_build_object(
    'pending_cents', v_pending_cents,
    'accumulated_cents', v_accumulated_cents,
    'paid_cents', v_paid_cents,
    'total_earnings_cents', v_pending_cents + v_paid_cents,
    'total_sales', v_total_sales,
    'this_month_cents', v_this_month_cents,
    'last_month_cents', v_last_month_cents
  );
END;
$$;

COMMENT ON FUNCTION public.get_instructor_earnings_summary IS
  'Obtiene resumen de ganancias de un instructor/mentor';

-- #####################################################
-- SECCIÓN 6: VISTA DE TRANSACCIONES CON DETALLES
-- #####################################################

DROP VIEW IF EXISTS public.instructor_revenue_details;
CREATE OR REPLACE VIEW public.instructor_revenue_details AS
SELECT
  rt.id,
  rt.recipient_id AS instructor_id,
  u.full_name AS instructor_name,
  u.role AS instructor_role,
  rt.source_type,
  rt.course_id,
  c.title AS course_title,
  rt.gross_amount_cents,
  rt.platform_fee_cents,
  rt.net_amount_cents,
  rt.creator_percentage,
  rt.status,
  rt.created_at,
  rt.paid_at,
  -- Info de la compra
  cp.user_id AS buyer_id,
  buyer.full_name AS buyer_name,
  buyer.email AS buyer_email
FROM revenue_transactions rt
LEFT JOIN users u ON rt.recipient_id = u.id
LEFT JOIN courses c ON rt.course_id = c.id
LEFT JOIN course_purchases cp ON rt.source_id = cp.id AND rt.source_type = 'course_purchase'
LEFT JOIN users buyer ON cp.user_id = buyer.id;

COMMENT ON VIEW public.instructor_revenue_details IS
  'Vista detallada de transacciones de revenue con info de curso y comprador';

-- #####################################################
-- SECCIÓN 7: TRIGGER PARA AUTO-PROCESAR COMISIÓN
-- #####################################################

CREATE OR REPLACE FUNCTION public.trigger_process_purchase_commission()
RETURNS TRIGGER AS $$
DECLARE
  v_referral_link_id UUID := NULL;
  v_referral_cookie JSONB;
BEGIN
  -- Solo procesar si el status cambió a 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Intentar obtener referral_link_id de referral_attributions
    SELECT link_id INTO v_referral_link_id
    FROM referral_attributions
    WHERE user_id = NEW.user_id
    AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 1;

    -- Procesar comisión
    PERFORM process_course_purchase_commission(NEW.id, v_referral_link_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_auto_process_commission ON public.course_purchases;
CREATE TRIGGER trigger_auto_process_commission
  AFTER INSERT OR UPDATE OF status ON public.course_purchases
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_process_purchase_commission();

-- #####################################################
-- SECCIÓN 8: GRANTS
-- #####################################################

GRANT EXECUTE ON FUNCTION public.process_course_purchase_commission TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_instructor_earnings_summary TO authenticated;
GRANT SELECT ON public.instructor_revenue_details TO authenticated;

-- #####################################################
-- SECCIÓN 9: ÍNDICES ADICIONALES
-- #####################################################

CREATE INDEX IF NOT EXISTS idx_revenue_transactions_created_at
  ON public.revenue_transactions(created_at);

CREATE INDEX IF NOT EXISTS idx_revenue_transactions_recipient_status
  ON public.revenue_transactions(recipient_id, status);

-- #####################################################
-- COMENTARIOS FINALES
-- #####################################################

COMMENT ON SCHEMA public IS 'Sistema de comisiones v1.0 - Instructor 35/40%, Mentor 45/50%';

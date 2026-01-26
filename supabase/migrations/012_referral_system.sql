-- ============================================================================
-- SISTEMA DE ENLACES PROMOCIONALES PARA INSTRUCTORES
-- ============================================================================
-- Permite a instructores crear enlaces de referido, códigos promocionales,
-- y trackear conversiones para sus cursos.
-- ============================================================================

-- ============================================================================
-- TABLA A: referral_links - Enlaces de referido generados por instructores
-- ============================================================================
CREATE TABLE IF NOT EXISTS referral_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE, -- NULL = todos los cursos
  code VARCHAR(20) NOT NULL,
  custom_slug VARCHAR(50), -- Para URLs como /r/alberto/bitcoin
  utm_source VARCHAR(50) DEFAULT 'referral',
  utm_medium VARCHAR(50), -- youtube, twitter, podcast, etc.
  utm_campaign VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT referral_links_code_unique UNIQUE (code),
  CONSTRAINT referral_links_instructor_slug_unique UNIQUE (instructor_id, custom_slug),
  CONSTRAINT referral_links_code_format CHECK (code ~ '^[a-zA-Z0-9_-]+$'),
  CONSTRAINT referral_links_slug_format CHECK (custom_slug IS NULL OR custom_slug ~ '^[a-zA-Z0-9_-]+$')
);

-- Índices para búsquedas frecuentes
CREATE INDEX idx_referral_links_instructor ON referral_links(instructor_id);
CREATE INDEX idx_referral_links_code ON referral_links(code);
CREATE INDEX idx_referral_links_course ON referral_links(course_id) WHERE course_id IS NOT NULL;
CREATE INDEX idx_referral_links_active ON referral_links(is_active) WHERE is_active = true;

COMMENT ON TABLE referral_links IS 'Enlaces de referido creados por instructores para trackear conversiones';
COMMENT ON COLUMN referral_links.code IS 'Código único del enlace (ej: "alberto", "btc2026")';
COMMENT ON COLUMN referral_links.custom_slug IS 'Slug personalizado para URLs amigables (ej: "bitcoin" para /r/alberto/bitcoin)';
COMMENT ON COLUMN referral_links.course_id IS 'NULL significa que aplica a todos los cursos del instructor';

-- ============================================================================
-- TABLA B: referral_clicks - Tracking de visitas/clics
-- ============================================================================
CREATE TABLE IF NOT EXISTS referral_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID NOT NULL REFERENCES referral_links(id) ON DELETE CASCADE,
  visitor_ip_hash VARCHAR(64), -- Hash SHA256 de la IP para privacidad
  user_agent TEXT,
  referer_url TEXT,
  landing_page TEXT NOT NULL,
  country_code VARCHAR(2),
  device_type VARCHAR(20), -- desktop, mobile, tablet
  clicked_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para análisis
CREATE INDEX idx_referral_clicks_link ON referral_clicks(link_id);
CREATE INDEX idx_referral_clicks_date ON referral_clicks(clicked_at);
CREATE INDEX idx_referral_clicks_link_date ON referral_clicks(link_id, clicked_at DESC);

COMMENT ON TABLE referral_clicks IS 'Registro de cada clic en un enlace de referido';
COMMENT ON COLUMN referral_clicks.visitor_ip_hash IS 'Hash de la IP del visitante (no guardamos IP real por privacidad)';

-- ============================================================================
-- TABLA C: referral_conversions - Conversiones (inscripciones/compras)
-- ============================================================================
CREATE TABLE IF NOT EXISTS referral_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID NOT NULL REFERENCES referral_links(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  conversion_type VARCHAR(20) NOT NULL, -- 'enrollment' o 'purchase'
  revenue_cents INTEGER DEFAULT 0,
  instructor_commission_cents INTEGER DEFAULT 0,
  commission_rate DECIMAL(5,4) DEFAULT 0.30, -- 30% por defecto
  attribution_window_hours INTEGER DEFAULT 168, -- 7 días por defecto
  click_id UUID REFERENCES referral_clicks(id), -- Clic que originó la conversión
  converted_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT referral_conversions_unique UNIQUE (link_id, user_id, course_id),
  CONSTRAINT referral_conversions_type_check CHECK (conversion_type IN ('enrollment', 'purchase')),
  CONSTRAINT referral_conversions_revenue_positive CHECK (revenue_cents >= 0),
  CONSTRAINT referral_conversions_commission_positive CHECK (instructor_commission_cents >= 0)
);

-- Índices para reportes
CREATE INDEX idx_referral_conversions_link ON referral_conversions(link_id);
CREATE INDEX idx_referral_conversions_user ON referral_conversions(user_id);
CREATE INDEX idx_referral_conversions_course ON referral_conversions(course_id);
CREATE INDEX idx_referral_conversions_date ON referral_conversions(converted_at);
CREATE INDEX idx_referral_conversions_instructor ON referral_conversions(link_id, converted_at DESC);

COMMENT ON TABLE referral_conversions IS 'Conversiones atribuidas a enlaces de referido';
COMMENT ON COLUMN referral_conversions.commission_rate IS 'Porcentaje de comisión para el instructor (0.30 = 30%)';
COMMENT ON COLUMN referral_conversions.attribution_window_hours IS 'Ventana de atribución usada para esta conversión';

-- ============================================================================
-- TABLA D: promo_codes - Códigos de descuento
-- ============================================================================
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code VARCHAR(20) NOT NULL,
  discount_type VARCHAR(10) NOT NULL, -- 'percent' o 'fixed'
  discount_value INTEGER NOT NULL, -- 20 para 20%, o 500 para 5.00€
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE, -- NULL = todos los cursos
  max_uses INTEGER, -- NULL = ilimitado
  current_uses INTEGER DEFAULT 0,
  min_purchase_cents INTEGER DEFAULT 0,
  max_discount_cents INTEGER, -- Límite máximo de descuento (para porcentajes)
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT promo_codes_code_unique UNIQUE (code),
  CONSTRAINT promo_codes_code_format CHECK (code ~ '^[A-Z0-9_-]+$'),
  CONSTRAINT promo_codes_type_check CHECK (discount_type IN ('percent', 'fixed')),
  CONSTRAINT promo_codes_value_positive CHECK (discount_value > 0),
  CONSTRAINT promo_codes_percent_max CHECK (discount_type != 'percent' OR discount_value <= 100),
  CONSTRAINT promo_codes_uses_valid CHECK (current_uses >= 0 AND (max_uses IS NULL OR current_uses <= max_uses))
);

-- Índices
CREATE INDEX idx_promo_codes_instructor ON promo_codes(instructor_id);
CREATE INDEX idx_promo_codes_code ON promo_codes(code);
CREATE INDEX idx_promo_codes_course ON promo_codes(course_id) WHERE course_id IS NOT NULL;
CREATE INDEX idx_promo_codes_active ON promo_codes(is_active, starts_at, expires_at) WHERE is_active = true;

COMMENT ON TABLE promo_codes IS 'Códigos de descuento creados por instructores';
COMMENT ON COLUMN promo_codes.discount_type IS 'percent = porcentaje, fixed = cantidad fija en céntimos';
COMMENT ON COLUMN promo_codes.discount_value IS 'Valor del descuento (20 para 20% o 500 para 5.00€)';
COMMENT ON COLUMN promo_codes.max_discount_cents IS 'Límite máximo de descuento para códigos de porcentaje';

-- ============================================================================
-- TABLA E: promo_code_uses - Registro de usos de códigos
-- ============================================================================
CREATE TABLE IF NOT EXISTS promo_code_uses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id UUID NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  original_price_cents INTEGER NOT NULL,
  discount_applied_cents INTEGER NOT NULL,
  final_price_cents INTEGER NOT NULL,
  used_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT promo_code_uses_unique UNIQUE (promo_code_id, user_id, course_id),
  CONSTRAINT promo_code_uses_prices_valid CHECK (
    original_price_cents >= 0 AND
    discount_applied_cents >= 0 AND
    final_price_cents >= 0 AND
    final_price_cents = original_price_cents - discount_applied_cents
  )
);

-- Índices
CREATE INDEX idx_promo_code_uses_code ON promo_code_uses(promo_code_id);
CREATE INDEX idx_promo_code_uses_user ON promo_code_uses(user_id);
CREATE INDEX idx_promo_code_uses_date ON promo_code_uses(used_at);

COMMENT ON TABLE promo_code_uses IS 'Registro de cada uso de un código promocional';

-- ============================================================================
-- TABLA F: referral_attribution_cookies - Tracking de atribución
-- ============================================================================
-- Para mantener la atribución entre el clic y la conversión
CREATE TABLE IF NOT EXISTS referral_attributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(64) NOT NULL, -- Cookie de sesión o fingerprint
  link_id UUID NOT NULL REFERENCES referral_links(id) ON DELETE CASCADE,
  click_id UUID REFERENCES referral_clicks(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- Se llena cuando el usuario se autentica
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT referral_attributions_session_unique UNIQUE (session_id)
);

CREATE INDEX idx_referral_attributions_session ON referral_attributions(session_id);
CREATE INDEX idx_referral_attributions_user ON referral_attributions(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_referral_attributions_expires ON referral_attributions(expires_at);

COMMENT ON TABLE referral_attributions IS 'Mantiene la atribución de referido durante la ventana de conversión';

-- ============================================================================
-- FUNCIÓN 1: generate_referral_code() - Genera código único aleatorio
-- ============================================================================
CREATE OR REPLACE FUNCTION generate_referral_code(p_length INTEGER DEFAULT 8)
RETURNS VARCHAR(20)
LANGUAGE plpgsql
AS $$
DECLARE
  v_chars VARCHAR(36) := 'abcdefghijklmnopqrstuvwxyz0123456789';
  v_code VARCHAR(20) := '';
  v_attempts INTEGER := 0;
  v_max_attempts INTEGER := 10;
BEGIN
  LOOP
    v_code := '';
    FOR i IN 1..p_length LOOP
      v_code := v_code || substr(v_chars, floor(random() * length(v_chars) + 1)::INTEGER, 1);
    END LOOP;

    -- Verificar que no existe
    IF NOT EXISTS (SELECT 1 FROM referral_links WHERE code = v_code) THEN
      RETURN v_code;
    END IF;

    v_attempts := v_attempts + 1;
    IF v_attempts >= v_max_attempts THEN
      -- Si fallan muchos intentos, agregar timestamp
      RETURN v_code || '_' || extract(epoch from now())::INTEGER;
    END IF;
  END LOOP;
END;
$$;

COMMENT ON FUNCTION generate_referral_code IS 'Genera un código de referido único aleatorio';

-- ============================================================================
-- FUNCIÓN 2: track_referral_click() - Registra un clic en enlace de referido
-- ============================================================================
CREATE OR REPLACE FUNCTION track_referral_click(
  p_code VARCHAR(20),
  p_visitor_ip VARCHAR(45) DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_referer_url TEXT DEFAULT NULL,
  p_landing_page TEXT DEFAULT NULL,
  p_country_code VARCHAR(2) DEFAULT NULL,
  p_device_type VARCHAR(20) DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_link referral_links%ROWTYPE;
  v_click_id UUID;
  v_ip_hash VARCHAR(64);
BEGIN
  -- Buscar el enlace
  SELECT * INTO v_link
  FROM referral_links
  WHERE code = p_code
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW());

  IF v_link.id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'invalid_or_expired_link'
    );
  END IF;

  -- Hash de la IP para privacidad
  IF p_visitor_ip IS NOT NULL THEN
    v_ip_hash := encode(sha256(p_visitor_ip::bytea), 'hex');
  END IF;

  -- Registrar el clic
  INSERT INTO referral_clicks (
    link_id, visitor_ip_hash, user_agent, referer_url,
    landing_page, country_code, device_type
  )
  VALUES (
    v_link.id, v_ip_hash, p_user_agent, p_referer_url,
    COALESCE(p_landing_page, '/'), p_country_code, p_device_type
  )
  RETURNING id INTO v_click_id;

  RETURN json_build_object(
    'success', true,
    'click_id', v_click_id,
    'link_id', v_link.id,
    'instructor_id', v_link.instructor_id,
    'course_id', v_link.course_id,
    'utm_source', v_link.utm_source,
    'utm_medium', v_link.utm_medium,
    'utm_campaign', v_link.utm_campaign
  );
END;
$$;

COMMENT ON FUNCTION track_referral_click IS 'Registra un clic en un enlace de referido y retorna info para tracking';

-- ============================================================================
-- FUNCIÓN 3: track_referral_conversion() - Registra una conversión
-- ============================================================================
CREATE OR REPLACE FUNCTION track_referral_conversion(
  p_link_id UUID,
  p_user_id UUID,
  p_course_id UUID,
  p_conversion_type VARCHAR(20),
  p_revenue_cents INTEGER DEFAULT 0,
  p_click_id UUID DEFAULT NULL,
  p_commission_rate DECIMAL(5,4) DEFAULT 0.30
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_link referral_links%ROWTYPE;
  v_commission_cents INTEGER;
  v_conversion_id UUID;
BEGIN
  -- Verificar que el enlace existe y está activo
  SELECT * INTO v_link
  FROM referral_links
  WHERE id = p_link_id;

  IF v_link.id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'link_not_found'
    );
  END IF;

  -- Verificar que el curso corresponde (si el enlace es específico)
  IF v_link.course_id IS NOT NULL AND v_link.course_id != p_course_id THEN
    RETURN json_build_object(
      'success', false,
      'error', 'course_mismatch'
    );
  END IF;

  -- Calcular comisión
  v_commission_cents := FLOOR(p_revenue_cents * p_commission_rate);

  -- Insertar conversión (ignorar si ya existe)
  INSERT INTO referral_conversions (
    link_id, user_id, course_id, conversion_type,
    revenue_cents, instructor_commission_cents, commission_rate,
    click_id
  )
  VALUES (
    p_link_id, p_user_id, p_course_id, p_conversion_type,
    p_revenue_cents, v_commission_cents, p_commission_rate,
    p_click_id
  )
  ON CONFLICT (link_id, user_id, course_id) DO NOTHING
  RETURNING id INTO v_conversion_id;

  IF v_conversion_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'conversion_already_exists'
    );
  END IF;

  RETURN json_build_object(
    'success', true,
    'conversion_id', v_conversion_id,
    'commission_cents', v_commission_cents
  );
END;
$$;

COMMENT ON FUNCTION track_referral_conversion IS 'Registra una conversión atribuida a un enlace de referido';

-- ============================================================================
-- FUNCIÓN 4: validate_promo_code() - Valida código y retorna descuento
-- ============================================================================
CREATE OR REPLACE FUNCTION validate_promo_code(
  p_code VARCHAR(20),
  p_course_id UUID,
  p_user_id UUID,
  p_price_cents INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_promo promo_codes%ROWTYPE;
  v_discount_cents INTEGER;
  v_already_used BOOLEAN;
BEGIN
  -- Buscar el código
  SELECT * INTO v_promo
  FROM promo_codes
  WHERE UPPER(code) = UPPER(p_code)
    AND is_active = true
    AND starts_at <= NOW()
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (max_uses IS NULL OR current_uses < max_uses);

  IF v_promo.id IS NULL THEN
    RETURN json_build_object(
      'valid', false,
      'error', 'invalid_or_expired_code',
      'message', 'El código no es válido o ha expirado'
    );
  END IF;

  -- Verificar que aplica al curso
  IF v_promo.course_id IS NOT NULL AND v_promo.course_id != p_course_id THEN
    RETURN json_build_object(
      'valid', false,
      'error', 'course_not_applicable',
      'message', 'Este código no aplica para este curso'
    );
  END IF;

  -- Verificar mínimo de compra
  IF p_price_cents < v_promo.min_purchase_cents THEN
    RETURN json_build_object(
      'valid', false,
      'error', 'minimum_not_met',
      'message', 'El precio mínimo para este código es ' || (v_promo.min_purchase_cents / 100.0)::TEXT || '€'
    );
  END IF;

  -- Verificar si el usuario ya usó este código para este curso
  SELECT EXISTS (
    SELECT 1 FROM promo_code_uses
    WHERE promo_code_id = v_promo.id
      AND user_id = p_user_id
      AND course_id = p_course_id
  ) INTO v_already_used;

  IF v_already_used THEN
    RETURN json_build_object(
      'valid', false,
      'error', 'already_used',
      'message', 'Ya has usado este código para este curso'
    );
  END IF;

  -- Calcular descuento
  IF v_promo.discount_type = 'percent' THEN
    v_discount_cents := FLOOR(p_price_cents * v_promo.discount_value / 100.0);
    -- Aplicar límite máximo si existe
    IF v_promo.max_discount_cents IS NOT NULL AND v_discount_cents > v_promo.max_discount_cents THEN
      v_discount_cents := v_promo.max_discount_cents;
    END IF;
  ELSE
    v_discount_cents := v_promo.discount_value;
  END IF;

  -- No puede ser mayor que el precio
  IF v_discount_cents > p_price_cents THEN
    v_discount_cents := p_price_cents;
  END IF;

  RETURN json_build_object(
    'valid', true,
    'promo_code_id', v_promo.id,
    'discount_type', v_promo.discount_type,
    'discount_value', v_promo.discount_value,
    'discount_cents', v_discount_cents,
    'final_price_cents', p_price_cents - v_discount_cents,
    'message', CASE
      WHEN v_promo.discount_type = 'percent' THEN v_promo.discount_value || '% de descuento aplicado'
      ELSE (v_promo.discount_value / 100.0)::TEXT || '€ de descuento aplicado'
    END
  );
END;
$$;

COMMENT ON FUNCTION validate_promo_code IS 'Valida un código promocional y calcula el descuento aplicable';

-- ============================================================================
-- FUNCIÓN 5: apply_promo_code() - Aplica descuento y registra uso
-- ============================================================================
CREATE OR REPLACE FUNCTION apply_promo_code(
  p_code VARCHAR(20),
  p_user_id UUID,
  p_course_id UUID,
  p_original_price_cents INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_validation JSON;
  v_promo_id UUID;
  v_discount_cents INTEGER;
  v_final_price_cents INTEGER;
BEGIN
  -- Primero validar
  v_validation := validate_promo_code(p_code, p_course_id, p_user_id, p_original_price_cents);

  IF NOT (v_validation->>'valid')::BOOLEAN THEN
    RETURN v_validation;
  END IF;

  v_promo_id := (v_validation->>'promo_code_id')::UUID;
  v_discount_cents := (v_validation->>'discount_cents')::INTEGER;
  v_final_price_cents := (v_validation->>'final_price_cents')::INTEGER;

  -- Registrar uso
  INSERT INTO promo_code_uses (
    promo_code_id, user_id, course_id,
    original_price_cents, discount_applied_cents, final_price_cents
  )
  VALUES (
    v_promo_id, p_user_id, p_course_id,
    p_original_price_cents, v_discount_cents, v_final_price_cents
  );

  -- Incrementar contador de usos
  UPDATE promo_codes
  SET current_uses = current_uses + 1,
      updated_at = NOW()
  WHERE id = v_promo_id;

  RETURN json_build_object(
    'success', true,
    'promo_code_id', v_promo_id,
    'original_price_cents', p_original_price_cents,
    'discount_applied_cents', v_discount_cents,
    'final_price_cents', v_final_price_cents,
    'message', v_validation->>'message'
  );
END;
$$;

COMMENT ON FUNCTION apply_promo_code IS 'Aplica un código promocional, registra el uso y retorna el precio final';

-- ============================================================================
-- FUNCIÓN 6: get_or_create_referral_attribution() - Gestiona atribución
-- ============================================================================
CREATE OR REPLACE FUNCTION get_or_create_referral_attribution(
  p_session_id VARCHAR(64),
  p_link_id UUID DEFAULT NULL,
  p_click_id UUID DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_attribution_hours INTEGER DEFAULT 168 -- 7 días por defecto
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_attribution referral_attributions%ROWTYPE;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Buscar atribución existente
  SELECT * INTO v_attribution
  FROM referral_attributions
  WHERE session_id = p_session_id
    AND expires_at > NOW();

  -- Si existe y no ha expirado, actualizar user_id si se proporciona
  IF v_attribution.id IS NOT NULL THEN
    IF p_user_id IS NOT NULL AND v_attribution.user_id IS NULL THEN
      UPDATE referral_attributions
      SET user_id = p_user_id
      WHERE id = v_attribution.id;
    END IF;

    RETURN json_build_object(
      'success', true,
      'attribution_id', v_attribution.id,
      'link_id', v_attribution.link_id,
      'is_new', false
    );
  END IF;

  -- Si no existe y tenemos link_id, crear nueva
  IF p_link_id IS NOT NULL THEN
    v_expires_at := NOW() + (p_attribution_hours || ' hours')::INTERVAL;

    INSERT INTO referral_attributions (
      session_id, link_id, click_id, user_id, expires_at
    )
    VALUES (
      p_session_id, p_link_id, p_click_id, p_user_id, v_expires_at
    )
    ON CONFLICT (session_id) DO UPDATE
    SET link_id = EXCLUDED.link_id,
        click_id = EXCLUDED.click_id,
        user_id = COALESCE(EXCLUDED.user_id, referral_attributions.user_id),
        expires_at = EXCLUDED.expires_at
    RETURNING * INTO v_attribution;

    RETURN json_build_object(
      'success', true,
      'attribution_id', v_attribution.id,
      'link_id', v_attribution.link_id,
      'is_new', true
    );
  END IF;

  -- No hay atribución y no se proporcionó link_id
  RETURN json_build_object(
    'success', false,
    'error', 'no_attribution'
  );
END;
$$;

COMMENT ON FUNCTION get_or_create_referral_attribution IS 'Obtiene o crea una atribución de referido para una sesión';

-- ============================================================================
-- VISTA: instructor_referral_stats - Stats agregados por instructor
-- ============================================================================
CREATE OR REPLACE VIEW instructor_referral_stats AS
SELECT
  rl.instructor_id,
  u.full_name AS instructor_name,

  -- Totales de enlaces
  COUNT(DISTINCT rl.id) AS total_links,
  COUNT(DISTINCT rl.id) FILTER (WHERE rl.is_active) AS active_links,

  -- Totales de clics
  COUNT(rc.id) AS total_clicks,
  COUNT(rc.id) FILTER (WHERE rc.clicked_at >= NOW() - INTERVAL '30 days') AS clicks_last_30_days,
  COUNT(rc.id) FILTER (WHERE rc.clicked_at >= NOW() - INTERVAL '7 days') AS clicks_last_7_days,

  -- Totales de conversiones
  COUNT(DISTINCT rconv.id) AS total_conversions,
  COUNT(DISTINCT rconv.id) FILTER (WHERE rconv.conversion_type = 'enrollment') AS total_enrollments,
  COUNT(DISTINCT rconv.id) FILTER (WHERE rconv.conversion_type = 'purchase') AS total_purchases,
  COUNT(DISTINCT rconv.id) FILTER (WHERE rconv.converted_at >= NOW() - INTERVAL '30 days') AS conversions_last_30_days,

  -- Revenue y comisiones
  COALESCE(SUM(rconv.revenue_cents), 0) AS total_revenue_cents,
  COALESCE(SUM(rconv.instructor_commission_cents), 0) AS total_commission_cents,
  COALESCE(SUM(rconv.revenue_cents) FILTER (WHERE rconv.converted_at >= NOW() - INTERVAL '30 days'), 0) AS revenue_last_30_days_cents,
  COALESCE(SUM(rconv.instructor_commission_cents) FILTER (WHERE rconv.converted_at >= NOW() - INTERVAL '30 days'), 0) AS commission_last_30_days_cents,

  -- Tasa de conversión
  CASE
    WHEN COUNT(rc.id) > 0 THEN
      ROUND((COUNT(DISTINCT rconv.id)::NUMERIC / COUNT(DISTINCT rc.id)::NUMERIC) * 100, 2)
    ELSE 0
  END AS conversion_rate_percent,

  -- Códigos promo
  COUNT(DISTINCT pc.id) AS total_promo_codes,
  COUNT(DISTINCT pc.id) FILTER (WHERE pc.is_active) AS active_promo_codes,
  COALESCE(SUM(pc.current_uses), 0) AS total_promo_uses

FROM referral_links rl
LEFT JOIN users u ON rl.instructor_id = u.id
LEFT JOIN referral_clicks rc ON rl.id = rc.link_id
LEFT JOIN referral_conversions rconv ON rl.id = rconv.link_id
LEFT JOIN promo_codes pc ON rl.instructor_id = pc.instructor_id

GROUP BY rl.instructor_id, u.full_name;

COMMENT ON VIEW instructor_referral_stats IS 'Estadísticas agregadas de referidos por instructor';

-- ============================================================================
-- VISTA: referral_link_performance - Performance por enlace
-- ============================================================================
CREATE OR REPLACE VIEW referral_link_performance AS
SELECT
  rl.id AS link_id,
  rl.instructor_id,
  rl.code,
  rl.custom_slug,
  rl.course_id,
  c.title AS course_title,
  rl.utm_source,
  rl.utm_medium,
  rl.utm_campaign,
  rl.is_active,
  rl.created_at,

  -- Clics
  COUNT(DISTINCT rc.id) AS total_clicks,
  COUNT(DISTINCT rc.id) FILTER (WHERE rc.clicked_at >= NOW() - INTERVAL '7 days') AS clicks_7d,
  COUNT(DISTINCT rc.id) FILTER (WHERE rc.clicked_at >= NOW() - INTERVAL '30 days') AS clicks_30d,

  -- Conversiones
  COUNT(DISTINCT rconv.id) AS total_conversions,
  COUNT(DISTINCT rconv.id) FILTER (WHERE rconv.converted_at >= NOW() - INTERVAL '30 days') AS conversions_30d,

  -- Revenue
  COALESCE(SUM(rconv.revenue_cents), 0) AS total_revenue_cents,
  COALESCE(SUM(rconv.instructor_commission_cents), 0) AS total_commission_cents,

  -- Tasa de conversión
  CASE
    WHEN COUNT(DISTINCT rc.id) > 0 THEN
      ROUND((COUNT(DISTINCT rconv.id)::NUMERIC / COUNT(DISTINCT rc.id)::NUMERIC) * 100, 2)
    ELSE 0
  END AS conversion_rate

FROM referral_links rl
LEFT JOIN courses c ON rl.course_id = c.id
LEFT JOIN referral_clicks rc ON rl.id = rc.link_id
LEFT JOIN referral_conversions rconv ON rl.id = rconv.link_id

GROUP BY rl.id, c.title;

COMMENT ON VIEW referral_link_performance IS 'Métricas de performance por enlace de referido';

-- ============================================================================
-- RLS: Row Level Security Policies
-- ============================================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE referral_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_code_uses ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_attributions ENABLE ROW LEVEL SECURITY;

-- referral_links: Instructores ven solo sus enlaces
CREATE POLICY "Instructors can view own referral links"
  ON referral_links FOR SELECT
  TO authenticated
  USING (instructor_id = auth.uid());

CREATE POLICY "Instructors can create own referral links"
  ON referral_links FOR INSERT
  TO authenticated
  WITH CHECK (
    instructor_id = auth.uid() AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('instructor', 'mentor', 'admin'))
  );

CREATE POLICY "Instructors can update own referral links"
  ON referral_links FOR UPDATE
  TO authenticated
  USING (instructor_id = auth.uid())
  WITH CHECK (instructor_id = auth.uid());

CREATE POLICY "Instructors can delete own referral links"
  ON referral_links FOR DELETE
  TO authenticated
  USING (instructor_id = auth.uid());

-- Admins pueden ver todo
CREATE POLICY "Admins can manage all referral links"
  ON referral_links FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- referral_clicks: Solo lectura para el instructor del enlace
CREATE POLICY "Instructors can view clicks on own links"
  ON referral_clicks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM referral_links
      WHERE id = referral_clicks.link_id AND instructor_id = auth.uid()
    )
  );

-- Insert permitido via función (SECURITY DEFINER)
CREATE POLICY "System can insert clicks"
  ON referral_clicks FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- referral_conversions: Solo lectura para el instructor
CREATE POLICY "Instructors can view own conversions"
  ON referral_conversions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM referral_links
      WHERE id = referral_conversions.link_id AND instructor_id = auth.uid()
    )
  );

-- promo_codes: Instructores ven y gestionan sus códigos
CREATE POLICY "Instructors can view own promo codes"
  ON promo_codes FOR SELECT
  TO authenticated
  USING (instructor_id = auth.uid());

CREATE POLICY "Instructors can create own promo codes"
  ON promo_codes FOR INSERT
  TO authenticated
  WITH CHECK (
    instructor_id = auth.uid() AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('instructor', 'mentor', 'admin'))
  );

CREATE POLICY "Instructors can update own promo codes"
  ON promo_codes FOR UPDATE
  TO authenticated
  USING (instructor_id = auth.uid())
  WITH CHECK (instructor_id = auth.uid());

CREATE POLICY "Instructors can delete own promo codes"
  ON promo_codes FOR DELETE
  TO authenticated
  USING (instructor_id = auth.uid());

-- promo_code_uses: Usuarios ven sus propios usos, instructores ven usos de sus códigos
CREATE POLICY "Users can view own promo code uses"
  ON promo_code_uses FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Instructors can view uses of own promo codes"
  ON promo_code_uses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM promo_codes
      WHERE id = promo_code_uses.promo_code_id AND instructor_id = auth.uid()
    )
  );

-- referral_attributions: Solo sistema puede gestionar
CREATE POLICY "Users can view own attributions"
  ON referral_attributions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- TRIGGERS: Actualización automática de timestamps
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER referral_links_updated_at
  BEFORE UPDATE ON referral_links
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER promo_codes_updated_at
  BEFORE UPDATE ON promo_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- TRIGGER: Limpiar atribuciones expiradas (cada hora via pg_cron o manualmente)
-- ============================================================================
CREATE OR REPLACE FUNCTION cleanup_expired_attributions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM referral_attributions
  WHERE expires_at < NOW();

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

COMMENT ON FUNCTION cleanup_expired_attributions IS 'Limpia atribuciones de referido expiradas';

-- ============================================================================
-- GRANTS: Permisos para funciones
-- ============================================================================
GRANT EXECUTE ON FUNCTION generate_referral_code TO authenticated;
GRANT EXECUTE ON FUNCTION track_referral_click TO authenticated, anon;
GRANT EXECUTE ON FUNCTION track_referral_conversion TO authenticated;
GRANT EXECUTE ON FUNCTION validate_promo_code TO authenticated, anon;
GRANT EXECUTE ON FUNCTION apply_promo_code TO authenticated;
GRANT EXECUTE ON FUNCTION get_or_create_referral_attribution TO authenticated, anon;
GRANT EXECUTE ON FUNCTION cleanup_expired_attributions TO authenticated;

-- ============================================================================
-- COMENTARIOS FINALES
-- ============================================================================
COMMENT ON SCHEMA public IS 'Sistema de referidos y códigos promocionales para instructores - v1.0';

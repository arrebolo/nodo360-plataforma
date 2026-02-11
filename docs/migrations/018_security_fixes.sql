-- ============================================
-- MIGRATION 018: Security Fixes
-- Fecha: 6 Febrero 2026
-- Descripción: Habilitar RLS en tablas sin protección
-- ============================================

-- 1. Habilitar RLS en course_final_quiz_attempts
ALTER TABLE public.course_final_quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Policy: usuarios solo ven sus propios intentos
CREATE POLICY "Users can view own quiz attempts"
ON public.course_final_quiz_attempts
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: usuarios pueden insertar sus propios intentos
CREATE POLICY "Users can insert own quiz attempts"
ON public.course_final_quiz_attempts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: usuarios pueden actualizar sus propios intentos
CREATE POLICY "Users can update own quiz attempts"
ON public.course_final_quiz_attempts
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: admins pueden ver todo (usando función existente is_admin)
CREATE POLICY "Admins can view all quiz attempts"
ON public.course_final_quiz_attempts
FOR ALL
USING (is_admin(auth.uid()));

-- 2. Documentación sobre las vistas SECURITY DEFINER
-- Las siguientes vistas usan SECURITY DEFINER intencionalmente:
-- - referral_link_performance: permite a instructores ver stats de sus referidos
-- - instructor_revenue_details: permite a instructores ver sus ingresos
-- - instructor_referral_stats: permite a instructores ver stats agregados
-- Estas vistas son seguras porque filtran por instructor_id internamente
-- y solo devuelven datos del instructor autenticado.

COMMENT ON VIEW public.referral_link_performance IS 'SECURITY DEFINER intencional: filtra por instructor autenticado';
COMMENT ON VIEW public.instructor_revenue_details IS 'SECURITY DEFINER intencional: filtra por instructor autenticado';
COMMENT ON VIEW public.instructor_referral_stats IS 'SECURITY DEFINER intencional: filtra por instructor autenticado';

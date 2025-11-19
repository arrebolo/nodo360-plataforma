-- ============================================================================
-- VERIFICACIÓN DE CURSOS - Premium vs Gratuitos
-- ============================================================================
-- Fecha: 2025-11-17
-- Propósito: Verificar qué cursos son premium y cuáles son gratuitos
-- ============================================================================

-- 1. Ver TODOS los cursos con su estado de premium
SELECT
  id,
  title,
  slug,
  is_premium,
  price,
  created_at,
  CASE
    WHEN is_premium = true THEN '💎 PREMIUM'
    ELSE '🎓 GRATIS'
  END as course_type
FROM courses
ORDER BY created_at DESC;

-- 2. Conteo de cursos por tipo
SELECT
  CASE
    WHEN is_premium = true THEN 'Premium'
    ELSE 'Gratis'
  END as tipo_curso,
  COUNT(*) as total
FROM courses
GROUP BY is_premium;

-- 3. Cursos con sus módulos y requisitos de quiz
SELECT
  c.title as curso,
  c.is_premium,
  m.title as modulo,
  m.order_index,
  m.requires_quiz,
  COUNT(l.id) as total_lecciones
FROM courses c
JOIN modules m ON m.course_id = c.id
LEFT JOIN lessons l ON l.module_id = m.id
GROUP BY c.id, c.title, c.is_premium, m.id, m.title, m.order_index, m.requires_quiz
ORDER BY c.title, m.order_index;

-- ============================================================================
-- SQL VERIFICATION QUERIES - MODULE LOCK & QUIZ SYSTEM
-- ============================================================================
-- Fecha: 2025-11-17
-- Propósito: Verificar el correcto funcionamiento del sistema de bloqueo
--            de módulos y progresión basada en quiz
-- ============================================================================

-- ============================================================================
-- 1. VERIFICAR ESTRUCTURA DE CURSOS Y MÓDULOS
-- ============================================================================

-- 1.1 Ver todos los cursos con su conteo de módulos
SELECT
  c.id,
  c.slug,
  c.title,
  c.is_premium,
  COUNT(m.id) as total_modules,
  COUNT(CASE WHEN m.requires_quiz = true THEN 1 END) as modules_with_quiz
FROM courses c
LEFT JOIN modules m ON m.course_id = c.id
GROUP BY c.id, c.slug, c.title, c.is_premium
ORDER BY c.title;

-- 1.2 Ver módulos de un curso específico con sus quizzes
-- REEMPLAZAR 'bitcoin-desde-cero' con el slug del curso que quieras verificar
SELECT
  m.id,
  m.slug,
  m.title,
  m.order_index,
  m.requires_quiz,
  COUNT(l.id) as total_lessons,
  COUNT(qq.id) as total_quiz_questions
FROM modules m
LEFT JOIN lessons l ON l.module_id = m.id
LEFT JOIN quiz_questions qq ON qq.module_id = m.id
WHERE m.course_id IN (SELECT id FROM courses WHERE slug = 'bitcoin-desde-cero')
GROUP BY m.id, m.slug, m.title, m.order_index, m.requires_quiz
ORDER BY m.order_index;

-- ============================================================================
-- 2. VERIFICAR PROGRESO DE LECCIONES
-- ============================================================================

-- 2.1 Ver progreso de un usuario específico en un curso
-- REEMPLAZAR con user_id real y course_slug
SELECT
  c.title as course_title,
  m.title as module_title,
  m.order_index as module_order,
  l.title as lesson_title,
  l.order_index as lesson_order,
  CASE
    WHEN up.completed_at IS NOT NULL THEN 'Completada ✅'
    ELSE 'Pendiente ⏸️'
  END as lesson_status,
  up.completed_at
FROM courses c
JOIN modules m ON m.course_id = c.id
JOIN lessons l ON l.module_id = m.id
LEFT JOIN user_progress up ON up.lesson_id = l.id
  AND up.user_id = 'USER_ID_AQUI'  -- ⚠️ REEMPLAZAR
WHERE c.slug = 'bitcoin-desde-cero'  -- ⚠️ REEMPLAZAR
ORDER BY m.order_index, l.order_index;

-- 2.2 Ver resumen de progreso por módulo para un usuario
SELECT
  m.id as module_id,
  m.title as module_title,
  m.order_index,
  m.requires_quiz,
  COUNT(l.id) as total_lessons,
  COUNT(up.id) as completed_lessons,
  ROUND(COUNT(up.id)::numeric / COUNT(l.id)::numeric * 100, 2) as progress_percentage,
  CASE
    WHEN COUNT(up.id) = COUNT(l.id) THEN 'Todas completadas ✅'
    WHEN COUNT(up.id) > 0 THEN 'En progreso 🔄'
    ELSE 'Sin empezar ⏸️'
  END as status
FROM modules m
JOIN lessons l ON l.module_id = m.id
LEFT JOIN user_progress up ON up.lesson_id = l.id
  AND up.user_id = 'USER_ID_AQUI'  -- ⚠️ REEMPLAZAR
WHERE m.course_id IN (SELECT id FROM courses WHERE slug = 'bitcoin-desde-cero')
GROUP BY m.id, m.title, m.order_index, m.requires_quiz
ORDER BY m.order_index;

-- ============================================================================
-- 3. VERIFICAR INTENTOS DE QUIZ
-- ============================================================================

-- 3.1 Ver todos los intentos de quiz de un usuario
SELECT
  c.title as course_title,
  m.title as module_title,
  m.order_index,
  qa.score,
  qa.total_questions,
  qa.correct_answers,
  qa.passed,
  qa.completed_at,
  CASE
    WHEN qa.passed = true THEN 'Aprobado ✅'
    ELSE 'No aprobado ❌'
  END as result,
  ROW_NUMBER() OVER (PARTITION BY qa.module_id ORDER BY qa.completed_at DESC) as attempt_number
FROM quiz_attempts qa
JOIN modules m ON m.id = qa.module_id
JOIN courses c ON c.id = m.course_id
WHERE qa.user_id = 'USER_ID_AQUI'  -- ⚠️ REEMPLAZAR
ORDER BY m.order_index, qa.completed_at DESC;

-- 3.2 Ver el mejor intento de cada módulo para un usuario
SELECT
  m.title as module_title,
  m.order_index,
  MAX(qa.score) as best_score,
  MAX(CASE WHEN qa.passed = true THEN 1 ELSE 0 END) as has_passed,
  COUNT(qa.id) as total_attempts,
  MAX(qa.completed_at) as last_attempt_date
FROM modules m
LEFT JOIN quiz_attempts qa ON qa.module_id = m.id
  AND qa.user_id = 'USER_ID_AQUI'  -- ⚠️ REEMPLAZAR
WHERE m.requires_quiz = true
  AND m.course_id IN (SELECT id FROM courses WHERE slug = 'bitcoin-desde-cero')
GROUP BY m.id, m.title, m.order_index
ORDER BY m.order_index;

-- ============================================================================
-- 4. VERIFICAR LÓGICA DE BLOQUEO DE MÓDULOS
-- ============================================================================

-- 4.1 Ver estado de desbloqueo de módulos para un usuario
-- Esta query simula la lógica de bloqueo de módulos
WITH module_status AS (
  SELECT
    m.id as module_id,
    m.title,
    m.order_index,
    m.requires_quiz,
    c.is_premium as course_is_premium,
    -- Conteo de lecciones completadas
    COUNT(l.id) as total_lessons,
    COUNT(up.id) as completed_lessons,
    CASE
      WHEN COUNT(up.id) = COUNT(l.id) AND COUNT(l.id) > 0
      THEN true
      ELSE false
    END as all_lessons_completed,
    -- Estado del quiz
    MAX(CASE WHEN qa.passed = true THEN 1 ELSE 0 END) = 1 as quiz_passed,
    MAX(qa.score) as best_quiz_score
  FROM modules m
  JOIN courses c ON c.id = m.course_id
  JOIN lessons l ON l.module_id = m.id
  LEFT JOIN user_progress up ON up.lesson_id = l.id
    AND up.user_id = 'USER_ID_AQUI'  -- ⚠️ REEMPLAZAR
  LEFT JOIN quiz_attempts qa ON qa.module_id = m.id
    AND qa.user_id = 'USER_ID_AQUI'  -- ⚠️ REEMPLAZAR
  WHERE c.slug = 'bitcoin-desde-cero'  -- ⚠️ REEMPLAZAR
  GROUP BY m.id, m.title, m.order_index, m.requires_quiz, c.is_premium
),
module_lock_status AS (
  SELECT
    ms.*,
    -- Obtener datos del módulo anterior
    LAG(ms.all_lessons_completed) OVER (ORDER BY ms.order_index) as prev_lessons_completed,
    LAG(ms.requires_quiz) OVER (ORDER BY ms.order_index) as prev_requires_quiz,
    LAG(ms.quiz_passed) OVER (ORDER BY ms.order_index) as prev_quiz_passed,
    -- Determinar si está desbloqueado
    CASE
      -- Módulo 1 siempre desbloqueado
      WHEN ms.order_index = 1 THEN true
      -- Para cursos gratuitos, solo módulo 1
      WHEN NOT ms.course_is_premium THEN false
      -- Para cursos premium, verificar módulo anterior
      WHEN LAG(ms.requires_quiz) OVER (ORDER BY ms.order_index) = true
           AND LAG(ms.quiz_passed) OVER (ORDER BY ms.order_index) = false
      THEN false
      WHEN LAG(ms.all_lessons_completed) OVER (ORDER BY ms.order_index) = false
      THEN false
      ELSE true
    END as is_unlocked
  FROM module_status ms
)
SELECT
  module_id,
  title,
  order_index,
  requires_quiz,
  course_is_premium,
  completed_lessons || '/' || total_lessons as lessons_progress,
  all_lessons_completed,
  CASE
    WHEN requires_quiz THEN
      COALESCE(best_quiz_score::text || '%', 'No intentado')
    ELSE 'No requiere quiz'
  END as quiz_score,
  quiz_passed,
  CASE
    WHEN order_index = 1 THEN 'Desbloqueado (Módulo 1) 🔓'
    WHEN NOT course_is_premium THEN 'Requiere Premium 💎'
    WHEN NOT is_unlocked THEN 'Bloqueado 🔒'
    WHEN all_lessons_completed AND requires_quiz AND quiz_passed THEN 'Completado ✅'
    WHEN all_lessons_completed AND NOT requires_quiz THEN 'Completado ✅'
    WHEN all_lessons_completed AND requires_quiz AND NOT quiz_passed THEN 'Quiz pendiente 📝'
    WHEN completed_lessons > 0 THEN 'En progreso 🔄'
    ELSE 'Desbloqueado 🔓'
  END as module_status
FROM module_lock_status
ORDER BY order_index;

-- ============================================================================
-- 5. VERIFICAR CERTIFICADOS
-- ============================================================================

-- 5.1 Ver certificados de un usuario
SELECT
  cert.id as certificate_id,
  c.title as course_title,
  m.title as module_title,
  cert.certificate_url,
  cert.issued_at,
  CASE
    WHEN cert.certificate_url IS NOT NULL THEN 'Generado ✅'
    ELSE 'Pendiente ⏸️'
  END as status
FROM certificates cert
JOIN modules m ON m.id = cert.module_id
JOIN courses c ON c.id = m.course_id
WHERE cert.user_id = 'USER_ID_AQUI'  -- ⚠️ REEMPLAZAR
ORDER BY cert.issued_at DESC;

-- ============================================================================
-- 6. QUERIES DE ADMINISTRACIÓN Y DEBUGGING
-- ============================================================================

-- 6.1 Ver usuarios con progreso en un curso
SELECT
  u.id,
  u.email,
  u.full_name,
  COUNT(DISTINCT up.lesson_id) as lessons_completed,
  COUNT(DISTINCT qa.module_id) as modules_with_quiz_attempts,
  MAX(up.completed_at) as last_activity
FROM users u
LEFT JOIN user_progress up ON up.user_id = u.id
LEFT JOIN quiz_attempts qa ON qa.user_id = u.id
WHERE up.lesson_id IN (
  SELECT l.id FROM lessons l
  JOIN modules m ON m.id = l.module_id
  JOIN courses c ON c.id = m.course_id
  WHERE c.slug = 'bitcoin-desde-cero'
)
GROUP BY u.id, u.email, u.full_name
ORDER BY last_activity DESC;

-- 6.2 Detectar inconsistencias: Usuarios con quiz aprobado pero sin lecciones completas
SELECT
  u.email,
  m.title as module_title,
  COUNT(l.id) as total_lessons,
  COUNT(up.id) as completed_lessons,
  qa.score as quiz_score,
  qa.passed as quiz_passed
FROM quiz_attempts qa
JOIN modules m ON m.id = qa.module_id
JOIN users u ON u.id = qa.user_id
JOIN lessons l ON l.module_id = m.id
LEFT JOIN user_progress up ON up.lesson_id = l.id AND up.user_id = qa.user_id
WHERE qa.passed = true
GROUP BY u.email, m.title, qa.score, qa.passed, m.id
HAVING COUNT(up.id) < COUNT(l.id)
ORDER BY u.email, m.title;

-- 6.3 Ver preguntas de quiz de un módulo específico
SELECT
  m.title as module_title,
  qq.question,
  qq.correct_answer,
  qq.order_index,
  array_length(qq.options, 1) as num_options
FROM quiz_questions qq
JOIN modules m ON m.id = qq.module_id
WHERE m.slug = 'introduccion-bitcoin'  -- ⚠️ REEMPLAZAR
ORDER BY qq.order_index;

-- ============================================================================
-- 7. QUERIES PARA TESTING
-- ============================================================================

-- 7.1 LIMPIAR progreso de un usuario específico (SOLO PARA TESTING)
-- ⚠️ CUIDADO: Esta query BORRA datos. Solo usar en desarrollo
-- DELETE FROM user_progress WHERE user_id = 'USER_ID_AQUI';
-- DELETE FROM quiz_attempts WHERE user_id = 'USER_ID_AQUI';
-- DELETE FROM certificates WHERE user_id = 'USER_ID_AQUI';

-- 7.2 Marcar todas las lecciones del módulo 1 como completadas (TESTING)
-- ⚠️ Solo usar en desarrollo
-- INSERT INTO user_progress (user_id, lesson_id, completed_at)
-- SELECT
--   'USER_ID_AQUI',
--   l.id,
--   NOW()
-- FROM lessons l
-- JOIN modules m ON m.id = l.module_id
-- WHERE m.order_index = 1
--   AND m.course_id IN (SELECT id FROM courses WHERE slug = 'bitcoin-desde-cero')
-- ON CONFLICT (user_id, lesson_id) DO NOTHING;

-- 7.3 Simular intento de quiz aprobado en módulo 1 (TESTING)
-- ⚠️ Solo usar en desarrollo
-- INSERT INTO quiz_attempts (
--   user_id,
--   module_id,
--   score,
--   total_questions,
--   correct_answers,
--   passed,
--   answers,
--   completed_at
-- )
-- SELECT
--   'USER_ID_AQUI',
--   m.id,
--   85,  -- Score de 85%
--   10,  -- 10 preguntas totales
--   8,   -- 8 correctas
--   true,
--   '[]'::jsonb,
--   NOW()
-- FROM modules m
-- WHERE m.order_index = 1
--   AND m.course_id IN (SELECT id FROM courses WHERE slug = 'bitcoin-desde-cero');

-- ============================================================================
-- 8. ESTADÍSTICAS GENERALES
-- ============================================================================

-- 8.1 Estadísticas de uso del sistema de quiz
SELECT
  COUNT(DISTINCT user_id) as total_users_with_attempts,
  COUNT(*) as total_attempts,
  COUNT(CASE WHEN passed = true THEN 1 END) as passed_attempts,
  ROUND(AVG(score), 2) as avg_score,
  ROUND(COUNT(CASE WHEN passed = true THEN 1 END)::numeric / COUNT(*)::numeric * 100, 2) as pass_rate
FROM quiz_attempts;

-- 8.2 Módulos más difíciles (menor tasa de aprobación)
SELECT
  m.title,
  COUNT(qa.id) as total_attempts,
  COUNT(CASE WHEN qa.passed = true THEN 1 END) as passed_attempts,
  ROUND(AVG(qa.score), 2) as avg_score,
  ROUND(COUNT(CASE WHEN qa.passed = true THEN 1 END)::numeric / COUNT(qa.id)::numeric * 100, 2) as pass_rate
FROM modules m
LEFT JOIN quiz_attempts qa ON qa.module_id = m.id
WHERE m.requires_quiz = true
GROUP BY m.id, m.title
HAVING COUNT(qa.id) > 0
ORDER BY pass_rate ASC;

-- ============================================================================
-- NOTAS DE USO
-- ============================================================================
-- 1. Reemplazar 'USER_ID_AQUI' con el ID real del usuario
-- 2. Reemplazar 'bitcoin-desde-cero' con el slug del curso que quieras verificar
-- 3. Las queries comentadas con ⚠️ son destructivas - usar con cuidado
-- 4. Para obtener un user_id, ejecutar: SELECT id, email FROM users LIMIT 5;
-- 5. Para obtener course slugs: SELECT slug, title FROM courses;
-- ============================================================================

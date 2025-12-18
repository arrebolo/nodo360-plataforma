-- =====================================================
-- DIAGNOSTICO DEL SISTEMA DE QUIZ
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- 1) Verificar si existe la columna requires_quiz en modules
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'modules'
AND column_name = 'requires_quiz';

-- 2) Verificar si existe la tabla quiz_questions
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'quiz_questions'
) AS quiz_questions_exists;

-- 3) Verificar si existe la tabla quiz_attempts
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'quiz_attempts'
) AS quiz_attempts_exists;

-- 4) Ver todos los modulos y su estado de quiz (si existe la columna)
SELECT
  c.slug AS curso,
  m.id AS module_id,
  m.title AS modulo,
  m.order_index,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'modules' AND column_name = 'requires_quiz'
    ) THEN m.requires_quiz::text
    ELSE 'COLUMNA NO EXISTE'
  END AS requires_quiz,
  (SELECT COUNT(*) FROM quiz_questions qq WHERE qq.module_id = m.id) AS num_preguntas
FROM modules m
JOIN courses c ON c.id = m.course_id
ORDER BY c.slug, m.order_index;

-- 5) Ver lecciones de cada modulo (para saber cual es la ultima)
SELECT
  m.title AS modulo,
  l.id AS lesson_id,
  l.title AS leccion,
  l.slug,
  l.order_index,
  CASE
    WHEN l.order_index = (SELECT MAX(order_index) FROM lessons WHERE module_id = m.id)
    THEN 'ULTIMA'
    ELSE ''
  END AS es_ultima
FROM lessons l
JOIN modules m ON m.id = l.module_id
JOIN courses c ON c.id = m.course_id
WHERE c.slug = 'bitcoin-para-principiantes'
ORDER BY m.order_index, l.order_index;

-- 6) Ver preguntas de quiz existentes
SELECT
  m.title AS modulo,
  qq.id AS question_id,
  qq.question,
  qq.order_index
FROM quiz_questions qq
JOIN modules m ON m.id = qq.module_id
ORDER BY m.order_index, qq.order_index;

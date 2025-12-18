-- =====================================================
-- CONFIGURACION COMPLETA DEL SISTEMA DE QUIZ
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- =====================================================
-- PASO 1: Crear columna requires_quiz en modules (si no existe)
-- =====================================================

ALTER TABLE modules
ADD COLUMN IF NOT EXISTS requires_quiz BOOLEAN DEFAULT false;

COMMENT ON COLUMN modules.requires_quiz IS 'Indica si el modulo requiere completar un quiz para desbloquearlo';

-- =====================================================
-- PASO 2: Crear tabla quiz_questions (si no existe)
-- =====================================================

CREATE TABLE IF NOT EXISTS quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]',
  correct_answer INTEGER NOT NULL DEFAULT 0,
  order_index INTEGER NOT NULL DEFAULT 1,
  explanation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indice para buscar preguntas por modulo
CREATE INDEX IF NOT EXISTS idx_quiz_questions_module_id ON quiz_questions(module_id);

-- RLS: Todos pueden leer preguntas
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view quiz questions" ON quiz_questions;
CREATE POLICY "Anyone can view quiz questions"
  ON quiz_questions FOR SELECT
  USING (true);

-- =====================================================
-- PASO 3: Crear tabla quiz_attempts (si no existe)
-- =====================================================

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '[]',
  correct_answers INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  score INTEGER NOT NULL DEFAULT 0,
  passed BOOLEAN NOT NULL DEFAULT false,
  time_spent_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_module_id ON quiz_attempts(module_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_module ON quiz_attempts(user_id, module_id);

-- RLS: Usuario puede ver y crear sus propios intentos
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own quiz attempts" ON quiz_attempts;
CREATE POLICY "Users can view own quiz attempts"
  ON quiz_attempts FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own quiz attempts" ON quiz_attempts;
CREATE POLICY "Users can create own quiz attempts"
  ON quiz_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- PASO 4: Activar quiz en el primer modulo del curso
-- =====================================================

UPDATE modules
SET requires_quiz = true
WHERE id = (
  SELECT m.id
  FROM modules m
  JOIN courses c ON c.id = m.course_id
  WHERE c.slug = 'bitcoin-para-principiantes'
  ORDER BY m.order_index
  LIMIT 1
);

-- =====================================================
-- PASO 5: Insertar 5 preguntas de prueba
-- =====================================================

-- Primero eliminar preguntas existentes del modulo 1 (para evitar duplicados)
DELETE FROM quiz_questions
WHERE module_id = (
  SELECT m.id
  FROM modules m
  JOIN courses c ON c.id = m.course_id
  WHERE c.slug = 'bitcoin-para-principiantes'
  ORDER BY m.order_index
  LIMIT 1
);

-- Insertar nuevas preguntas
INSERT INTO quiz_questions (module_id, question, options, correct_answer, order_index, explanation)
SELECT
  (
    SELECT m.id
    FROM modules m
    JOIN courses c ON c.id = m.course_id
    WHERE c.slug = 'bitcoin-para-principiantes'
    ORDER BY m.order_index
    LIMIT 1
  ) AS module_id,
  q.question,
  q.options::jsonb,
  q.correct_answer,
  q.order_index,
  q.explanation
FROM (
  VALUES
    (
      'Que problema intenta resolver Bitcoin principalmente?',
      '["El doble gasto en sistemas digitales", "La baja velocidad de Internet", "La escasez de oro fisico", "Los impuestos altos"]',
      0,
      1,
      'El doble gasto es el problema de poder gastar el mismo dinero digital dos veces. Bitcoin lo resuelve mediante la blockchain.'
    ),
    (
      'Quien publico el whitepaper de Bitcoin?',
      '["Vitalik Buterin", "Satoshi Nakamoto", "Hal Finney", "Nick Szabo"]',
      1,
      2,
      'Satoshi Nakamoto publico el whitepaper en 2008. Su identidad real sigue siendo desconocida.'
    ),
    (
      'En que ano se publico el whitepaper de Bitcoin?',
      '["2007", "2008", "2009", "2010"]',
      1,
      3,
      'El whitepaper fue publicado el 31 de octubre de 2008. La red Bitcoin se lanzo en enero de 2009.'
    ),
    (
      'Que tipo de red es Bitcoin?',
      '["Red centralizada", "Red cliente-servidor", "Red punto a punto (P2P)", "Red privada bancaria"]',
      2,
      4,
      'Bitcoin es una red peer-to-peer (P2P) donde todos los nodos son iguales, sin autoridad central.'
    ),
    (
      'Como se llama el mecanismo que asegura la cadena de bloques de Bitcoin?',
      '["Proof of Stake", "Proof of Work", "Delegated PoS", "Byzantine Proof"]',
      1,
      5,
      'Proof of Work (PoW) requiere que los mineros resuelvan problemas matematicos complejos para anadir bloques.'
    )
) AS q(question, options, correct_answer, order_index, explanation);

-- =====================================================
-- PASO 6: Verificar configuracion
-- =====================================================

SELECT
  c.slug AS curso,
  m.title AS modulo,
  m.order_index,
  m.requires_quiz,
  (SELECT COUNT(*) FROM quiz_questions qq WHERE qq.module_id = m.id) AS num_preguntas
FROM modules m
JOIN courses c ON c.id = m.course_id
WHERE c.slug = 'bitcoin-para-principiantes'
ORDER BY m.order_index;

-- Ver las preguntas insertadas
SELECT
  q.order_index,
  q.question,
  q.options,
  q.correct_answer
FROM quiz_questions q
JOIN modules m ON m.id = q.module_id
JOIN courses c ON c.id = m.course_id
WHERE c.slug = 'bitcoin-para-principiantes'
ORDER BY m.order_index, q.order_index;

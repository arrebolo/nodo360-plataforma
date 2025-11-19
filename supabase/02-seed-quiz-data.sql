-- =====================================================
-- NODO360 PLATFORM - QUIZ SEED DATA
-- =====================================================
-- Este script inserta datos de ejemplo para el sistema de quizzes
--
-- IMPORTANTE:
-- 1. Ejecuta DESPUÉS de 01-migration-quiz-certificates-dev.sql
-- 2. Reemplaza los UUIDs con los IDs reales de tu base de datos
-- 3. Este script es para DESARROLLO - ajusta para producción
-- =====================================================

-- =====================================================
-- PASO 1: MARCAR MÓDULOS QUE REQUIEREN QUIZ
-- =====================================================

-- Marcar el Módulo 1 de todos los cursos para que requieran quiz
UPDATE public.modules
SET requires_quiz = true
WHERE order_index = 1;

-- Verificar
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.modules
  WHERE requires_quiz = true AND order_index = 1;

  RAISE NOTICE '✅ % módulos marcados con requires_quiz = true', v_count;
END $$;

-- =====================================================
-- PASO 2: OBTENER IDS DE MÓDULOS
-- =====================================================

-- Ver todos los módulos disponibles (para encontrar el correcto)
DO $$
DECLARE
  r RECORD;
BEGIN
  RAISE NOTICE '=== MÓDULOS DISPONIBLES ===';
  FOR r IN
    SELECT m.id, m.title, m.order_index, c.title as course_title
    FROM public.modules m
    JOIN public.courses c ON m.course_id = c.id
    ORDER BY c.title, m.order_index
  LOOP
    RAISE NOTICE 'ID: % | Curso: % | Módulo: % (orden: %)', r.id, r.course_title, r.title, r.order_index;
  END LOOP;
END $$;

-- =====================================================
-- PASO 3: INSERTAR PREGUNTAS DE QUIZ
-- =====================================================

-- ⚠️ IMPORTANTE: Reemplaza este UUID con el ID real de tu módulo
-- Para encontrarlo, ejecuta: SELECT id, title FROM public.modules WHERE title LIKE '%Fundamentos%';

DO $$
DECLARE
  -- 🔴 REEMPLAZAR ESTE UUID CON EL ID REAL DE TU MÓDULO
  v_module_id UUID;
  v_module_title TEXT;
BEGIN
  -- Intentar encontrar el módulo automáticamente
  SELECT id, title INTO v_module_id, v_module_title
  FROM public.modules
  WHERE title ILIKE '%Fundamentos%' OR title ILIKE '%Blockchain%'
  ORDER BY order_index
  LIMIT 1;

  -- Si no se encuentra, usar el primer módulo disponible
  IF v_module_id IS NULL THEN
    SELECT id, title INTO v_module_id, v_module_title
    FROM public.modules
    WHERE order_index = 1
    ORDER BY created_at
    LIMIT 1;
  END IF;

  IF v_module_id IS NULL THEN
    RAISE EXCEPTION '❌ No se encontró ningún módulo. Crea al menos un curso con módulos primero.';
  END IF;

  RAISE NOTICE '📝 Insertando preguntas para módulo: % (ID: %)', v_module_title, v_module_id;

  -- Insertar 5 preguntas de quiz
  INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, explanation, order_index, difficulty, points) VALUES

  -- Pregunta 1: Definición básica
  (
    v_module_id,
    '¿Qué es una blockchain?',
    '["Una base de datos centralizada", "Una cadena de bloques enlazados criptográficamente", "Un tipo de criptomoneda", "Un software antivirus"]'::jsonb,
    1,
    'Una blockchain es una cadena de bloques enlazados mediante criptografía, donde cada bloque contiene un hash del bloque anterior, creando una estructura inmutable y descentralizada.',
    1,
    'easy',
    1
  ),

  -- Pregunta 2: Característica principal
  (
    v_module_id,
    '¿Cuál es la característica principal que hace que blockchain sea segura?',
    '["Velocidad de transacciones", "Descentralización e inmutabilidad", "Bajo costo de operación", "Interfaz amigable"]'::jsonb,
    1,
    'La seguridad de blockchain proviene de su naturaleza descentralizada (no hay punto único de fallo) y su inmutabilidad (una vez escrito, el dato no puede ser alterado sin que todos lo noten).',
    2,
    'medium',
    1
  ),

  -- Pregunta 3: Hash criptográfico
  (
    v_module_id,
    '¿Qué es un hash criptográfico en el contexto de blockchain?',
    '["Una contraseña de usuario", "Una función que convierte datos en una cadena de caracteres de longitud fija", "Un tipo de criptomoneda", "Una dirección de billetera"]'::jsonb,
    1,
    'Un hash criptográfico es una función matemática que toma cualquier cantidad de datos y produce una cadena de caracteres de longitud fija. Cualquier cambio en los datos de entrada produce un hash completamente diferente.',
    3,
    'medium',
    1
  ),

  -- Pregunta 4: Inmutabilidad
  (
    v_module_id,
    '¿Por qué se dice que blockchain es inmutable?',
    '["Porque nadie puede acceder a ella", "Porque cambiar datos anteriores requeriría recalcular todos los bloques posteriores", "Porque solo existe una copia", "Porque está protegida por contraseña"]'::jsonb,
    1,
    'Blockchain es inmutable porque cada bloque contiene el hash del bloque anterior. Cambiar cualquier dato anterior requeriría recalcular todos los bloques subsecuentes, lo cual es computacionalmente impracticable.',
    4,
    'hard',
    1
  ),

  -- Pregunta 5: Casos de uso
  (
    v_module_id,
    '¿Cuál de estos NO es un caso de uso típico de blockchain?',
    '["Criptomonedas", "Edición de videos", "Cadenas de suministro", "Contratos inteligentes"]'::jsonb,
    1,
    'La edición de videos no es un caso de uso típico de blockchain. Blockchain se usa principalmente para criptomonedas, trazabilidad en cadenas de suministro, smart contracts, registros inmutables, etc.',
    5,
    'easy',
    1
  );

  RAISE NOTICE '✅ 5 preguntas insertadas correctamente para el módulo: %', v_module_title;
END $$;

-- =====================================================
-- PASO 4: VERIFICACIÓN
-- =====================================================

-- Verificar que las preguntas se insertaron
DO $$
DECLARE
  v_count INTEGER;
  v_module_title TEXT;
BEGIN
  SELECT COUNT(*), MAX(m.title)
  INTO v_count, v_module_title
  FROM public.quiz_questions qq
  JOIN public.modules m ON qq.module_id = m.id;

  IF v_count > 0 THEN
    RAISE NOTICE '✅ VERIFICACIÓN: % preguntas insertadas para "%"', v_count, v_module_title;
  ELSE
    RAISE WARNING '⚠️ No se insertaron preguntas. Verifica que el módulo exista.';
  END IF;
END $$;

-- Mostrar las preguntas insertadas
SELECT
  qq.order_index as "#",
  qq.question as "Pregunta",
  qq.difficulty as "Dificultad",
  m.title as "Módulo",
  c.title as "Curso"
FROM public.quiz_questions qq
JOIN public.modules m ON qq.module_id = m.id
JOIN public.courses c ON m.course_id = c.id
ORDER BY qq.order_index;

-- =====================================================
-- PASO 5: DATOS ADICIONALES (OPCIONAL)
-- =====================================================

-- Insertar más preguntas para otros módulos si es necesario
-- Duplica el bloque DO $$ de arriba y cambia v_module_id

-- =====================================================
-- INSTRUCCIONES PARA PERSONALIZAR
-- =====================================================

/*
PARA AGREGAR PREGUNTAS A OTROS MÓDULOS:

1. Encuentra el module_id:
   SELECT id, title FROM public.modules WHERE title LIKE '%nombre del módulo%';

2. Usa este template:

INSERT INTO public.quiz_questions (
  module_id,
  question,
  options,
  correct_answer,
  explanation,
  order_index,
  difficulty,
  points
) VALUES (
  'TU-MODULE-ID-AQUI'::uuid,
  '¿Tu pregunta?',
  '["Opción A", "Opción B", "Opción C", "Opción D"]'::jsonb,
  1, -- Índice de respuesta correcta (0-3)
  'Explicación de por qué esta es la respuesta correcta.',
  1, -- Orden de la pregunta
  'medium', -- easy, medium, hard
  1 -- Puntos
);

NOTAS IMPORTANTES:
- correct_answer es el índice (0-3) de la opción correcta
- options debe ser un array JSON válido con 2-4 opciones
- order_index debe ser único dentro del módulo
- difficulty debe ser: 'easy', 'medium', o 'hard'
*/

-- =====================================================
-- SEED COMPLETO
-- =====================================================
-- ✅ Datos de ejemplo insertados correctamente
-- ✅ Listo para probar el sistema de quizzes
--
-- Próximos pasos:
-- 1. Crear un usuario de prueba
-- 2. Intentar tomar el quiz desde la UI
-- 3. Verificar que se guarden los intentos en quiz_attempts
-- 4. Verificar que se generen certificados al aprobar
-- =====================================================

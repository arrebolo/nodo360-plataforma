-- =====================================================
-- NODO360 PLATFORM - SAMPLE QUIZ QUESTIONS
-- =====================================================
-- Preguntas de ejemplo para el módulo "Fundamentos de Blockchain"
--
-- NOTA: Necesitas reemplazar los UUIDs de module_id con los IDs
-- reales de tus módulos después de crear los cursos.
--
-- Para encontrar el module_id:
-- SELECT id, title FROM public.modules WHERE title LIKE '%Fundamentos%';
-- =====================================================

-- IMPORTANTE: Reemplaza este UUID con el ID real de tu módulo
-- Este es solo un placeholder
DO $$
DECLARE
  v_module_id UUID := 'REPLACE-WITH-REAL-MODULE-UUID';
BEGIN

-- =====================================================
-- Pregunta 1: Definición básica de Blockchain
-- =====================================================
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
  v_module_id,
  '¿Qué es una blockchain?',
  '["Una base de datos centralizada", "Una cadena de bloques enlazados criptográficamente", "Un tipo de criptomoneda", "Un software antivirus"]'::jsonb,
  1,
  'Una blockchain es una cadena de bloques enlazados mediante criptografía, donde cada bloque contiene un hash del bloque anterior, creando una estructura inmutable y descentralizada.',
  1,
  'easy',
  1
);

-- =====================================================
-- Pregunta 2: Característica principal
-- =====================================================
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
  v_module_id,
  '¿Cuál es la característica principal que hace que blockchain sea segura?',
  '["Velocidad de transacciones", "Descentralización e inmutabilidad", "Bajo costo de operación", "Interfaz amigable"]'::jsonb,
  1,
  'La seguridad de blockchain proviene de su naturaleza descentralizada (no hay punto único de fallo) y su inmutabilidad (una vez escrito, el dato no puede ser alterado sin que todos lo noten).',
  2,
  'medium',
  1
);

-- =====================================================
-- Pregunta 3: Hash criptográfico
-- =====================================================
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
  v_module_id,
  '¿Qué es un hash criptográfico en el contexto de blockchain?',
  '["Una contraseña de usuario", "Una función que convierte datos en una cadena de caracteres de longitud fija", "Un tipo de criptomoneda", "Una dirección de billetera"]'::jsonb,
  1,
  'Un hash criptográfico es una función matemática que toma cualquier cantidad de datos y produce una cadena de caracteres de longitud fija. Cualquier cambio en los datos de entrada produce un hash completamente diferente.',
  3,
  'medium',
  1
);

-- =====================================================
-- Pregunta 4: Consenso
-- =====================================================
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
  v_module_id,
  '¿Qué es el consenso en una red blockchain?',
  '["El acuerdo de todos los usuarios sobre el precio", "El mecanismo por el cual los nodos acuerdan el estado de la blockchain", "La votación para elegir administradores", "El proceso de creación de wallets"]'::jsonb,
  1,
  'El consenso es el mecanismo por el cual todos los nodos de la red acuerdan cuál es el estado válido de la blockchain, sin necesidad de una autoridad central. Ejemplos: Proof of Work, Proof of Stake.',
  4,
  'medium',
  1
);

-- =====================================================
-- Pregunta 5: Minería
-- =====================================================
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
  v_module_id,
  '¿Qué es la minería en blockchain?',
  '["Extraer criptomonedas del suelo", "El proceso de validar transacciones y añadir nuevos bloques a la cadena", "Comprar criptomonedas en exchanges", "Guardar monedas en una billetera"]'::jsonb,
  1,
  'La minería es el proceso computacional de validar transacciones y resolver problemas criptográficos para añadir nuevos bloques a la blockchain. Los mineros reciben recompensas por este trabajo.',
  5,
  'easy',
  1
);

-- =====================================================
-- Pregunta 6: Nodos
-- =====================================================
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
  v_module_id,
  '¿Qué es un nodo en una red blockchain?',
  '["Una criptomoneda específica", "Una computadora que mantiene una copia de la blockchain", "Un tipo de wallet", "Un smart contract"]'::jsonb,
  1,
  'Un nodo es una computadora conectada a la red blockchain que mantiene una copia completa o parcial de la blockchain y participa en la validación de transacciones.',
  6,
  'easy',
  1
);

-- =====================================================
-- Pregunta 7: Inmutabilidad
-- =====================================================
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
  v_module_id,
  '¿Por qué se dice que blockchain es inmutable?',
  '["Porque nadie puede acceder a ella", "Porque cambiar datos anteriores requeriría recalcular todos los bloques posteriores", "Porque solo existe una copia", "Porque está protegida por contraseña"]'::jsonb,
  1,
  'Blockchain es inmutable porque cada bloque contiene el hash del bloque anterior. Cambiar cualquier dato anterior requeriría recalcular todos los bloques subsecuentes, lo cual es computacionalmente impracticable.',
  7,
  'hard',
  1
);

-- =====================================================
-- Pregunta 8: Diferencia centralizado vs descentralizado
-- =====================================================
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
  v_module_id,
  '¿Cuál es la principal diferencia entre un sistema centralizado y blockchain?',
  '["El costo de operación", "La ubicación de los datos y el control", "El lenguaje de programación usado", "La velocidad de las transacciones"]'::jsonb,
  1,
  'En un sistema centralizado, los datos y el control están en manos de una sola entidad. En blockchain, los datos están distribuidos entre múltiples nodos y el control es compartido por la red.',
  8,
  'medium',
  1
);

-- =====================================================
-- Pregunta 9: Casos de uso
-- =====================================================
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
  v_module_id,
  '¿Cuál de estos NO es un caso de uso típico de blockchain?',
  '["Criptomonedas", "Edición de videos", "Cadenas de suministro", "Contratos inteligentes"]'::jsonb,
  1,
  'La edición de videos no es un caso de uso típico de blockchain. Blockchain se usa principalmente para criptomonedas, trazabilidad en cadenas de suministro, smart contracts, registros inmutables, etc.',
  9,
  'easy',
  1
);

-- =====================================================
-- Pregunta 10: Ventajas de blockchain
-- =====================================================
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
  v_module_id,
  '¿Cuál de estas es una ventaja de usar blockchain?',
  '["Transacciones instantáneas siempre", "Transparencia y trazabilidad de todas las transacciones", "Consumo mínimo de energía", "No requiere internet"]'::jsonb,
  1,
  'Una ventaja clave de blockchain es la transparencia: todas las transacciones son visibles y trazables por todos los participantes de la red, creando un registro de auditoría permanente.',
  10,
  'medium',
  1
);

END $$;

-- =====================================================
-- INSTRUCCIONES PARA USAR ESTE ARCHIVO
-- =====================================================
-- 1. Primero, encuentra el ID real de tu módulo:
--    SELECT id, title FROM public.modules WHERE title LIKE '%Fundamentos%';
--
-- 2. Reemplaza 'REPLACE-WITH-REAL-MODULE-UUID' en este archivo
--    con el UUID real que obtuviste
--
-- 3. Ejecuta este script en Supabase SQL Editor
--
-- 4. Verifica que las preguntas se insertaron correctamente:
--    SELECT * FROM public.quiz_questions WHERE module_id = 'tu-module-id';
-- =====================================================

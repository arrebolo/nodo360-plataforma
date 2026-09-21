-- ============================================================================
-- MIGRACION 028: tildes en titulos y descripciones de Cold Storage y Nodos
--
-- Los dos cursos se cargaron con el texto sin acentuar ("Implementacion
-- Practica", "Soberania Tecnica", "por que", "cual"...). Se corrige en courses,
-- modules y lessons.
--
-- LOS SLUGS NO SE TOCAN: son URLs publicadas y cambiarlas romperia los enlaces
-- existentes y lo que ya este indexado.
--
-- Ademas se reescribe la descripcion de la leccion 2.2 de Nodos. Decia que la
-- instalacion se hace "con Umbrel o Start9", y la leccion no sigue ese camino:
-- instala Bitcoin Core directamente y verifica la firma del binario.
--
-- Cada UPDATE filtra por el valor antiguo ademas de por el identificador, de
-- modo que reejecutar la migracion no hace nada y, si alguien ya corrigio un
-- texto a mano, no se le pisa.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------- CURSOS

UPDATE public.courses SET
  long_description = 'Tener bitcoin en un exchange o en una wallet conectada a internet es como guardar dinero en efectivo sobre la mesa. En este curso aprenderás a mover tus fondos a cold storage: almacenamiento sin conexión que te da control total. No necesitas ser técnico — solo necesitas criterio y un plan.'
WHERE slug = 'cold-storage-protege-tus-bitcoin'
  AND long_description LIKE '%aprenderas a mover tus fondos%';

UPDATE public.courses SET
  title = 'Nodos Bitcoin - Tu Soberanía Técnica',
  description = 'Entiende qué es un nodo Bitcoin, por qué te hace soberano, y cómo montar el tuyo sin ser programador.',
  long_description = 'Cada vez que usas un exchange o una wallet ligera, estás confiando en el nodo de otro para verificar tus transacciones. En este curso aprenderás por qué eso importa, qué tipos de nodos existen, y cómo montar tu propio nodo para verificar todo por ti mismo.'
WHERE slug = 'nodos-bitcoin-tu-soberania-tecnica'
  AND title = 'Nodos Bitcoin - Tu Soberania Tecnica';

-- ---------------------------------------------------------------- MODULOS

-- Cold Storage
UPDATE public.modules m SET
  description = 'Entiende qué proteger, de quién, y qué opciones tienes antes de tocar ninguna herramienta.'
FROM public.courses c
WHERE m.course_id = c.id
  AND c.slug = 'cold-storage-protege-tus-bitcoin'
  AND m.title = 'Fundamentos de Custodia'
  AND m.description LIKE 'Entiende que proteger%';

UPDATE public.modules m SET
  title = 'Implementación Práctica',
  description = 'Pasa de la teoría a la acción. Configura, respalda y verifica tu setup de cold storage.'
FROM public.courses c
WHERE m.course_id = c.id
  AND c.slug = 'cold-storage-protege-tus-bitcoin'
  AND m.title = 'Implementacion Practica';

-- Nodos Bitcoin
UPDATE public.modules m SET
  title = 'Por Qué un Nodo Propio',
  description = 'Entiende el rol de los nodos en Bitcoin y por qué ejecutar uno te convierte en un participante soberano de la red.'
FROM public.courses c
WHERE m.course_id = c.id
  AND c.slug = 'nodos-bitcoin-tu-soberania-tecnica'
  AND m.title = 'Por Que un Nodo Propio';

-- ---------------------------------------------------------------- LECCIONES
-- Se identifican por slug, que es estable y no se modifica.

-- Cold Storage
UPDATE public.lessons SET
  description = 'Entiende qué es una seed phrase, por qué es crítica, y los errores más comunes que debes evitar.'
WHERE slug = 'seed-phrases-tu-llave-maestra'
  AND description LIKE 'Entiende que es una seed phrase%';

UPDATE public.lessons SET
  description = 'Aprende a hacer backups seguros de tu seed phrase y diseña una estrategia de respaldo.'
WHERE slug = 'backup-seguro-de-seeds'
  AND description LIKE '%disena una estrategia%';

UPDATE public.lessons SET
  title = 'Verificación y Simulacro de Recuperación',
  description = 'Aprende a verificar que tu setup funciona y haz un simulacro de recuperación completo.'
WHERE slug = 'verificacion-y-simulacro-de-recuperacion'
  AND title = 'Verificacion y Simulacro de Recuperacion';

-- Nodos Bitcoin
UPDATE public.lessons SET
  description = 'Entiende qué hace un nodo Bitcoin y por qué son la columna vertebral de la red.'
WHERE slug = 'el-rol-de-los-nodos-en-bitcoin'
  AND description LIKE 'Entiende que hace un nodo%';

UPDATE public.lessons SET
  title = 'Soberanía sin Intermediarios',
  description = 'Entiende por qué ejecutar tu propio nodo elimina la necesidad de confiar en terceros.'
WHERE slug = 'soberania-sin-intermediarios'
  AND title = 'Soberania sin Intermediarios';

UPDATE public.lessons SET
  description = 'Conoce los diferentes tipos de nodos, sus diferencias, y cuál te conviene.'
WHERE slug = 'tipos-de-nodos-y-sus-funciones'
  AND description LIKE '%y cual te conviene%';

UPDATE public.lessons SET
  description = 'Conoce las opciones de hardware y software disponibles y elige la combinación que mejor te conviene.'
WHERE slug = 'hardware-y-software-elige-tu-setup'
  AND description LIKE '%la combinacion que mejor%';

-- Reescrita, no solo acentuada: la leccion instala Bitcoin Core directamente y
-- verifica la firma del binario. No usa Umbrel ni Start9.
UPDATE public.lessons SET
  title = 'Instalación Paso a Paso',
  description = 'Instala Bitcoin Core verificando que el binario es auténtico, y conoce qué esperar durante la sincronización inicial.'
WHERE slug = 'instalacion-paso-a-paso'
  AND title = 'Instalacion Paso a Paso';

UPDATE public.lessons SET
  title = 'Mantenimiento y Buenas Prácticas'
WHERE slug = 'mantenimiento-y-buenas-practicas'
  AND title = 'Mantenimiento y Buenas Practicas';

COMMIT;


-- ============================================================================
-- COMPROBACION (solo lectura, ejecutar aparte)
-- ============================================================================
-- Debe devolver CERO filas: ningun titulo ni descripcion de estos dos cursos
-- conserva las formas sin acentuar.
--
-- SELECT 'course' AS objeto, c.slug, c.title
-- FROM public.courses c
-- WHERE c.slug IN ('cold-storage-protege-tus-bitcoin','nodos-bitcoin-tu-soberania-tecnica')
--   AND (c.title ~ 'Soberania|Tecnica|Practica|Implementacion'
--        OR c.description ~ '\mque es|\mpor que|\mcomo montar'
--        OR c.long_description ~ 'aprenderas|conexion|tecnico|estas confiando|por que|que tipos|como montar')
-- UNION ALL
-- SELECT 'module', m.title, COALESCE(m.description,'')
-- FROM public.modules m JOIN public.courses c ON c.id = m.course_id
-- WHERE c.slug IN ('cold-storage-protege-tus-bitcoin','nodos-bitcoin-tu-soberania-tecnica')
--   AND (m.title ~ 'Practica|Implementacion|Por Que'
--        OR m.description ~ '\mque proteger|de quien|teoria|accion|por que')
-- UNION ALL
-- SELECT 'lesson', l.slug, l.title
-- FROM public.lessons l JOIN public.courses c ON c.id = l.course_id
-- WHERE c.slug IN ('cold-storage-protege-tus-bitcoin','nodos-bitcoin-tu-soberania-tecnica')
--   AND (l.title ~ 'Verificacion|Recuperacion|Soberania|Instalacion|Practicas'
--        OR l.description ~ 'que es una seed|critica|mas comunes|recuperacion|que hace un nodo'
--                           '|por que|cual te conviene|combinacion|Umbrel|Start9|disena');
--
-- Y para confirmar que los slugs no se han movido:
--
-- SELECT slug FROM public.lessons l
-- JOIN public.courses c ON c.id = l.course_id
-- WHERE c.slug IN ('cold-storage-protege-tus-bitcoin','nodos-bitcoin-tu-soberania-tecnica')
-- ORDER BY slug;
-- Deben seguir siendo los mismos 12 slugs de siempre, todos sin acentos.

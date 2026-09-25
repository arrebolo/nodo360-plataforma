-- ============================================================================
-- 059: quita la columna modules.requires_quiz
-- ============================================================================
-- ESTADO: PENDIENTE DE APLICAR. Es DDL, no se puede ejecutar por PostgREST.
--   Fichero listo para el editor SQL: C:/Users/alber/059-aplicar.sql
--
-- POR QUE SE QUITA Y NO SE DOCUMENTA POR QUE SE QUEDA
--   Era un interruptor desconectado, y eso es peor que no tenerlo. Lo leian
--   exactamente dos funciones, y a ninguna de las dos la llamaba nadie:
--
--     lib/progress/unlockNextModule.ts      -> borrado el 25/09/2026
--     lib/certificates/generator.ts         -> issueCourseCertificate, borrada
--
--   Las dos piezas vivas NO la miran:
--     lib/progress/checkLessonAccess.ts     -> abre el modulo siguiente cuando
--       estan completas las lecciones del anterior. Nada de quiz.
--     lib/certificates/createCertificate.ts -> emite el certificado cuando
--       progress_percentage >= 100 o completed_at. Nada de quiz.
--
--   Asi que poner requires_quiz = true en los 27 modulos no habria cambiado
--   nada. El riesgo real no era el flag: era que alguien lo activara creyendo
--   que exigia algo. Se quita para que no vuelva a pasar.
--
--   Y aunque se hubiera cableado, tal como estaba no podia funcionar:
--   /api/quiz/submit guarda el intento SIEMPRE con module_id = primer modulo
--   del curso, y has_passed_module_quiz busca un aprobado con ese modulo
--   exacto. Con requires_quiz = true en los tres modulos, los modulos 2 y 3
--   no se aprobaban jamas y el certificado quedaba inalcanzable para siempre.
--
-- LO QUE OCUPA SU SITIO
--   La exigencia va en createCertificate, con una condicion de curso y no de
--   modulo: "existe un intento aprobado de este curso". La funcion que la
--   responde ya existe y esta en uso, userPassedQuiz() de
--   lib/quiz/checkCourseQuiz.ts. Ese cambio NO va en esta migracion: se activa
--   aparte y a proposito.
--
-- EFECTO EN EL HISTORIAL DE MIGRACIONES
--   Tres migraciones ya aplicadas nombran la columna en sus INSERT: la 048, la
--   052 y la 055. No se tocan, porque describen lo que se ejecutó ese dia y son
--   el registro de lo que paso. Consecuencia: el historial completo deja de ser
--   reproducible de cero tal cual. No era el modo de trabajo -varias
--   migraciones se aplicaron por PostgREST y se versionaron despues-, pero
--   conviene que este escrito y no descubrirlo el dia que haga falta.
--
-- CABO SUELTO QUE SE DEJA A PROPOSITO
--   La funcion has_passed_module_quiz(uuid, uuid) se queda huerfana con esto:
--   sus dos unicos llamantes eran los dos ficheros borrados. Es una funcion
--   SECURITY DEFINER con su guarda de identidad, no molesta y borrarla es otra
--   decision. Queda anotada aqui para que no se olvide.
--
-- DATOS QUE SE PIERDEN
--   Ninguno util: los 27 modulos publicados tenian requires_quiz = false.
--   Comprobado antes de escribir esto.
--
-- VOLVER ATRAS
--   La columna se recrea con su valor por defecto. No hay datos que restaurar,
--   porque no habia ninguno distinto del defecto:
--     ALTER TABLE public.modules
--       ADD COLUMN requires_quiz boolean NOT NULL DEFAULT false;
-- ============================================================================

BEGIN;

-- Antes de nada: si alguien la hubiera puesto en true desde el diagnostico,
-- esto para la migracion en seco en vez de borrar una decision de alguien.
DO $$
DECLARE
  v_true integer;
BEGIN
  SELECT count(*) INTO v_true FROM public.modules WHERE requires_quiz IS TRUE;
  IF v_true > 0 THEN
    RAISE EXCEPTION 'Hay % modulos con requires_quiz = true. Revisar antes de borrar la columna.', v_true;
  END IF;
END $$;

ALTER TABLE public.modules DROP COLUMN requires_quiz;

COMMIT;


-- ============================================================================
-- COMPROBACIONES (solo lectura)
-- ============================================================================
-- 1. La columna ya no existe
--
-- SELECT count(*) FROM information_schema.columns
--  WHERE table_schema = 'public' AND table_name = 'modules'
--    AND column_name = 'requires_quiz';
-- QUE DEBE SALIR: 0.
--
-- 2. Y los modulos siguen enteros
--
-- SELECT count(*) AS modulos, count(DISTINCT course_id) AS cursos
--   FROM public.modules;
-- QUE DEBE SALIR: los mismos numeros que antes (37 modulos, 15 cursos
-- contando los archivados; 27 modulos en los 10 cursos publicados).
--
-- 3. Que ninguna vista o funcion la referenciara
--
-- SELECT p.proname FROM pg_proc p
--   JOIN pg_namespace n ON n.oid = p.pronamespace
--  WHERE n.nspname = 'public' AND pg_get_functiondef(p.oid) LIKE '%requires_quiz%';
-- QUE DEBE SALIR: 0 filas. Si sale alguna, la migracion habria fallado al
-- ejecutarse, asi que esto es para confirmar despues.

-- ============================================================================
-- 070: fuera el trigger que emitia certificados sin pasar por el codigo
-- ============================================================================
-- ESTADO: PENDIENTE DE APLICAR. Es DDL, no se puede ejecutar por PostgREST.
--   Fichero listo para el editor SQL: C:/Users/alber/070-aplicar.sql
--   Estado antes y despues, solo lectura:  C:/Users/alber/070-comprobar.sql
--
-- EL FALLO, CON SU CASO
--   El 26/09/2026 a las 23:49:26 una cuenta creada ese mismo dia recibio el
--   certificado NODO360-2026-90D8A73D de "Fundamentos de Bitcoin" sin haber
--   aprobado el examen. Su unico intento fue 38 segundos DESPUES del
--   certificado, y suspendio con un 33.
--
--   La exigencia del examen estaba desplegada desde el 25/09 (#204) y funciona.
--   El problema es que no se llega a ella:
--
--     app/api/progress/route.ts:177  UPDATE course_enrollments SET completed_at
--                                    -> dispara el trigger, que INSERTA el
--                                       certificado sin mirar ningun examen
--     app/api/progress/route.ts:205  createCertificate(...)
--                                    -> su paso 1 encuentra el certificado que
--                                       el trigger acaba de crear y devuelve
--                                       alreadyExists: true
--
--   El trigger gana la carrera por 28 lineas, en la misma peticion. La
--   condicion de userPassedQuiz vive 100 lineas mas abajo y nunca se evalua.
--
-- DE DONDE VENIA
--   supabase/017_student_certificates.sql, un fichero SUELTO en supabase/ que
--   nunca entro en supabase/migrations/. Por eso no aparecio al revisar las
--   migraciones versionadas: la carpeta numerada va de la 001 a la 069 y este
--   no esta. Aplicado a mano en enero de 2026; la 047 (24/09/2026) ya lo
--   mencionaba como vivo.
--
-- COMO SE IDENTIFICO CADA CERTIFICADO
--   Las dos vias dejan huellas distintas, y no hay ninguna ambiguedad:
--
--                        trigger                     createCertificate
--     numero             NODO360-YYYY-XXXXXXXX       NODO-YYYYMMDD-XXXXX
--     description        'Certificado de             NULL (el codigo no
--                        completacion del curso'      escribe ese campo)
--     verification_url   https://nodo360.com fijo    NEXT_PUBLIC_SITE_URL
--     issued_at          == created_at (mismo NOW)   != created_at
--
--   Reparto de los 18 certificados existentes:
--     11 del trigger, de los cuales 6 con examen aprobado y 5 sin el
--      7 del codigo,  los 7 con examen aprobado
--
--   Los 5 sin examen: 4 son de la cuenta de pruebas del propietario
--   (2026-01-29, cursos hoy archivados) y 1 es el de anoche, que se borra abajo.
--
-- POR QUE SE BORRAN LAS FUNCIONES Y NO SE ARREGLAN
--   Podria anadirseles la comprobacion del examen, pero entonces habria dos
--   sitios donde vive la misma regla y que tendrian que cambiar a la vez. La
--   regla vive en lib/certificates/createCertificate.ts, y las dos vias que
--   quedan para emitir un certificado —completar la ultima leccion y aprobar el
--   examen— pasan las dos por ahi:
--
--     app/api/progress/route.ts:205     createCertificate(...)
--     app/api/quiz/submit/route.ts:309  createCertificate(...)
--
--   Ninguna de las tres funciones que se borran se llama desde el codigo:
--   comprobados 0 usos de issue_course_certificate_manual,
--   backfill_missing_certificates y auto_issue_course_certificate en app/,
--   components/, lib/ y hooks/. Sus definiciones siguen en
--   supabase/017_student_certificates.sql si alguna vez hicieran falta; una
--   funcion de backfill nueva tendria que escribirse contra la regla nueva.
--
-- POR QUE EL ENDURECIMIENTO DE LA 033 NO LO COGIO
--   La 033 (22/09/2026) revoco EXECUTE de PUBLIC en las 73 funciones de public,
--   y con eso neutralizo los GRANT ... TO authenticated de la 017: comprobado
--   el 27/09/2026 con un JWT real de rol authenticated, tanto
--   issue_course_certificate_manual como backfill_missing_certificates
--   responden 42501 permission denied. Pero un trigger no se ejecuta por un
--   GRANT: lo invoca la tabla. Por eso sobrevivio.
--
-- QUE NO SE TOCA
--   Los 11 certificados de enero de 2026 se quedan como estan, incluidos los 4
--   sin examen. El certificado congela lo que se acredito entonces, y entonces
--   la exigencia no existia. Lo mismo que se decidio en la 047.
--
-- COMO VOLVER ATRAS
--   Reaplicar supabase/017_student_certificates.sql, que sigue en el
--   repositorio. Devuelve el trigger y las cuatro funciones tal cual estaban.
--   El certificado borrado no vuelve: si hiciera falta, se reemite al completar
--   el curso con el examen aprobado, que es lo que se pretende.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1) El trigger. Este es el fallo.
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trigger_auto_certificate_on_completion
  ON public.course_enrollments;

-- ----------------------------------------------------------------------------
-- 2) La funcion que ejecutaba, ya huerfana.
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.auto_issue_course_certificate();

-- ----------------------------------------------------------------------------
-- 3) Las otras dos vias que emiten sin comprobar el examen.
--
--    backfill_missing_certificates llama a issue_course_certificate_manual, asi
--    que se van juntas o no se van.
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.backfill_missing_certificates();
DROP FUNCTION IF EXISTS public.issue_course_certificate_manual(uuid, uuid);

-- ----------------------------------------------------------------------------
-- 4) Lo que queda de la 017, como manda la regla de la casa.
--
--    get_user_certificates_summary es de solo lectura y no la llama nadie (0
--    usos en el codigo), pero se queda porque no emite nada. Nacio SECURITY
--    DEFINER sin search_path y con EXECUTE para PUBLIC, que es como nacen todas
--    las funciones de Postgres. La 033 ya le quito PUBLIC; esto le pone el
--    search_path y lo deja explicito.
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'get_user_certificates_summary'
  ) THEN
    EXECUTE 'ALTER FUNCTION public.get_user_certificates_summary(uuid) SET search_path = public, pg_temp';
    EXECUTE 'REVOKE ALL ON FUNCTION public.get_user_certificates_summary(uuid) FROM PUBLIC';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.get_user_certificates_summary(uuid) TO service_role';
    RAISE NOTICE 'get_user_certificates_summary: search_path fijado y PUBLIC revocado';
  ELSE
    RAISE NOTICE 'get_user_certificates_summary no existe, nada que endurecer';
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 5) El certificado de la prueba de anoche.
--
--    Emitido por el fallo a una cuenta creada ese mismo dia, con el examen
--    suspendido. Lo confirmo el propietario: es suyo y se borra. Se filtra por
--    numero y no por id para que la sentencia se lea sola, y es idempotente:
--    si ya no esta, borra cero filas.
--
--    No se toca course_enrollments. completed_at se queda puesto, asi que esa
--    matricula queda al 100% sin certificado y sin examen aprobado, que es
--    exactamente el estado correcto con la regla nueva: la ficha del curso le
--    mostrara el aviso ambar con el enlace al examen final.
-- ----------------------------------------------------------------------------
DELETE FROM public.certificates
 WHERE certificate_number = 'NODO360-2026-90D8A73D';

-- ----------------------------------------------------------------------------
-- 6) Comprobacion: si algo no ha quedado como toca, esto aborta la transaccion.
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_trigger INTEGER;
  v_funciones INTEGER;
  v_prueba INTEGER;
BEGIN
  SELECT count(*) INTO v_trigger
    FROM pg_trigger
   WHERE tgrelid = 'public.course_enrollments'::regclass
     AND tgname = 'trigger_auto_certificate_on_completion'
     AND NOT tgisinternal;

  IF v_trigger > 0 THEN
    RAISE EXCEPTION 'El trigger sigue ahi. Abortando.';
  END IF;

  SELECT count(*) INTO v_funciones
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public'
     AND p.proname IN (
       'auto_issue_course_certificate',
       'issue_course_certificate_manual',
       'backfill_missing_certificates'
     );

  IF v_funciones > 0 THEN
    RAISE EXCEPTION 'Quedan % funciones de emision sin comprobacion de examen. Abortando.', v_funciones;
  END IF;

  SELECT count(*) INTO v_prueba
    FROM public.certificates
   WHERE certificate_number = 'NODO360-2026-90D8A73D';

  IF v_prueba > 0 THEN
    RAISE EXCEPTION 'El certificado de prueba sigue en la tabla. Abortando.';
  END IF;

  RAISE NOTICE 'OK: trigger fuera, 3 funciones fuera, certificado de prueba borrado.';
  RAISE NOTICE 'Certificados restantes: %', (SELECT count(*) FROM public.certificates);
END $$;

COMMIT;

-- ============================================================================
-- DESPUES DE APLICAR
--   La emision pasa solo por lib/certificates/createCertificate.ts, que exige
--   el examen cuando el curso tiene preguntas. El recorrido completo queda:
--
--     completa la ultima leccion -> /api/progress llama a createCertificate
--                                -> sin examen aprobado: pendiente 'examen'
--                                -> la ficha muestra el aviso ambar
--     aprueba el examen final    -> /api/quiz/submit llama a createCertificate
--                                -> se emite, sin tener que marcar nada mas
--
--   PENDIENTE APARTE, no en esta migracion: el barrido del 27/09/2026 encontro
--   mas triggers aplicados a mano desde ficheros sueltos de supabase/ que nunca
--   entraron en migrations/. Ninguno crea filas en certificates, pero conviene
--   versionarlos:
--
--     auto_update_certificate_url   certificates          03-storage-certificates-setup.sql
--     trg_update_enrolled_count     course_enrollments    04-migration-enrollments.sql
--     trg_update_last_accessed      course_enrollments    04-migration-enrollments.sql
--     trigger_update_last_message   messages              018_messaging_system.sql
--     quiz_questions_updated_at     quiz_questions        01-migration-quiz-certificates-dev.sql
-- ============================================================================

-- ============================================================================
-- MIGRACION 089: el trigger de la 088 comparaba un enum con un array de texto
--
-- QUE PASO, EL MISMO DIA 29/09/2026
-- La 088 se aplico y dejo el trigger vivo. courses.status no es texto: es el
-- enum public.course_status, con siete valores. Y el trigger hacia
--
--     IF NEW.status = ANY (ARRAY['published', 'rejected']) THEN
--
-- es decir, comparaba course_status con text[]. Ese operador no existe, asi que
-- CUALQUIER cambio de status hecho por alguien con sesion que no fuese
-- administracion moria con 42883 (undefined_function) en vez de con el mensaje
-- previsto.
--
-- Consecuencias, medidas con la cuenta de prueba justo despues de aplicar:
--
--   · el agujero 2 quedaba «cerrado», pero por accidente: no por la regla, sino
--     porque la funcion reventaba antes de evaluarla
--   · y con el se cayo lo legitimo: un instructor NO podia enviar su curso a
--     revision (draft -> pending_review), que es el camino normal de
--     app/api/instructor/courses/[id]/submit-review. Roto en produccion desde
--     que se aplico la 088 hasta que se aplique esta.
--
-- Lo que si funcionaba: el INSERT (ahi la comparacion era contra un literal, y
-- un literal si se convierte al enum), el bloqueo de review_status y la edicion
-- del titulo.
--
-- EL ARREGLO
-- Convertir a texto de forma explicita en todas las comparaciones de status.
-- No se toca la regla, solo el tipo.
--
-- POR QUE NO SE CORRIGIO LA 088 EN SU SITIO
-- Porque la 088 llego a la base de datos con el fallo y el trigger estuvo roto
-- un rato. Reescribirla dejaria un historial en el que eso no ocurrio nunca.
--
-- LO QUE ESTA MIGRACION AÑADE Y LA 088 NO TENIA: SE PRUEBA A SI MISMA
-- El fallo no lo cazo la verificacion de la 088 porque esa verificacion miraba
-- que el trigger EXISTIERA, no que FUNCIONARA. Aqui hay una prueba de verdad:
-- se crea una fila de usar y tirar, se suplanta una sesion sin privilegios con
-- request.jwt.claims —que es de donde lee auth.uid()— y se comprueba que lo
-- permitido pasa y que lo prohibido falla con 42501. Si algo no cuadra, la
-- migracion se aborta entera y no deja nada.
--
-- NO BORRA NI UNA FILA (la de la prueba se borra en su misma transaccion).
-- Es reejecutable.
-- ============================================================================

BEGIN;

-- =====================================================
-- 1. La funcion, con las conversiones explicitas
-- =====================================================

CREATE OR REPLACE FUNCTION public.controlar_publicacion_de_cursos()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  -- De texto, y las comparaciones con ::text. courses.status es el enum
  -- public.course_status: sin la conversion no hay operador, y la 088 murio
  -- por ahi con 42883.
  SOLO_ADMIN constant text[] := ARRAY['published', 'rejected'];
BEGIN
  -- Sin identidad en la sesion: service_role, el editor SQL y las migraciones.
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF public.es_admin_actual() THEN
    RETURN NEW;
  END IF;

  -- De aqui abajo: alguien con sesion que no es administracion.

  IF TG_OP = 'INSERT' THEN
    IF NEW.status::text IS DISTINCT FROM 'draft' THEN
      RAISE EXCEPTION
        'Un curso nuevo solo puede nacer en borrador; se intento "%". Publicar o rechazar lo decide la administracion.',
        NEW.status
        USING ERRCODE = '42501';
    END IF;

    -- Y no puede nacer ya revisado. 'none' es el valor por defecto de la
    -- columna, y el de los 15 cursos que hay: se comprobo uno a uno.
    IF NEW.review_status IS DISTINCT FROM 'none' THEN
      RAISE EXCEPTION
        'Un curso nuevo nace sin revisar; se intento review_status="%".',
        NEW.review_status
        USING ERRCODE = '42501';
    END IF;

    RETURN NEW;
  END IF;

  IF NEW.status::text IS DISTINCT FROM OLD.status::text THEN
    IF NEW.status::text = ANY (SOLO_ADMIN) THEN
      RAISE EXCEPTION
        'Solo la administracion puede dejar un curso en "%". Para pedir la publicacion, enviar a revision.',
        NEW.status
        USING ERRCODE = '42501';
    END IF;

    IF OLD.status::text = 'pending_review' AND NEW.status::text <> 'draft' THEN
      RAISE EXCEPTION
        'El curso esta pendiente de revision: desde ahi solo puede volver a borrador.'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  IF NEW.review_status IS DISTINCT FROM OLD.review_status THEN
    RAISE EXCEPTION
      'review_status lo decide quien revisa, no quien escribe el curso.'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END
$fn$;

COMMENT ON FUNCTION public.controlar_publicacion_de_cursos() IS
  'Gobierna courses.status y courses.review_status. Las comparaciones de status van con ::text a proposito: la columna es el enum public.course_status y la version de la 088 comparaba contra text[], operador que no existe, de modo que rompia hasta el envio a revision. Es un trigger y no una politica porque una transicion es una regla sobre (viejo, nuevo), y una politica RLS no puede comparar las dos filas.';

-- El trigger, por si esta migracion se ejecuta en una base donde no quedo.
DROP TRIGGER IF EXISTS trg_controlar_publicacion ON public.courses;

CREATE TRIGGER trg_controlar_publicacion
  BEFORE INSERT OR UPDATE ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION public.controlar_publicacion_de_cursos();

-- =====================================================
-- 2. La prueba, dentro de la propia migracion
-- =====================================================
-- Se suplanta una sesion sin privilegios escribiendo request.jwt.claims, que es
-- de donde lee auth.uid(). El id es inventado y no existe en public.users, asi
-- que es_admin_actual() devuelve falso. Alcance de transaccion: no sale de aqui.
--
-- Si cualquiera de las tres pruebas no da lo esperado, se levanta una excepcion
-- y la migracion entera se deshace: mas vale no aplicarla que aplicarla creyendo
-- que funciona, que es exactamente lo que paso con la 088.

DO $prueba$
DECLARE
  v_id    uuid;
  v_falso uuid := '00000000-0000-0000-0000-000000000001';
  v_slug  text := 'prueba-089-borrar-' || extract(epoch from clock_timestamp())::bigint;
BEGIN
  INSERT INTO public.courses (title, slug, description, level, is_free, status)
  VALUES ('PRUEBA-089-BORRAR', v_slug, 'Fila de prueba de la 089. Se borra en esta misma transaccion.',
          'beginner', true, 'draft')
  RETURNING id INTO v_id;

  PERFORM set_config('request.jwt.claims',
                     json_build_object('sub', v_falso, 'role', 'authenticated')::text,
                     true);

  IF auth.uid() IS DISTINCT FROM v_falso THEN
    RAISE EXCEPTION
      'La prueba no puede suplantar la sesion: auth.uid() devuelve %. Sin eso no se esta probando nada.',
      coalesce(auth.uid()::text, 'NULL');
  END IF;

  -- 1. Lo legitimo: enviar a revision
  UPDATE public.courses SET status = 'pending_review' WHERE id = v_id;
  -- Que la fila se haya escrito de verdad. Si aqui salieran 0 filas, la prueba
  -- no estaria probando el trigger sino la RLS, y las dos siguientes darian un
  -- fallo enganoso.
  IF NOT FOUND THEN
    RAISE EXCEPTION 'La prueba no pudo escribir la fila (0 filas afectadas). No se esta probando el trigger.';
  END IF;
  IF (SELECT status::text FROM public.courses WHERE id = v_id) <> 'pending_review' THEN
    RAISE EXCEPTION 'La prueba escribio pero el status no quedo en pending_review.';
  END IF;
  RAISE NOTICE 'PRUEBA 1  draft -> pending_review (permitido)   PASA';

  -- 2. Lo prohibido: publicarse
  BEGIN
    UPDATE public.courses SET status = 'published' WHERE id = v_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'PRUEBA 2 SIN VALOR: 0 filas afectadas, el trigger no llego a opinar.';
    END IF;
    RAISE EXCEPTION 'PRUEBA 2 FALLIDA: un no-admin pudo publicar.';
  EXCEPTION
    WHEN insufficient_privilege THEN
      RAISE NOTICE 'PRUEBA 2  -> published (prohibido)            PASA';
  END;

  -- 3. Lo prohibido: autoaprobarse
  BEGIN
    UPDATE public.courses SET review_status = 'approved' WHERE id = v_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'PRUEBA 3 SIN VALOR: 0 filas afectadas, el trigger no llego a opinar.';
    END IF;
    RAISE EXCEPTION 'PRUEBA 3 FALLIDA: un no-admin pudo autoaprobarse.';
  EXCEPTION
    WHEN insufficient_privilege THEN
      RAISE NOTICE 'PRUEBA 3  review_status (prohibido)           PASA';
  END;

  PERFORM set_config('request.jwt.claims', '', true);
  DELETE FROM public.courses WHERE id = v_id;
  RAISE NOTICE 'Fila de prueba borrada. Las tres pruebas pasan.';
END
$prueba$;

COMMIT;

-- ============================================================================
-- VERIFICACION
-- ============================================================================

SELECT
  EXISTS (
    SELECT 1 FROM pg_trigger
     WHERE tgrelid = 'public.courses'::regclass
       AND tgname = 'trg_controlar_publicacion'
       AND NOT tgisinternal
  )                                                                    AS trigger_activo,

  -- Que el arreglo esta dentro, y no solo que la funcion existe
  (SELECT count(*) FROM regexp_matches(
     pg_get_functiondef('public.controlar_publicacion_de_cursos()'::regprocedure),
     'status::text', 'g'))                                             AS conversiones_a_texto,

  (SELECT count(*) FROM public.courses WHERE title = 'PRUEBA-089-BORRAR') AS filas_de_prueba_que_quedan,

  (SELECT count(*) FROM public.courses)                                 AS cursos,
  (SELECT count(*) FROM public.courses WHERE status = 'published')       AS publicados,

  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_trigger
       WHERE tgrelid = 'public.courses'::regclass
         AND tgname = 'trg_controlar_publicacion'
         AND NOT tgisinternal)
     AND (SELECT count(*) FROM regexp_matches(
            pg_get_functiondef('public.controlar_publicacion_de_cursos()'::regprocedure),
            'status::text', 'g')) >= 4
     AND (SELECT count(*) FROM public.courses WHERE title = 'PRUEBA-089-BORRAR') = 0
      THEN 'TODO CORRECTO'
    ELSE 'REVISAR: mira las columnas de esta misma fila'
  END                                                                   AS veredicto;

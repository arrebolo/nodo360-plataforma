-- ============================================================================
-- MIGRACION 098: estar verificado en una especialidad habilita SOLO en esa
--
-- Es la pieza que sostiene todo lo anterior. Sin ella, la verificacion por
-- especialidad es una etiqueta: alguien verificado en Bitcoin podia mandar a
-- revision un curso de fiscalidad, y el sello del paso 5 no significaba nada
-- respecto a lo que esa persona puede enseñar.
--
-- ESQUEMA VOLCADO ANTES:
--   courses.specialty_id              uuid NULL  FK -> instructor_specialties
--   instructor_certifications.status  text       pendiente/aprobada/rechazada/retirada
--   instructor_certifications.expires_at, revoked_at
--   Estado real: 15 cursos (10 con especialidad), 0 certificaciones, 1 instructor.
--
-- ============================================================================
-- LO QUE ESTO BLOQUEA DESDE EL MINUTO UNO, Y CONVIENE SABERLO
-- ============================================================================
-- Hay CERO certificaciones aprobadas. En cuanto se aplique, NADIE que no sea
-- administracion podra enviar un curso a revision, porque nadie esta verificado
-- en nada.
--
-- Eso es el diseño, no un efecto colateral: enseñar exige estar verificado, y
-- para eso estan la pantalla del evaluador (/admin/verificaciones) y el
-- formulario del candidato. El camino para desbloquearlo existe y son dos
-- clics: abrir el expediente y aprobarlo.
--
-- Si se prefiere una version mas blanda, la linea a cambiar es UNA y esta
-- marcada abajo con VALVULA: dejar pasar cuando la especialidad todavia no
-- tiene ningun instructor verificado. No se hace por defecto porque una regla
-- que se apaga sola mientras no se cumple no es una regla.
-- ============================================================================
--
-- NO BORRA NI UNA FILA. No cambia el estado de ningun curso. Es reejecutable.
-- Y se prueba a si misma, suplantando sesiones con request.jwt.claims.
-- ============================================================================

BEGIN;

-- =====================================================
-- 1. puede_ensenar
-- =====================================================
-- SECURITY DEFINER porque tiene que leer instructor_certifications, que desde
-- la 093 solo lee la propia persona o administracion: una politica de courses
-- no puede depender de que quien escribe pueda leer la tabla de al lado.

CREATE OR REPLACE FUNCTION public.puede_ensenar(p_specialty_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    p_specialty_id IS NOT NULL
    AND (
      public.es_admin_actual()
      OR EXISTS (
        SELECT 1
          FROM public.instructor_certifications c
         WHERE c.user_id = auth.uid()
           AND c.specialty_id = p_specialty_id
           AND c.status = 'aprobada'
           AND c.revoked_at IS NULL
           AND (c.expires_at IS NULL OR c.expires_at > now())
      )
    );
$$;

COMMENT ON FUNCTION public.puede_ensenar(uuid) IS
  'Cierto si la sesion actual puede enseñar esa especialidad: administracion, o con una certificacion aprobada, no retirada y no caducada EN ESA especialidad. Estar verificado en una no habilita en las demas, que es justo lo que la hace util.';

REVOKE ALL ON FUNCTION public.puede_ensenar(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.puede_ensenar(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.puede_ensenar(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.puede_ensenar(uuid) TO service_role;

-- =====================================================
-- 2. El trigger de publicacion la usa
-- =====================================================
-- Se reescribe entero el de la 089 —que es donde vive la regla de status— y se
-- le añade la puerta de la especialidad. Lo demas queda igual, incluidas las
-- conversiones a texto que la 089 tuvo que arreglar porque status es un enum.

CREATE OR REPLACE FUNCTION public.controlar_publicacion_de_cursos()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  SOLO_ADMIN constant text[] := ARRAY['published', 'rejected'];
  v_especialidad text;
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

    -- LA PUERTA NUEVA: enviar a revision exige poder enseñar ESA especialidad.
    --
    -- Se comprueba aqui y no al crear el curso a proposito: escribir un borrador
    -- de algo que aun no dominas es legitimo, y hasta es el camino normal para
    -- prepararse. Lo que no es legitimo es pedir que se publique.
    IF NEW.status::text = 'pending_review' THEN
      IF NEW.specialty_id IS NULL THEN
        RAISE EXCEPTION
          'Este curso no tiene especialidad asignada: clasificalo antes de enviarlo a revision.'
          USING ERRCODE = '42501';
      END IF;

      -- VALVULA: si algun dia se quiere dejar pasar mientras la especialidad no
      -- tenga ningun instructor verificado, la condicion seria
      --   IF NOT public.puede_ensenar(NEW.specialty_id)
      --      AND EXISTS (SELECT 1 FROM public.instructor_certifications
      --                   WHERE specialty_id = NEW.specialty_id AND status = 'aprobada')
      -- Hoy NO se hace: una regla que se apaga sola mientras no se cumple no es
      -- una regla.
      IF NOT public.puede_ensenar(NEW.specialty_id) THEN
        SELECT e.nombre INTO v_especialidad
          FROM public.instructor_specialties e
         WHERE e.id = NEW.specialty_id;

        RAISE EXCEPTION
          'Para enviar a revision un curso de "%" hace falta estar verificado en esa especialidad. Puedes pedirlo en Mi verificacion.',
          coalesce(v_especialidad, 'esa especialidad')
          USING ERRCODE = '42501';
      END IF;
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
  'Gobierna courses.status y courses.review_status. Desde la 098 tambien exige, para enviar a revision, que quien lo hace pueda enseñar la especialidad del curso: estar verificado en una no habilita en las demas. Las comparaciones de status van con ::text porque la columna es el enum public.course_status.';

-- El trigger ya existe desde la 088; se rehace por si esta migracion corre
-- sobre una base donde no quedo.
DROP TRIGGER IF EXISTS trg_controlar_publicacion ON public.courses;

CREATE TRIGGER trg_controlar_publicacion
  BEFORE INSERT OR UPDATE ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION public.controlar_publicacion_de_cursos();

-- =====================================================
-- 3. La prueba, dentro de la propia migracion
-- =====================================================
-- Suplantando sesiones con request.jwt.claims, que es de donde lee auth.uid().
-- Comprueba las tres cosas que importan: sin verificacion no pasa, con la
-- verificacion de OTRA especialidad tampoco, y con la correcta si.

DO $prueba$
DECLARE
  v_usuario uuid;
  v_esp_a   uuid;   -- ethereum-contratos
  v_esp_b   uuid;   -- bitcoin-fundamentos
  v_curso   uuid;
  v_cert    uuid;
  v_slug    text := 'prueba-098-borrar-' || extract(epoch from clock_timestamp())::bigint;
BEGIN
  SELECT id INTO v_usuario FROM public.users WHERE role = 'instructor' ORDER BY created_at LIMIT 1;
  IF v_usuario IS NULL THEN
    SELECT id INTO v_usuario FROM public.users WHERE role <> 'admin' ORDER BY created_at LIMIT 1;
  END IF;
  SELECT id INTO v_esp_a FROM public.instructor_specialties WHERE slug = 'ethereum-contratos';
  SELECT id INTO v_esp_b FROM public.instructor_specialties WHERE slug = 'bitcoin-fundamentos';

  IF v_usuario IS NULL OR v_esp_a IS NULL OR v_esp_b IS NULL THEN
    RAISE EXCEPTION 'La prueba necesita un usuario no admin y las especialidades de la 090.';
  END IF;

  -- Un curso de usar y tirar, suyo, en borrador y de ethereum-contratos
  INSERT INTO public.courses (title, slug, description, level, is_free, status, instructor_id, specialty_id)
  VALUES ('PRUEBA-098-BORRAR', v_slug, 'Curso de prueba de la 098. Se borra en esta transaccion.',
          'beginner', true, 'draft', v_usuario, v_esp_a)
  RETURNING id INTO v_curso;

  -- Nos hacemos pasar por esa persona
  PERFORM set_config('request.jwt.claims',
                     json_build_object('sub', v_usuario, 'role', 'authenticated')::text, true);

  IF auth.uid() IS DISTINCT FROM v_usuario THEN
    RAISE EXCEPTION 'La prueba no puede suplantar la sesion: auth.uid() devuelve %.',
      coalesce(auth.uid()::text, 'NULL');
  END IF;

  -- 1. Sin ninguna verificacion: no puede enviar a revision
  BEGIN
    UPDATE public.courses SET status = 'pending_review' WHERE id = v_curso;
    RAISE EXCEPTION 'PRUEBA 1 FALLIDA: envio a revision sin estar verificado.';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'PRUEBA 1  sin verificacion no puede enviar a revision       PASA';
  END;

  -- 2. Con la verificacion de OTRA especialidad: tampoco
  PERFORM set_config('request.jwt.claims', '', true);
  INSERT INTO public.instructor_certifications
    (user_id, specialty_id, certification_number, status, issued_at)
  VALUES (v_usuario, v_esp_b, 'PRUEBA-098-B', 'aprobada', now())
  RETURNING id INTO v_cert;
  PERFORM set_config('request.jwt.claims',
                     json_build_object('sub', v_usuario, 'role', 'authenticated')::text, true);

  BEGIN
    UPDATE public.courses SET status = 'pending_review' WHERE id = v_curso;
    RAISE EXCEPTION 'PRUEBA 2 FALLIDA: la verificacion de otra especialidad le sirvio.';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'PRUEBA 2  la verificacion de OTRA especialidad no sirve     PASA';
  END;

  -- 3. Con la correcta: si
  PERFORM set_config('request.jwt.claims', '', true);
  UPDATE public.instructor_certifications SET specialty_id = v_esp_a WHERE id = v_cert;
  PERFORM set_config('request.jwt.claims',
                     json_build_object('sub', v_usuario, 'role', 'authenticated')::text, true);

  UPDATE public.courses SET status = 'pending_review' WHERE id = v_curso;
  IF (SELECT status::text FROM public.courses WHERE id = v_curso) <> 'pending_review' THEN
    RAISE EXCEPTION 'PRUEBA 3 FALLIDA: con la verificacion correcta no llego a pending_review.';
  END IF;
  RAISE NOTICE 'PRUEBA 3  con la verificacion correcta si puede             PASA';

  -- 4. Y publicar sigue siendo solo de administracion
  BEGIN
    UPDATE public.courses SET status = 'draft' WHERE id = v_curso;
    UPDATE public.courses SET status = 'published' WHERE id = v_curso;
    RAISE EXCEPTION 'PRUEBA 4 FALLIDA: un instructor verificado pudo publicar.';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'PRUEBA 4  estar verificado NO habilita a publicar          PASA';
  END;

  -- 5. Una caducada no vale
  PERFORM set_config('request.jwt.claims', '', true);
  UPDATE public.courses SET status = 'draft' WHERE id = v_curso;
  UPDATE public.instructor_certifications
     SET expires_at = now() - interval '1 day' WHERE id = v_cert;
  PERFORM set_config('request.jwt.claims',
                     json_build_object('sub', v_usuario, 'role', 'authenticated')::text, true);

  BEGIN
    UPDATE public.courses SET status = 'pending_review' WHERE id = v_curso;
    RAISE EXCEPTION 'PRUEBA 5 FALLIDA: una certificacion caducada le sirvio.';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'PRUEBA 5  una certificacion caducada no vale               PASA';
  END;

  -- Limpieza, ya sin suplantar a nadie
  PERFORM set_config('request.jwt.claims', '', true);
  DELETE FROM public.instructor_certifications WHERE id = v_cert;
  DELETE FROM public.courses WHERE id = v_curso;
  RAISE NOTICE 'Filas de prueba borradas. Las cinco pruebas pasan.';
END
$prueba$;

COMMIT;

-- ============================================================================
-- VERIFICACION
-- ============================================================================

SELECT
  to_regprocedure('public.puede_ensenar(uuid)') IS NOT NULL                     AS funcion_creada,

  has_function_privilege('authenticated', 'public.puede_ensenar(uuid)', 'EXECUTE')
                                                                                AS auth_puede_consultarla,
  has_function_privilege('anon', 'public.puede_ensenar(uuid)', 'EXECUTE')        AS anon_puede_consultarla,

  -- Que el trigger la usa de verdad, y no solo que existe
  pg_get_functiondef('public.controlar_publicacion_de_cursos()'::regprocedure)
    ILIKE '%puede_ensenar%'                                                     AS el_trigger_la_usa,
  pg_get_functiondef('public.controlar_publicacion_de_cursos()'::regprocedure)
    ILIKE '%pending_review%'                                                    AS vigila_el_envio_a_revision,

  EXISTS (SELECT 1 FROM pg_trigger
           WHERE tgrelid = 'public.courses'::regclass
             AND tgname = 'trg_controlar_publicacion'
             AND NOT tgisinternal)                                              AS trigger_activo,

  -- Estado, para que se vea el efecto
  (SELECT count(*) FROM public.instructor_certifications WHERE status = 'aprobada')
                                                                                AS certificaciones_aprobadas,
  (SELECT count(*) FROM public.courses WHERE status = 'published')               AS publicados,
  (SELECT count(*) FROM public.courses WHERE status = 'pending_review')          AS en_revision,
  (SELECT count(*) FROM public.courses WHERE specialty_id IS NULL
     AND status = 'published')                                                  AS publicados_sin_especialidad,
  (SELECT count(*) FROM public.courses WHERE title = 'PRUEBA-098-BORRAR')        AS filas_de_prueba_que_quedan,

  CASE
    WHEN to_regprocedure('public.puede_ensenar(uuid)') IS NOT NULL
     AND has_function_privilege('authenticated', 'public.puede_ensenar(uuid)', 'EXECUTE')
     AND NOT has_function_privilege('anon', 'public.puede_ensenar(uuid)', 'EXECUTE')
     AND pg_get_functiondef('public.controlar_publicacion_de_cursos()'::regprocedure)
           ILIKE '%puede_ensenar%'
     AND EXISTS (SELECT 1 FROM pg_trigger
                  WHERE tgrelid = 'public.courses'::regclass
                    AND tgname = 'trg_controlar_publicacion'
                    AND NOT tgisinternal)
     AND (SELECT count(*) FROM public.courses WHERE title = 'PRUEBA-098-BORRAR') = 0
      THEN 'TODO CORRECTO'
    ELSE 'REVISAR: mira las columnas de esta misma fila'
  END                                                                           AS veredicto;

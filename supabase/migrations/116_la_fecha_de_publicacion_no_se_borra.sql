-- ============================================================================
-- MIGRACION 116: published_at significa «se publico alguna vez», y no se borra
--
-- LO QUE MEDI, Y POR QUE ESTO ES URGENTE
-- Las migraciones 114 y 115 preguntan las dos por `published_at IS NOT NULL` para
-- saber si un curso estuvo publicado alguna vez. Es deliberado: si preguntaran por
-- `status = 'published'`, bastaria con cambiar la descripcion —que devuelve el curso
-- a pending_review— para recalificarlo mientras esta ahi.
--
-- Pues bien, con una sesion de instructor de verdad y por PostgREST:
--
--   1. con published_at puesta, cambiar specialty_id  ->  42501, bloqueado  (bien)
--   2. UPDATE courses SET published_at = NULL          ->  ACEPTADO
--   3. y entonces, cambiar specialty_id                ->  PASA
--
-- Un UPDATE de una columna apaga las dos protecciones. Y no hace falta ni eso: la
-- ruta /api/instructor/courses/[id]/status ya lo hacia sola, porque al pasar un
-- curso publicado a 'draft' ponia published_at = NULL. El instructor puede poner su
-- propio curso en draft (medido), asi que el atajo estaba a un clic.
--
-- Y HAY MAS: LA FECHA FALTABA EN LOS DIEZ CURSOS PUBLICADOS
-- Censo del 01/10/2026: 15 cursos, 10 con status = 'published', y **0 con
-- published_at puesta**. Es decir, las dos protecciones no protegian nada en
-- produccion. Hoy no expone el contenido a nadie ajeno —los diez cursos son del
-- admin, que es a quien los triggers dejan pasar de todas formas—, pero el dia que
-- publique el primer instructor real habrian estado apagadas sin que se notara.
--
-- El motivo del hueco: lib/admin/actions.ts publicaba poniendo status y nada mas.
-- Eso se arregla en la misma PR.
--
-- QUE FECHA SE PONE EN EL RELLENO
-- `created_at`. La fecha real de publicacion no se guardo nunca, y created_at es la
-- unica cota inferior que existe: un curso no se pudo publicar antes de crearse. Lo
-- que decide las protecciones es que deje de ser NULL. Nadie muestra published_at al
-- publico: solo lo leen las comprobaciones de permiso y la pantalla del instructor.
--
-- LAS TRES REGLAS DEL TRIGGER
--   · Nadie con sesion puede poner published_at a NULL una vez puesta. Ni el admin:
--     borrarla destruye la prueba en la que se apoyan dos protecciones, y para
--     retirar un curso del catalogo esta `status`, que es lo que significa eso.
--   · Quien no es admin no puede cambiarla en absoluto.
--   · El admin si puede cambiarla a otra fecha, para corregir un error.
--   · Sin sesion (auth.uid() IS NULL: el editor SQL, las migraciones y el cliente
--     de servicio) no se toca nada. Mismo criterio que la 089, la 098, la 114 y la
--     115.
--
-- NO BORRA NI UNA FILA. Es reejecutable. Y se prueba a si misma.
-- ============================================================================

BEGIN;

-- =====================================================
-- 1. El relleno
-- =====================================================

UPDATE public.courses
SET published_at = created_at
WHERE status = 'published'
  AND published_at IS NULL;

-- =====================================================
-- 2. El trigger
-- =====================================================

CREATE OR REPLACE FUNCTION public.la_fecha_de_publicacion_no_se_borra()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  -- Sin identidad en la sesion: service_role, el editor SQL y las migraciones.
  IF v_uid IS NULL THEN
    RETURN NEW;
  END IF;

  -- Nada que mirar si no cambia.
  IF NEW.published_at IS NOT DISTINCT FROM OLD.published_at THEN
    RETURN NEW;
  END IF;

  -- La primera vez se puede poner.
  IF OLD.published_at IS NULL THEN
    RETURN NEW;
  END IF;

  -- Ya estaba puesta. A NULL no vuelve, y aqui no se hace excepcion con la
  -- administracion: lo que retira un curso del catalogo es `status`, no borrar la
  -- prueba de que estuvo publicado.
  IF NEW.published_at IS NULL THEN
    RAISE EXCEPTION
      'La fecha de publicacion de un curso no se borra: es la prueba de que estuvo publicado, y de ella dependen las protecciones del curso. Para retirarlo del catalogo cambia su estado.'
      USING ERRCODE = '42501';
  END IF;

  -- Cambiarla por otra solo la administracion, para corregir un error.
  IF NOT public.es_admin_actual() THEN
    RAISE EXCEPTION
      'La fecha de publicacion de un curso no la cambia su autor. Pidelo a la administracion.'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END
$fn$;

COMMENT ON FUNCTION public.la_fecha_de_publicacion_no_se_borra() IS
  'published_at significa «se publico alguna vez» y es la condicion de los triggers de la 114 y la 115. Impide volverla a NULL con una sesion abierta, y que quien no es admin la cambie. Se midio que el autor podia ponerla a NULL por PostgREST y recalificar su curso publicado acto seguido.';

REVOKE ALL ON FUNCTION public.la_fecha_de_publicacion_no_se_borra() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_la_fecha_de_publicacion_no_se_borra ON public.courses;
CREATE TRIGGER trg_la_fecha_de_publicacion_no_se_borra
  BEFORE UPDATE OF published_at ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION public.la_fecha_de_publicacion_no_se_borra();

-- =====================================================
-- La prueba
-- =====================================================
-- Se impersona con set_config, que es de donde lee auth.uid().

DO $prueba$
DECLARE
  v_instructor uuid;
  v_admin      uuid;
  v_esp        uuid;
  v_otraEsp    uuid;
  v_curso      uuid;
  v_real       uuid;
  v_fecha      timestamptz;
  v_n          integer;
BEGIN
  -- 1. El relleno no dejo ningun curso publicado sin fecha
  SELECT count(*) INTO v_n FROM public.courses
    WHERE status = 'published' AND published_at IS NULL;
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'PRUEBA 1 FALLIDA: quedan % cursos publicados sin published_at.', v_n;
  END IF;
  RAISE NOTICE 'PRUEBA 1  ningun curso publicado se queda sin fecha            PASA';

  -- Alguien que NO sea admin por ninguna de las dos vias que mira es_admin_actual():
  -- users.role y una fila activa en user_roles. Si se colara un admin aqui, las
  -- pruebas 2, 3 y 4 pasarian por el camino equivocado y dirian que falla algo que
  -- funciona.
  SELECT u.id INTO v_instructor
  FROM public.users u
  WHERE u.role <> 'admin'
    AND NOT EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = u.id AND ur.role::text = 'admin' AND ur.is_active
    )
  ORDER BY u.created_at
  LIMIT 1;

  SELECT id INTO v_admin FROM public.users WHERE role = 'admin' ORDER BY created_at LIMIT 1;
  SELECT id INTO v_esp FROM public.instructor_specialties WHERE slug = 'ethereum-contratos';
  SELECT id INTO v_otraEsp FROM public.instructor_specialties WHERE slug = 'fiscalidad';

  IF v_instructor IS NULL OR v_admin IS NULL OR v_esp IS NULL OR v_otraEsp IS NULL THEN
    RAISE EXCEPTION 'La prueba necesita alguien que no sea admin, un admin y las dos especialidades. no_admin=% admin=% A=% B=%',
      v_instructor, v_admin, v_esp, v_otraEsp;
  END IF;

  -- Un curso de usar y tirar, publicado, del no-admin
  INSERT INTO public.courses
    (slug, title, level, status, is_free, is_certifiable,
     instructor_id, owner_id, specialty_id, published_at)
  VALUES ('prueba-116-' || floor(random() * 1000000)::text, 'PRUEBA 116', 'beginner',
          'published', true, false, v_instructor, v_instructor, v_esp, now())
  RETURNING id, published_at INTO v_curso, v_fecha;

  PERFORM set_config('request.jwt.claims',
                     json_build_object('sub', v_instructor::text, 'role', 'authenticated')::text,
                     true);

  -- 2. Quien no es admin no la borra
  BEGIN
    UPDATE public.courses SET published_at = NULL WHERE id = v_curso;
    RAISE EXCEPTION 'PRUEBA 2 FALLIDA: el autor borro published_at.';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'PRUEBA 2  el autor no borra published_at                       PASA';
  END;

  -- 3. Ni la cambia por otra
  BEGIN
    UPDATE public.courses SET published_at = now() - interval '1 year' WHERE id = v_curso;
    RAISE EXCEPTION 'PRUEBA 3 FALLIDA: el autor cambio published_at por otra fecha.';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'PRUEBA 3  ni la cambia por otra fecha                          PASA';
  END;

  -- 4. Y con la fecha intacta, la 114 sigue bloqueando. Es la razon de todo esto.
  BEGIN
    UPDATE public.courses SET specialty_id = v_otraEsp WHERE id = v_curso;
    RAISE EXCEPTION 'PRUEBA 4 FALLIDA: el autor recalifico su curso publicado.';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'PRUEBA 4  con la fecha intacta, la 114 bloquea                 PASA';
  END;

  -- 5. El admin tampoco la borra
  PERFORM set_config('request.jwt.claims',
                     json_build_object('sub', v_admin::text, 'role', 'authenticated')::text,
                     true);
  BEGIN
    UPDATE public.courses SET published_at = NULL WHERE id = v_curso;
    RAISE EXCEPTION 'PRUEBA 5 FALLIDA: la administracion borro published_at.';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'PRUEBA 5  la administracion tampoco la borra                   PASA';
  END;

  -- 6. Pero si puede corregirla
  UPDATE public.courses SET published_at = v_fecha - interval '1 day' WHERE id = v_curso;
  IF (SELECT published_at FROM public.courses WHERE id = v_curso) <> v_fecha - interval '1 day' THEN
    RAISE EXCEPTION 'PRUEBA 6 FALLIDA: la administracion no pudo corregir la fecha.';
  END IF;
  RAISE NOTICE 'PRUEBA 6  la administracion si la corrige por otra fecha       PASA';

  PERFORM set_config('request.jwt.claims', '', true);

  -- 7. Sin sesion se puede todo: las migraciones siguen pudiendo arreglar cosas
  UPDATE public.courses SET published_at = NULL WHERE id = v_curso;
  IF (SELECT published_at FROM public.courses WHERE id = v_curso) IS NOT NULL THEN
    RAISE EXCEPTION 'PRUEBA 7 FALLIDA: sin sesion no se pudo poner a NULL.';
  END IF;
  RAISE NOTICE 'PRUEBA 7  sin sesion si se puede (migraciones y servicio)      PASA';

  -- 8. En un curso publicado DE VERDAD, la 114 ya muerde para quien no es admin.
  --    Esto no cambia ninguna fila: tiene que fallar.
  SELECT id INTO v_real FROM public.courses
    WHERE status = 'published' AND published_at IS NOT NULL AND id <> v_curso
    ORDER BY created_at LIMIT 1;
  IF v_real IS NULL THEN
    RAISE NOTICE 'PRUEBA 8  no hay ningun curso publicado real que comprobar    SE SALTA';
  ELSE
    PERFORM set_config('request.jwt.claims',
                       json_build_object('sub', v_instructor::text, 'role', 'authenticated')::text,
                       true);
    BEGIN
      UPDATE public.courses SET jurisdiccion = 'MX' WHERE id = v_real;
      RAISE EXCEPTION 'PRUEBA 8 FALLIDA: se pudo recalificar un curso publicado real.';
    EXCEPTION WHEN insufficient_privilege THEN
      RAISE NOTICE 'PRUEBA 8  los cursos publicados reales ya estan protegidos   PASA';
    END;
    PERFORM set_config('request.jwt.claims', '', true);
  END IF;

  -- 9. Limpieza
  DELETE FROM public.courses WHERE id = v_curso;
  SELECT count(*) INTO v_n FROM public.courses WHERE slug LIKE 'prueba-116-%';
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'PRUEBA 9 FALLIDA: quedan % cursos de prueba.', v_n;
  END IF;
  RAISE NOTICE 'PRUEBA 9  no queda ningun curso de prueba                      PASA';

  RAISE NOTICE 'Las nueve pruebas pasan.';
END
$prueba$;

COMMIT;

-- ============================================================================
-- VERIFICACION
-- ============================================================================

SELECT
  (SELECT count(*) FROM public.courses WHERE status = 'published')                      AS cursos_publicados,
  (SELECT count(*) FROM public.courses WHERE status = 'published' AND published_at IS NULL) AS publicados_sin_fecha,
  (SELECT count(*) FROM public.courses WHERE published_at IS NOT NULL)                  AS con_fecha_de_publicacion,
  (SELECT count(*) FROM pg_trigger
    WHERE tgname = 'trg_la_fecha_de_publicacion_no_se_borra'
      AND tgrelid = 'public.courses'::regclass)                                         AS trigger_instalado,
  (SELECT count(*) FROM pg_proc
    WHERE proname = 'la_fecha_de_publicacion_no_se_borra'
      AND proconfig::text LIKE '%search_path%')                                         AS funcion_con_search_path,
  (SELECT count(*) FROM public.courses WHERE slug LIKE 'prueba-116-%')                  AS cursos_de_prueba_restantes,
  CASE
    WHEN (SELECT count(*) FROM public.courses WHERE status = 'published' AND published_at IS NULL) = 0
     AND (SELECT count(*) FROM pg_trigger
           WHERE tgname = 'trg_la_fecha_de_publicacion_no_se_borra'
             AND tgrelid = 'public.courses'::regclass) = 1
     AND (SELECT count(*) FROM pg_proc
           WHERE proname = 'la_fecha_de_publicacion_no_se_borra'
             AND proconfig::text LIKE '%search_path%') = 1
     AND (SELECT count(*) FROM public.courses WHERE slug LIKE 'prueba-116-%') = 0
    THEN 'TODO CORRECTO'
    ELSE 'REVISAR'
  END AS veredicto;

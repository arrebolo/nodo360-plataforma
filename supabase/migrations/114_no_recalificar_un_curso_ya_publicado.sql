-- ============================================================================
-- MIGRACION 114: la clasificacion de un curso publicado no la cambia su autor
--
-- LO QUE MIDIO LA AUDITORIA
-- El trigger de la 030 devuelve un curso publicado a revision cuando cambia
-- cualquiera de NUEVE columnas que lista a mano: title, description,
-- long_description, level, price, is_free, is_premium, thumbnail_url y banner_url.
-- Una lista escrita a mano envejece, y las columnas que llegaron despues no estan.
-- Probado con sesion real de instructor sobre un curso publicado:
--
--     jurisdiccion  ES -> MX             SIGUE PUBLICADO
--     specialty_id -> otra especialidad  SIGUE PUBLICADO
--
-- Es decir: alguien verificado solo en Fiscalidad·ES podia dejar publicado un
-- curso que dice aplicar a Mexico, y mover un curso a una especialidad en la que
-- no esta verificado. Sin revision y sin dejar rastro. Eso vacia por dentro
-- puede_ensenar() y toda la jurisdiccion de la 109.
--
-- LO QUE HACE ESTA MIGRACION, Y LO QUE NO
-- Cierra ese agujero por lo mas corto: esas dos columnas no las cambia su autor
-- una vez el curso se ha publicado. Solo la administracion.
--
-- NO sustituye al trigger de la 030 ni arregla su lista manual: eso es el sistema
-- de versiones pendientes, que va aparte y con diseño revisado antes de escribirlo.
-- Esto es el tapon inmediato, y se dice para que nadie lo confunda con la solucion.
--
-- LA CONDICION ES «SE HA PUBLICADO ALGUNA VEZ», no «esta publicado ahora»
-- (published_at IS NOT NULL). Si fuera «status = published», bastaria con cambiar
-- la descripcion —que devuelve el curso a pending_review por la 030— y recalificarlo
-- mientras esta ahi. Un borrador que nunca se publico se reclasifica libremente,
-- que es el flujo normal de quien esta preparando un curso.
--
-- NO BORRA NI UNA FILA. Es reejecutable. Y se prueba a si misma con una sesion de
-- instructor de verdad.
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.la_clasificacion_de_un_publicado_no_se_toca()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  -- Sin identidad en la sesion: service_role, el editor SQL y las migraciones.
  -- Es el mismo criterio que la 089 y la 098.
  IF v_uid IS NULL THEN
    RETURN NEW;
  END IF;

  IF public.es_admin_actual() THEN
    RETURN NEW;
  END IF;

  -- Un curso que nunca se publico se reclasifica libremente.
  IF OLD.published_at IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.specialty_id IS DISTINCT FROM OLD.specialty_id THEN
    RAISE EXCEPTION
      'La especialidad de un curso ya publicado no se cambia desde aqui: habilitaria a enseñar algo que no se ha verificado. Pidelo a la administracion.'
      USING ERRCODE = '42501';
  END IF;

  IF NEW.jurisdiccion IS DISTINCT FROM OLD.jurisdiccion THEN
    RAISE EXCEPTION
      'La jurisdiccion de un curso ya publicado no se cambia desde aqui: el curso dice a que pais aplica su normativa, y cambiarlo sin revision es publicar otra cosa. Pidelo a la administracion.'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END
$fn$;

COMMENT ON FUNCTION public.la_clasificacion_de_un_publicado_no_se_toca() IS
  'Impide que el autor cambie specialty_id o jurisdiccion de un curso que se ha publicado alguna vez. Solo la administracion. Tapon inmediato del agujero que midio la auditoria: el trigger de la 030 lista nueve columnas a mano y esas dos no estan, asi que el cambio se quedaba publicado sin revision. La condicion es published_at IS NOT NULL y no status = published, porque cambiar la descripcion manda el curso a pending_review y ahi se podria recalificar.';

REVOKE ALL ON FUNCTION public.la_clasificacion_de_un_publicado_no_se_toca() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_clasificacion_de_un_publicado ON public.courses;
CREATE TRIGGER trg_clasificacion_de_un_publicado
  BEFORE UPDATE OF specialty_id, jurisdiccion ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION public.la_clasificacion_de_un_publicado_no_se_toca();

-- =====================================================
-- La prueba, con una sesion de instructor de verdad
-- =====================================================
-- Se impersona con set_config, que es de donde lee auth.uid(). Preguntar por el
-- privilegio no es escribir: se escribe.

DO $prueba$
DECLARE
  v_instructor uuid;
  v_espA       uuid;
  v_espB       uuid;
  v_curso      uuid;
  v_n          integer;
BEGIN
  SELECT id INTO v_instructor FROM public.users WHERE role = 'instructor' ORDER BY created_at LIMIT 1;
  IF v_instructor IS NULL THEN
    SELECT id INTO v_instructor FROM public.users WHERE role = 'student' ORDER BY created_at LIMIT 1;
  END IF;
  SELECT id INTO v_espA FROM public.instructor_specialties WHERE slug = 'ethereum-contratos';
  SELECT id INTO v_espB FROM public.instructor_specialties WHERE slug = 'fiscalidad';

  IF v_instructor IS NULL OR v_espA IS NULL OR v_espB IS NULL THEN
    RAISE EXCEPTION 'La prueba necesita una persona y las dos especialidades. persona=% A=% B=%',
      v_instructor, v_espA, v_espB;
  END IF;

  -- Un curso de usar y tirar, ya publicado.
  INSERT INTO public.courses
    (slug, title, level, status, is_free, is_certifiable,
     instructor_id, owner_id, specialty_id, published_at)
  VALUES ('prueba-114-' || floor(random() * 1000000)::text, 'PRUEBA 114', 'beginner',
          'published', true, false, v_instructor, v_instructor, v_espA, now())
  RETURNING id INTO v_curso;

  PERFORM set_config('request.jwt.claims',
                     json_build_object('sub', v_instructor::text, 'role', 'authenticated')::text,
                     true);

  -- 1. La especialidad, rechazada
  BEGIN
    UPDATE public.courses SET specialty_id = v_espB WHERE id = v_curso;
    RAISE EXCEPTION 'PRUEBA 1 FALLIDA: el autor pudo cambiar la especialidad de un curso publicado.';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'PRUEBA 1  el autor no cambia la especialidad de un publicado   PASA';
  END;

  -- 2. La jurisdiccion, rechazada
  BEGIN
    UPDATE public.courses SET jurisdiccion = 'MX' WHERE id = v_curso;
    RAISE EXCEPTION 'PRUEBA 2 FALLIDA: el autor pudo cambiar la jurisdiccion de un curso publicado.';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'PRUEBA 2  el autor no cambia la jurisdiccion de un publicado   PASA';
  END;

  -- 3. Pero lo demas sigue pudiendo editarlo: esto no bloquea el curso
  UPDATE public.courses SET description = 'editada en la prueba 114' WHERE id = v_curso;
  IF (SELECT description FROM public.courses WHERE id = v_curso) <> 'editada en la prueba 114' THEN
    RAISE EXCEPTION 'PRUEBA 3 FALLIDA: el autor no pudo editar la descripcion.';
  END IF;
  RAISE NOTICE 'PRUEBA 3  el autor sigue editando lo demas                      PASA';

  -- 4. Y AUN EN pending_review, que es donde lo deja la 030, tampoco puede
  --    recalificarlo. Es el motivo de usar published_at y no status.
  BEGIN
    UPDATE public.courses SET jurisdiccion = 'MX' WHERE id = v_curso;
    RAISE EXCEPTION 'PRUEBA 4 FALLIDA: pudo recalificarlo estando en pending_review.';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'PRUEBA 4  tampoco en pending_review tras haberse publicado    PASA';
  END;

  PERFORM set_config('request.jwt.claims', '', true);

  -- 5. La administracion si puede: aqui auth.uid() es nulo, que es el caso del
  --    cliente de servicio y del editor SQL.
  UPDATE public.courses SET specialty_id = v_espB, jurisdiccion = 'MX' WHERE id = v_curso;
  IF (SELECT specialty_id FROM public.courses WHERE id = v_curso) <> v_espB THEN
    RAISE EXCEPTION 'PRUEBA 5 FALLIDA: la administracion no pudo recalificarlo.';
  END IF;
  RAISE NOTICE 'PRUEBA 5  la administracion si puede recalificarlo              PASA';

  -- 6. Un curso NUNCA publicado se reclasifica libremente
  UPDATE public.courses SET published_at = NULL, status = 'draft' WHERE id = v_curso;
  PERFORM set_config('request.jwt.claims',
                     json_build_object('sub', v_instructor::text, 'role', 'authenticated')::text,
                     true);
  UPDATE public.courses SET specialty_id = v_espA, jurisdiccion = NULL WHERE id = v_curso;
  IF (SELECT specialty_id FROM public.courses WHERE id = v_curso) <> v_espA THEN
    RAISE EXCEPTION 'PRUEBA 6 FALLIDA: no se pudo reclasificar un borrador nunca publicado.';
  END IF;
  RAISE NOTICE 'PRUEBA 6  un borrador nunca publicado si se reclasifica         PASA';
  PERFORM set_config('request.jwt.claims', '', true);

  -- 7. Limpieza
  DELETE FROM public.courses WHERE id = v_curso;
  SELECT count(*) INTO v_n FROM public.courses WHERE slug LIKE 'prueba-114-%';
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'PRUEBA 7 FALLIDA: quedan % cursos de prueba.', v_n;
  END IF;
  RAISE NOTICE 'PRUEBA 7  no queda ningun curso de prueba                       PASA';

  RAISE NOTICE 'Las siete pruebas pasan.';
END
$prueba$;

COMMIT;

-- ============================================================================
-- VERIFICACION
-- ============================================================================

SELECT
  EXISTS (SELECT 1 FROM pg_trigger
           WHERE tgname = 'trg_clasificacion_de_un_publicado'
             AND tgrelid = 'public.courses'::regclass)                          AS trigger_activo,

  -- Que sea BEFORE UPDATE OF y no de toda la fila: asi no se mete en updates que
  -- no tocan esas dos columnas.
  (SELECT count(*) FROM pg_trigger t
    WHERE t.tgname = 'trg_clasificacion_de_un_publicado'
      AND t.tgrelid = 'public.courses'::regclass
      AND t.tgattr <> '')                                                       AS acotado_a_columnas,

  (SELECT count(*) FROM public.courses)                                         AS cursos,
  (SELECT count(*) FROM public.courses WHERE published_at IS NOT NULL)           AS publicados_alguna_vez,
  (SELECT count(*) FROM public.courses WHERE slug LIKE 'prueba-114-%')           AS cursos_de_prueba_que_quedan,

  -- El trigger de la 030 sigue donde estaba: esto no lo sustituye
  EXISTS (SELECT 1 FROM pg_trigger
           WHERE tgname = 'trigger_course_modification'
             AND tgrelid = 'public.courses'::regclass)                          AS trigger_030_intacto,

  CASE
    WHEN EXISTS (SELECT 1 FROM pg_trigger
                  WHERE tgname = 'trg_clasificacion_de_un_publicado'
                    AND tgrelid = 'public.courses'::regclass)
     AND (SELECT count(*) FROM public.courses WHERE slug LIKE 'prueba-114-%') = 0
      THEN 'TODO CORRECTO'
    ELSE 'REVISAR: mira las columnas de esta misma fila'
  END                                                                           AS veredicto;

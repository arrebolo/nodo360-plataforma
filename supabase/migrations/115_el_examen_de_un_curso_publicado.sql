-- ============================================================================
-- MIGRACION 115: el examen de un curso ya publicado no lo cambia su autor
--
-- QUE ES EL EXAMEN FINAL DE UN CURSO, MEDIDO
-- Son las filas de `quiz_questions` colgadas de los modulos del curso. Asi lo lee
-- el alumno en /cursos/[slug]/quiz-final y asi lo corrige lib/quiz/checkCourseQuiz.ts.
-- `course_quizzes` NO es el examen: la 078 la dejo PARADA el 28/09/2026 y no
-- aparece en ninguna linea de codigo de la aplicacion, solo en los tipos generados.
-- Esta migracion no la toca.
--
-- LO QUE SE MIDIO CON UNA SESION DE INSTRUCTOR DE VERDAD
-- (scripts/medir-permisos-del-examen-final.mts y -2.mts)
--
--   SELECT question, options, order_index...   se puede
--   SELECT correct_answer, explanation         42501: cerradas a todo el mundo
--   INSERT en un modulo de SU curso en borrador     se puede        <- ya funcionaba
--   UPDATE y DELETE de SU pregunta en borrador      1 fila cada uno <- ya funcionaba
--   INSERT en el curso de OTRO instructor            42501
--   UPDATE y DELETE de una pregunta AJENA            0 filas
--   INSERT en SU PROPIO curso YA PUBLICADO           SE ACEPTA      <- el agujero
--
-- Es decir: la RLS ya deja al instructor hacer el examen de su borrador y ya le
-- impide tocar el de otro. Lo que no impide nadie es cambiar el examen de un curso
-- publicado, con alumnos dentro a los que se esta corrigiendo con el. Se puede
-- añadir una pregunta, cambiar la respuesta correcta de una existente o borrar la
-- mitad del examen, y surte efecto en el siguiente intento. Sin revision.
--
-- `correct_answer` y `explanation` cerradas a todos los roles es DELIBERADO y se
-- queda: la clave del examen no pasa por PostgREST. El editor las ve porque
-- /api/admin/quiz responde con el cliente de servicio.
--
-- LO QUE CIERRA ESTA MIGRACION, Y LO QUE NO
-- El trigger tapa la via de PostgREST con un token de usuario, que es alcanzable
-- directamente con la clave anon. NO tapa la via del cliente de servicio, donde
-- auth.uid() es nulo: eso lo hace la comprobacion de /api/admin/quiz, que va en la
-- misma PR y que hasta hoy no comprobaba NI de quien es el curso NI si esta
-- publicado. Las dos mitades hacen falta; ninguna sobra.
--
-- Cuando exista la copia publicada (docs/DISENO-COPIA-PUBLICADA.md), editar el
-- examen de trabajo dejara de ser peligroso porque al alumno se le servira y se le
-- corregira con la copia. Este trigger se revisa entonces, no antes.
--
-- NO BORRA NI UNA FILA. Es reejecutable. Y se prueba a si misma.
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.el_examen_de_un_publicado_no_se_toca()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  v_uid       uuid := auth.uid();
  v_publicado timestamptz;
  v_mod_nuevo uuid;
  v_mod_viejo uuid;
BEGIN
  -- Sin identidad en la sesion: service_role, el editor SQL y las migraciones.
  -- Mismo criterio que la 089, la 098 y la 114.
  IF v_uid IS NULL THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;

  IF public.es_admin_actual() THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;

  -- SE MIRAN LOS DOS MODULOS, EL DE ANTES Y EL DE DESPUES.
  -- Un UPDATE puede mover una pregunta de un modulo a otro. Si solo se mirara
  -- NEW, se podria sacar una pregunta del examen de un curso publicado
  -- mandandola a un borrador; y si solo se mirara OLD, se podria meter una
  -- pregunta nueva en un curso publicado creandola en un borrador y moviendola.
  --
  -- Cada uno se lee solo en la operacion en la que existe: en un BEFORE INSERT no
  -- se toca OLD, y en un BEFORE DELETE no se toca NEW. Un uuid nulo no iguala a
  -- ninguna fila, asi que el WHERE se encarga del resto sin ramas.
  IF TG_OP <> 'DELETE' THEN v_mod_nuevo := NEW.module_id; END IF;
  IF TG_OP <> 'INSERT' THEN v_mod_viejo := OLD.module_id; END IF;

  SELECT max(c.published_at) INTO v_publicado
  FROM public.modules m
  JOIN public.courses c ON c.id = m.course_id
  WHERE m.id = v_mod_nuevo OR m.id = v_mod_viejo;

  IF v_publicado IS NOT NULL THEN
    RAISE EXCEPTION
      'El examen de un curso ya publicado no se cambia desde aqui: hay alumnos a los que se esta corrigiendo con el. Pidelo a la administracion.'
      USING ERRCODE = '42501';
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END
$fn$;

COMMENT ON FUNCTION public.el_examen_de_un_publicado_no_se_toca() IS
  'Impide que el autor añada, cambie o borre preguntas de quiz_questions en un curso que se ha publicado alguna vez. Solo la administracion. Mira el modulo de OLD y el de NEW para que no se pueda entrar ni salir moviendo una pregunta. La condicion es published_at IS NOT NULL, no status = published, por lo mismo que la 114: cambiar la descripcion manda el curso a pending_review y ahi se podria editar el examen.';

REVOKE ALL ON FUNCTION public.el_examen_de_un_publicado_no_se_toca() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_examen_de_un_publicado ON public.quiz_questions;
CREATE TRIGGER trg_examen_de_un_publicado
  BEFORE INSERT OR UPDATE OR DELETE ON public.quiz_questions
  FOR EACH ROW
  EXECUTE FUNCTION public.el_examen_de_un_publicado_no_se_toca();

-- =====================================================
-- La prueba
-- =====================================================
-- Se impersona con set_config, que es de donde lee auth.uid(). Lo que se prueba
-- aqui es el TRIGGER; que la RLS ya dejaba al instructor hacer el examen de su
-- borrador y ya le impedia tocar el de otro se midio aparte, con sesion real, en
-- scripts/medir-permisos-del-examen-final.mts.

DO $prueba$
DECLARE
  v_instructor uuid;
  v_esp        uuid;
  v_borrador   uuid;
  v_publicado  uuid;
  v_modB       uuid;
  v_modP       uuid;
  v_pregB      uuid;
  v_pregP      uuid;
  v_n          integer;
BEGIN
  SELECT id INTO v_instructor FROM public.users WHERE role = 'instructor' ORDER BY created_at LIMIT 1;
  IF v_instructor IS NULL THEN
    SELECT id INTO v_instructor FROM public.users WHERE role = 'student' ORDER BY created_at LIMIT 1;
  END IF;
  SELECT id INTO v_esp FROM public.instructor_specialties WHERE slug = 'ethereum-contratos';

  IF v_instructor IS NULL OR v_esp IS NULL THEN
    RAISE EXCEPTION 'La prueba necesita una persona y la especialidad. persona=% esp=%', v_instructor, v_esp;
  END IF;

  -- Dos cursos de usar y tirar del mismo autor: uno nunca publicado y uno publicado.
  INSERT INTO public.courses
    (slug, title, level, status, is_free, is_certifiable, instructor_id, owner_id, specialty_id)
  VALUES ('prueba-115-borrador-' || floor(random() * 1000000)::text, 'PRUEBA 115 borrador', 'beginner',
          'draft', true, false, v_instructor, v_instructor, v_esp)
  RETURNING id INTO v_borrador;

  INSERT INTO public.courses
    (slug, title, level, status, is_free, is_certifiable, instructor_id, owner_id, specialty_id, published_at)
  VALUES ('prueba-115-publicado-' || floor(random() * 1000000)::text, 'PRUEBA 115 publicado', 'beginner',
          'published', true, false, v_instructor, v_instructor, v_esp, now())
  RETURNING id INTO v_publicado;

  INSERT INTO public.modules (course_id, title, order_index) VALUES (v_borrador, 'm borrador', 1)
    RETURNING id INTO v_modB;
  INSERT INTO public.modules (course_id, title, order_index) VALUES (v_publicado, 'm publicado', 1)
    RETURNING id INTO v_modP;

  -- Una pregunta en cada uno, creada sin sesion (que es como entra el contenido
  -- por migracion). Si el trigger las rechazara aqui, la migracion ya no seguiria.
  INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, order_index)
  VALUES (v_modP, 'PRUEBA 115 en publicado', '["a","b"]'::jsonb, 0, 1) RETURNING id INTO v_pregP;

  PERFORM set_config('request.jwt.claims',
                     json_build_object('sub', v_instructor::text, 'role', 'authenticated')::text,
                     true);

  -- 1. En su curso en borrador SI puede crear el examen. Es el punto del encargo.
  INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, order_index)
  VALUES (v_modB, 'PRUEBA 115 en borrador', '["a","b"]'::jsonb, 0, 1) RETURNING id INTO v_pregB;
  RAISE NOTICE 'PRUEBA 1  el autor crea el examen de su borrador                PASA';

  -- 2. Y lo edita
  UPDATE public.quiz_questions SET question = 'PRUEBA 115 editada' WHERE id = v_pregB;
  IF (SELECT question FROM public.quiz_questions WHERE id = v_pregB) <> 'PRUEBA 115 editada' THEN
    RAISE EXCEPTION 'PRUEBA 2 FALLIDA: el autor no pudo editar su propia pregunta.';
  END IF;
  RAISE NOTICE 'PRUEBA 2  el autor edita la pregunta de su borrador             PASA';

  -- 3. En el curso publicado NO puede añadir
  BEGIN
    INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, order_index)
    VALUES (v_modP, 'PRUEBA 115 colada', '["a","b"]'::jsonb, 0, 2);
    RAISE EXCEPTION 'PRUEBA 3 FALLIDA: el autor añadio una pregunta a un curso publicado.';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'PRUEBA 3  no añade preguntas a un curso publicado              PASA';
  END;

  -- 4. Ni cambiar la respuesta correcta de una existente
  BEGIN
    UPDATE public.quiz_questions SET correct_answer = 1 WHERE id = v_pregP;
    RAISE EXCEPTION 'PRUEBA 4 FALLIDA: el autor cambio la respuesta correcta de un examen publicado.';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'PRUEBA 4  no cambia la clave de un examen publicado            PASA';
  END;

  -- 5. Ni borrarla
  BEGIN
    DELETE FROM public.quiz_questions WHERE id = v_pregP;
    RAISE EXCEPTION 'PRUEBA 5 FALLIDA: el autor borro una pregunta de un curso publicado.';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'PRUEBA 5  no borra preguntas de un curso publicado             PASA';
  END;

  -- 6. Ni meterla en el publicado MOVIENDOLA desde el borrador. Es la razon de
  --    mirar los dos modulos y no solo NEW.
  BEGIN
    UPDATE public.quiz_questions SET module_id = v_modP WHERE id = v_pregB;
    RAISE EXCEPTION 'PRUEBA 6 FALLIDA: colo una pregunta en el publicado moviendola desde el borrador.';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'PRUEBA 6  no cuela preguntas moviendolas de modulo             PASA';
  END;

  -- 7. Ni sacarlas del publicado moviendolas al borrador
  BEGIN
    UPDATE public.quiz_questions SET module_id = v_modB WHERE id = v_pregP;
    RAISE EXCEPTION 'PRUEBA 7 FALLIDA: saco una pregunta del examen publicado moviendola.';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'PRUEBA 7  no saca preguntas del publicado moviendolas          PASA';
  END;

  PERFORM set_config('request.jwt.claims', '', true);

  -- 8. La administracion si puede: aqui auth.uid() es nulo, que es el caso del
  --    cliente de servicio y del editor SQL.
  UPDATE public.quiz_questions SET correct_answer = 1 WHERE id = v_pregP;
  IF (SELECT correct_answer FROM public.quiz_questions WHERE id = v_pregP) <> 1 THEN
    RAISE EXCEPTION 'PRUEBA 8 FALLIDA: la administracion no pudo corregir el examen publicado.';
  END IF;
  RAISE NOTICE 'PRUEBA 8  la administracion si corrige un examen publicado      PASA';

  -- 9. Limpieza, y que no quede nada
  DELETE FROM public.quiz_questions WHERE module_id IN (v_modB, v_modP);
  DELETE FROM public.modules WHERE id IN (v_modB, v_modP);
  DELETE FROM public.courses WHERE id IN (v_borrador, v_publicado);
  SELECT count(*) INTO v_n FROM public.courses WHERE slug LIKE 'prueba-115-%';
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'PRUEBA 9 FALLIDA: quedan % cursos de prueba.', v_n;
  END IF;
  RAISE NOTICE 'PRUEBA 9  no queda ningun curso de prueba                       PASA';

  RAISE NOTICE 'Las nueve pruebas pasan.';
END
$prueba$;

COMMIT;

-- ============================================================================
-- VERIFICACION
-- ============================================================================

SELECT
  (SELECT count(*) FROM pg_trigger
    WHERE tgname = 'trg_examen_de_un_publicado'
      AND tgrelid = 'public.quiz_questions'::regclass)            AS trigger_instalado,
  (SELECT count(*) FROM pg_proc
    WHERE proname = 'el_examen_de_un_publicado_no_se_toca')       AS funcion_instalada,
  (SELECT count(*) FROM pg_proc
    WHERE proname = 'el_examen_de_un_publicado_no_se_toca'
      AND proconfig::text LIKE '%search_path%')                   AS con_search_path,
  (SELECT count(*) FROM public.quiz_questions)                    AS preguntas_totales,
  (SELECT count(*) FROM public.courses WHERE slug LIKE 'prueba-115-%') AS cursos_de_prueba_restantes,
  CASE
    WHEN (SELECT count(*) FROM pg_trigger
           WHERE tgname = 'trg_examen_de_un_publicado'
             AND tgrelid = 'public.quiz_questions'::regclass) = 1
     AND (SELECT count(*) FROM pg_proc
           WHERE proname = 'el_examen_de_un_publicado_no_se_toca'
             AND proconfig::text LIKE '%search_path%') = 1
     AND (SELECT count(*) FROM public.courses WHERE slug LIKE 'prueba-115-%') = 0
    THEN 'TODO CORRECTO'
    ELSE 'REVISAR'
  END AS veredicto;

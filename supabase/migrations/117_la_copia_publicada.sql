-- ============================================================================
-- MIGRACION 117: la copia publicada de un curso  (PR 1 de 4)
--
-- QUE RESUELVE
-- Hoy `courses`, `modules`, `lessons` y `quiz_questions` son a la vez el borrador
-- del instructor y lo que lee el publico. Un instructor con un curso publicado edita
-- y el cambio sale al aire en el siguiente render, sin que nadie lo haya revisado.
-- El trigger de la 030 intenta frenarlo, pero lista NUEVE columnas a mano:
-- jurisdiccion, specialty_id, subtitle, learning_objectives, requirements,
-- target_audience y el CONTENIDO DE LAS LECCIONES no estan en esa lista.
--
-- La copia publicada invierte el problema: el trabajo del instructor deja de ser
-- visible por definicion, y publicar es un acto explicito.
--
-- LO QUE MEDI ANTES DE ESCRIBIR ESTO (01/10/2026)
--
--   volumen que se copia      10 cursos publicados, 27 modulos, 81 lecciones,
--                             243 preguntas. Cabe de sobra en una transaccion.
--   course_quizzes            0 filas y 0 referencias en el codigo: la 078 la dejo
--                             PARADA y tenia razon. NO se le hace espejo. El examen
--                             final son las preguntas de los modulos.
--   borrar una leccion        se lleva user_progress Y xp_events, las dos CASCADE
--   borrar un modulo          se lleva quiz_questions (CASCADE); y queda bloqueado
--                             si hay un certificado de modulo (SET NULL + el CHECK
--                             que exige module_id)
--   borrar un curso           SE LLEVA LOS CERTIFICADOS (CASCADE) y los xp_events
--   progreso                  113 filas, 59 lecciones distintas, y 21 de esas
--                             lecciones NO son de un curso publicado
--   certificados emitidos     17
--
-- Lo de los certificados es lo mas grave: borrar un curso borraba las credenciales
-- que emitio, y /verificar/[codigo] dejaba de encontrarlas.
--
-- QUE HACE ESTA MIGRACION, Y QUE NO
--
--   SI  crea las cuatro tablas espejo, con las MISMAS claves primarias
--   SI  crea publicar_curso(), que es como se publica, y el trigger que la llama
--   SI  repunta las claves ajenas de progreso, XP y certificados al espejo, sin
--       cascada: borrar contenido de trabajo ya no puede borrar datos de nadie
--   SI  rellena el espejo con lo publicado y con todo lo que alguien ya toco
--
--   NO  cambia ni una lectura de la aplicacion. Nadie lee el espejo todavia, asi que
--       nace CERRADO: RLS activada sin politicas y sin GRANT a anon ni a
--       authenticated. Las lecturas pasan al espejo en la PR 3, con sus permisos y
--       probando cada superficie una por una. Abrir una tabla que nadie lee todavia
--       seria abrirla a ciegas.
--   NO  retira el trigger de la 030. Eso es la PR 4.
--
-- EL ORDEN ES LA PARTE PELIGROSA
-- Si el codigo pasara al espejo antes de que esto este aplicado en produccion, el
-- catalogo se queda en blanco. Mismo patron que la 106 con la #275. Por eso el
-- relleno va aqui y el cambio de lecturas en la PR 3, que no se mergea hasta que
-- esta este aplicada y comprobada.
--
-- POR QUE TABLAS ESPEJO Y NO UN SNAPSHOT EN jsonb
-- Las lecturas publicas son consultas PostgREST con filtros, embeds y order. Con
-- tablas espejo, el cambio en cada sitio es el nombre de la tabla. Con jsonb, cada
-- lectura pasa a ser codigo de aplicacion —el sitemap, llms.txt y las imagenes OG
-- incluidos— y las claves ajenas del progreso dejan de servir.
--
-- NO BORRA NI UNA FILA. Es reejecutable. Y se prueba a si misma.
-- ============================================================================

BEGIN;

-- =====================================================
-- 1. LAS CUATRO TABLAS ESPEJO
-- =====================================================
-- LIKE copia columnas, tipos, NOT NULL y defectos. No copia indices ni claves: se
-- ponen a mano, que es lo que se quiere, porque los del espejo no son los mismos.
--
-- Las tres columnas que añade el espejo:
--   publicado_el  cuando se copio por ultima vez
--   version       sube en cada publicacion del curso
--   retirada_el   NULL = viva. Una fila publicada NUNCA SE BORRA: se retira. Es lo
--                 que permite que el progreso y los certificados sigan cuadrando
--                 cuando el instructor borra una leccion en su copia de trabajo.

CREATE TABLE IF NOT EXISTS public.courses_publicados (
  LIKE public.courses INCLUDING DEFAULTS
);
CREATE TABLE IF NOT EXISTS public.modules_publicados (
  LIKE public.modules INCLUDING DEFAULTS
);
CREATE TABLE IF NOT EXISTS public.lessons_publicadas (
  LIKE public.lessons INCLUDING DEFAULTS
);
CREATE TABLE IF NOT EXISTS public.quiz_questions_publicadas (
  LIKE public.quiz_questions INCLUDING DEFAULTS
);

DO $anadir$
DECLARE
  v_tabla text;
BEGIN
  FOREACH v_tabla IN ARRAY ARRAY['courses_publicados', 'modules_publicados',
                           'lessons_publicadas', 'quiz_questions_publicadas']
  LOOP
    EXECUTE format('ALTER TABLE public.%I
      ADD COLUMN IF NOT EXISTS publicado_el timestamptz NOT NULL DEFAULT now(),
      ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1,
      ADD COLUMN IF NOT EXISTS retirada_el timestamptz', v_tabla);

    -- La clave primaria es la MISMA que en la tabla de trabajo: el uuid de la
    -- leccion es su identidad y no cambia nunca. Reordenar es cambiar order_index,
    -- que el progreso no mira.
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conrelid = format('public.%I', v_tabla)::regclass AND contype = 'p'
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ADD PRIMARY KEY (id)', v_tabla);
    END IF;
  END LOOP;
END
$anadir$;

-- Claves ajenas DENTRO del espejo: el espejo tiene que ser coherente por si mismo,
-- porque es lo que va a leer el publico.
ALTER TABLE public.modules_publicados
  DROP CONSTRAINT IF EXISTS modules_publicados_course_fk,
  ADD CONSTRAINT modules_publicados_course_fk
    FOREIGN KEY (course_id) REFERENCES public.courses_publicados(id) ON DELETE RESTRICT;

ALTER TABLE public.lessons_publicadas
  DROP CONSTRAINT IF EXISTS lessons_publicadas_course_fk,
  ADD CONSTRAINT lessons_publicadas_course_fk
    FOREIGN KEY (course_id) REFERENCES public.courses_publicados(id) ON DELETE RESTRICT,
  DROP CONSTRAINT IF EXISTS lessons_publicadas_module_fk,
  ADD CONSTRAINT lessons_publicadas_module_fk
    FOREIGN KEY (module_id) REFERENCES public.modules_publicados(id) ON DELETE RESTRICT;

ALTER TABLE public.quiz_questions_publicadas
  DROP CONSTRAINT IF EXISTS quiz_questions_publicadas_module_fk,
  ADD CONSTRAINT quiz_questions_publicadas_module_fk
    FOREIGN KEY (module_id) REFERENCES public.modules_publicados(id) ON DELETE RESTRICT;

-- Indices para como se va a leer. El unico de los slugs es PARCIAL —solo sobre las
-- filas vivas— porque una fila retirada conserva su slug y no debe impedir que otra
-- lo use; y a la vez garantiza que `.single()` por slug encuentre una sola.
CREATE UNIQUE INDEX IF NOT EXISTS courses_publicados_slug_vivo
  ON public.courses_publicados (slug) WHERE retirada_el IS NULL;
CREATE INDEX IF NOT EXISTS modules_publicados_curso_orden
  ON public.modules_publicados (course_id, order_index);
CREATE UNIQUE INDEX IF NOT EXISTS lessons_publicadas_slug_vivo
  ON public.lessons_publicadas (course_id, slug) WHERE retirada_el IS NULL;
CREATE INDEX IF NOT EXISTS lessons_publicadas_modulo_orden
  ON public.lessons_publicadas (module_id, order_index);
CREATE INDEX IF NOT EXISTS quiz_questions_publicadas_modulo_orden
  ON public.quiz_questions_publicadas (module_id, order_index);

-- NACEN CERRADAS. Nadie las lee todavia: la PR 3 les da los permisos cuando mueva
-- cada lectura, probando una por una. RLS activada sin politicas deniega todo a
-- anon y a authenticated; el dueño (migraciones) y service_role no pasan por RLS.
ALTER TABLE public.courses_publicados        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules_publicados        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons_publicadas        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions_publicadas ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.courses_publicados        FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.modules_publicados        FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.lessons_publicadas        FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.quiz_questions_publicadas FROM PUBLIC, anon, authenticated;

COMMENT ON TABLE public.courses_publicados IS
  'La copia publicada de un curso (117). Lo que lee el publico. Las filas no se borran nunca: se retiran con retirada_el, porque el progreso y los certificados apuntan aqui.';
COMMENT ON TABLE public.lessons_publicadas IS
  'La copia publicada de una leccion (117). Es el REGISTRO DE REFERENCIA del progreso: user_progress.lesson_id y xp_events.lesson_id apuntan aqui, sin cascada. Borrar la leccion de trabajo ya no se lleva el progreso de nadie.';

-- =====================================================
-- 2. QUE COLUMNAS SE COPIAN
-- =====================================================
-- Se calculan del catalogo, no de una lista escrita a mano. Una lista a mano es
-- exactamente lo que hizo que la 030 se quedara corta: nueve columnas, y las que
-- llegaron despues no estan.
--
-- Y SI EL ESPEJO LE FALTA UNA COLUMNA DEL ORIGEN, NO SE PUBLICA: se levanta. Lo
-- contrario seria publicar cursos a los que les falta contenido sin que nadie se
-- enterara, que es la clase de fallo que esto viene a cerrar.

CREATE OR REPLACE FUNCTION public.columnas_a_copiar(p_origen text, p_espejo text)
RETURNS text[]
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  v_faltan text;
  v_cols   text[];
BEGIN
  SELECT string_agg(o.column_name, ', ' ORDER BY o.ordinal_position) INTO v_faltan
  FROM information_schema.columns o
  WHERE o.table_schema = 'public'
    AND o.table_name = p_origen
    AND o.is_generated = 'NEVER'
    AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns e
      WHERE e.table_schema = 'public' AND e.table_name = p_espejo
        AND e.column_name = o.column_name
    );

  IF v_faltan IS NOT NULL THEN
    RAISE EXCEPTION
      'A la copia publicada %I le faltan columnas de %I: %. Añadelas al espejo antes de publicar.',
      p_espejo, p_origen, v_faltan
      USING ERRCODE = '42703';
  END IF;

  SELECT array_agg(o.column_name ORDER BY o.ordinal_position) INTO v_cols
  FROM information_schema.columns o
  WHERE o.table_schema = 'public'
    AND o.table_name = p_origen
    AND o.is_generated = 'NEVER';

  RETURN v_cols;
END
$fn$;

COMMENT ON FUNCTION public.columnas_a_copiar(text, text) IS
  'Las columnas que se copian de una tabla de trabajo a su espejo, sacadas del catalogo. Se levanta si al espejo le falta alguna: publicar un curso al que le falta contenido sin avisar es el fallo que la copia publicada viene a cerrar.';

REVOKE ALL ON FUNCTION public.columnas_a_copiar(text, text) FROM PUBLIC;

-- =====================================================
-- 3. publicar_curso()
-- =====================================================

-- DOS FUNCIONES, Y LA DIFERENCIA IMPORTA.
--
-- La interna hace el trabajo y NO comprueba el rol. No se le da EXECUTE a nadie:
-- solo la pueden llamar el dueño y las funciones SECURITY DEFINER de aqui —es decir,
-- el trigger—. La publica comprueba que quien llama es administracion y delega.
--
-- POR QUE, Y ES UN FALLO QUE SE COLO EN LA PRIMERA VERSION DE ESTA MIGRACION
-- El trigger corre en la sesion de quien cambia el estado, asi que auth.uid() es esa
-- persona. Y un instructor PUEDE pasar su propio curso publicado a draft o archived:
-- esta en INSTRUCTOR_ALLOWED_STATUSES de /api/instructor/courses/[id]/status. Con la
-- comprobacion de rol dentro de la funcion que llama el trigger, esa operacion
-- legitima se levantaba con 42501, el UPDATE se deshacia entero y la API devolvia
-- 500. El instructor no podia despublicar su curso, y el mensaje no decia por que.
--
-- Mezclar «quien puede pedir esto» con «como se hace esto» es lo que lo causo. Aqui
-- van separados: el permiso en la puerta, el trabajo dentro.
CREATE OR REPLACE FUNCTION public.publicar_curso_interno(p_course_id uuid)
RETURNS TABLE (version integer, modulos integer, lecciones integer,
               preguntas integer, retiradas integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  v_version   integer;
  v_cols      text[];
  v_lista     text;
  v_set       text;
  v_n         integer;
  v_retiradas integer := 0;
BEGIN
  -- Sin comprobacion de rol a proposito: la hace la envoltura publica. Esta no la
  -- puede llamar nadie a quien no se le haya dado EXECUTE, y no se le da a nadie.
  IF NOT EXISTS (SELECT 1 FROM public.courses WHERE id = p_course_id) THEN
    RAISE EXCEPTION 'No existe el curso %.', p_course_id USING ERRCODE = '23503';
  END IF;

  -- Alias `cp`, no `c`: `version` es a la vez columna del espejo y columna de salida
  -- de esta funcion, asi que la referencia va siempre cualificada y con un alias que
  -- no se parezca a nada declarado.
  SELECT coalesce(max(cp.version), 0) + 1 INTO v_version
  FROM public.courses_publicados cp WHERE cp.id = p_course_id;

  -- ── El curso ──────────────────────────────────────────────────────────────
  v_cols  := public.columnas_a_copiar('courses', 'courses_publicados');
  v_lista := (SELECT string_agg(quote_ident(col.nombre), ', ') FROM unnest(v_cols) AS col(nombre));
  v_set   := (SELECT string_agg(format('%I = EXCLUDED.%I', col.nombre, col.nombre), ', ')
              FROM unnest(v_cols) AS col(nombre) WHERE col.nombre <> 'id');
  EXECUTE format(
    'INSERT INTO public.courses_publicados (%s, publicado_el, version, retirada_el)
     SELECT %s, now(), $2, NULL FROM public.courses WHERE id = $1
     ON CONFLICT (id) DO UPDATE SET %s, publicado_el = now(), version = $2, retirada_el = NULL',
    v_lista, v_lista, v_set)
  USING p_course_id, v_version;

  -- ── Los modulos ───────────────────────────────────────────────────────────
  v_cols  := public.columnas_a_copiar('modules', 'modules_publicados');
  v_lista := (SELECT string_agg(quote_ident(col.nombre), ', ') FROM unnest(v_cols) AS col(nombre));
  v_set   := (SELECT string_agg(format('%I = EXCLUDED.%I', col.nombre, col.nombre), ', ')
              FROM unnest(v_cols) AS col(nombre) WHERE col.nombre <> 'id');
  EXECUTE format(
    'INSERT INTO public.modules_publicados (%s, publicado_el, version, retirada_el)
     SELECT %s, now(), $2, NULL FROM public.modules WHERE course_id = $1
     ON CONFLICT (id) DO UPDATE SET %s, publicado_el = now(), version = $2, retirada_el = NULL',
    v_lista, v_lista, v_set)
  USING p_course_id, v_version;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  modulos := v_n;

  -- ── Las lecciones ─────────────────────────────────────────────────────────
  v_cols  := public.columnas_a_copiar('lessons', 'lessons_publicadas');
  v_lista := (SELECT string_agg(quote_ident(col.nombre), ', ') FROM unnest(v_cols) AS col(nombre));
  v_set   := (SELECT string_agg(format('%I = EXCLUDED.%I', col.nombre, col.nombre), ', ')
              FROM unnest(v_cols) AS col(nombre) WHERE col.nombre <> 'id');
  EXECUTE format(
    'INSERT INTO public.lessons_publicadas (%s, publicado_el, version, retirada_el)
     SELECT %s, now(), $2, NULL FROM public.lessons WHERE course_id = $1
     ON CONFLICT (id) DO UPDATE SET %s, publicado_el = now(), version = $2, retirada_el = NULL',
    v_lista, v_lista, v_set)
  USING p_course_id, v_version;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  lecciones := v_n;

  -- ── Las preguntas del examen ──────────────────────────────────────────────
  -- Cuelgan del modulo, no del curso: asi las lee el alumno y asi las corrige
  -- lib/quiz/checkCourseQuiz.ts.
  v_cols  := public.columnas_a_copiar('quiz_questions', 'quiz_questions_publicadas');
  v_lista := (SELECT string_agg(quote_ident(col.nombre), ', ') FROM unnest(v_cols) AS col(nombre));
  v_set   := (SELECT string_agg(format('%I = EXCLUDED.%I', col.nombre, col.nombre), ', ')
              FROM unnest(v_cols) AS col(nombre) WHERE col.nombre <> 'id');
  EXECUTE format(
    'INSERT INTO public.quiz_questions_publicadas (%s, publicado_el, version, retirada_el)
     SELECT %s, now(), $2, NULL FROM public.quiz_questions
      WHERE module_id IN (SELECT id FROM public.modules WHERE course_id = $1)
     ON CONFLICT (id) DO UPDATE SET %s, publicado_el = now(), version = $2, retirada_el = NULL',
    v_lista, v_lista, v_set)
  USING p_course_id, v_version;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  preguntas := v_n;

  -- ── Lo que ya no esta, se RETIRA. No se borra. ─────────────────────────────
  -- Aqui esta el punto 2 del diseño: el instructor borra una leccion en su copia de
  -- trabajo y la fila publicada se queda, marcada. El progreso de quien la hizo
  -- sigue apuntando a algo que existe, y el porcentaje se cuenta sobre las vivas.
  UPDATE public.quiz_questions_publicadas e SET retirada_el = now()
  WHERE e.retirada_el IS NULL
    AND e.module_id IN (SELECT id FROM public.modules_publicados WHERE course_id = p_course_id)
    AND NOT EXISTS (SELECT 1 FROM public.quiz_questions o WHERE o.id = e.id);
  GET DIAGNOSTICS v_n = ROW_COUNT;
  v_retiradas := v_retiradas + v_n;

  UPDATE public.lessons_publicadas e SET retirada_el = now()
  WHERE e.retirada_el IS NULL
    AND e.course_id = p_course_id
    AND NOT EXISTS (SELECT 1 FROM public.lessons o WHERE o.id = e.id);
  GET DIAGNOSTICS v_n = ROW_COUNT;
  v_retiradas := v_retiradas + v_n;

  UPDATE public.modules_publicados e SET retirada_el = now()
  WHERE e.retirada_el IS NULL
    AND e.course_id = p_course_id
    AND NOT EXISTS (SELECT 1 FROM public.modules o WHERE o.id = e.id);
  GET DIAGNOSTICS v_n = ROW_COUNT;
  v_retiradas := v_retiradas + v_n;

  version   := v_version;
  retiradas := v_retiradas;
  RETURN NEXT;
END
$fn$;

COMMENT ON FUNCTION public.publicar_curso_interno(uuid) IS
  'El trabajo de publicar la copia, SIN comprobar quien llama. No se le da EXECUTE a nadie: solo el dueño y las funciones SECURITY DEFINER de esta migracion —el trigger—. El permiso lo pone publicar_curso().';

-- Sin GRANT a nadie. Ni a authenticated, ni a service_role: quien tenga que
-- llamarla es el trigger, que es SECURITY DEFINER y corre como el dueño.
REVOKE ALL ON FUNCTION public.publicar_curso_interno(uuid) FROM PUBLIC;

/** La puerta: comprueba el rol y delega. Es la que se llama por RPC. */
CREATE OR REPLACE FUNCTION public.publicar_curso(p_course_id uuid)
RETURNS TABLE (version integer, modulos integer, lecciones integer,
               preguntas integer, retiradas integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
BEGIN
  -- La identidad sale de auth.uid(), nunca de un parametro. Sin sesion son las
  -- migraciones, el editor SQL y el cliente de servicio.
  IF auth.uid() IS NOT NULL AND NOT public.es_admin_actual() THEN
    RAISE EXCEPTION 'Publicar un curso lo hace la administracion.'
      USING ERRCODE = '42501';
  END IF;

  RETURN QUERY SELECT * FROM public.publicar_curso_interno(p_course_id);
END
$fn$;

COMMENT ON FUNCTION public.publicar_curso(uuid) IS
  'Refresca la copia publicada de un curso y devuelve una fila con las cuentas. Lo que ya no esta en las tablas de trabajo se RETIRA, no se borra: el progreso y los certificados apuntan al espejo. Las migraciones de contenido terminan llamandola. Solo la administracion, o sin sesion (migraciones y servicio).';

REVOKE ALL ON FUNCTION public.publicar_curso(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.publicar_curso(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.publicar_curso(uuid) TO service_role;

-- =====================================================
-- 3 bis. retirar_curso_de_la_copia()
-- =====================================================
-- El inverso de publicar, y hace tanta falta como ella: si despublicar o archivar un
-- curso no lo retirara del espejo, en cuanto las lecturas pasen al espejo (PR 3) el
-- curso seguiria en el catalogo con el estado cambiado. Retirar NO BORRA: marca.

CREATE OR REPLACE FUNCTION public.retirar_curso_de_la_copia_interno(p_course_id uuid)
RETURNS TABLE (modulos integer, lecciones integer, preguntas integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  v_n integer;
BEGIN
  -- Sin comprobacion de rol: AQUI ESTABA EL FALLO. Un instructor puede pasar su
  -- propio curso publicado a draft, el trigger llama a esto con su auth.uid(), y
  -- exigir administracion deshacia el UPDATE y devolvia 500.
  UPDATE public.quiz_questions_publicadas SET retirada_el = now()
   WHERE retirada_el IS NULL
     AND module_id IN (SELECT id FROM public.modules_publicados WHERE course_id = p_course_id);
  GET DIAGNOSTICS v_n = ROW_COUNT;
  preguntas := v_n;

  UPDATE public.lessons_publicadas SET retirada_el = now()
   WHERE retirada_el IS NULL AND course_id = p_course_id;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  lecciones := v_n;

  UPDATE public.modules_publicados SET retirada_el = now()
   WHERE retirada_el IS NULL AND course_id = p_course_id;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  modulos := v_n;

  UPDATE public.courses_publicados SET retirada_el = now()
   WHERE retirada_el IS NULL AND id = p_course_id;

  RETURN NEXT;
END
$fn$;

COMMENT ON FUNCTION public.retirar_curso_de_la_copia_interno(uuid) IS
  'El trabajo de retirar la copia, SIN comprobar quien llama. La llama el trigger, que corre en la sesion de quien despublica: puede ser el autor del curso, que no es administracion. Sin EXECUTE para nadie.';

REVOKE ALL ON FUNCTION public.retirar_curso_de_la_copia_interno(uuid) FROM PUBLIC;

/** La puerta: comprueba el rol y delega. Es la que se llama por RPC. */
CREATE OR REPLACE FUNCTION public.retirar_curso_de_la_copia(p_course_id uuid)
RETURNS TABLE (modulos integer, lecciones integer, preguntas integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.es_admin_actual() THEN
    RAISE EXCEPTION 'Retirar un curso del catalogo lo hace la administracion.'
      USING ERRCODE = '42501';
  END IF;

  RETURN QUERY SELECT * FROM public.retirar_curso_de_la_copia_interno(p_course_id);
END
$fn$;

COMMENT ON FUNCTION public.retirar_curso_de_la_copia(uuid) IS
  'Retira del catalogo la copia publicada de un curso, marcando retirada_el. No borra ni una fila: el progreso y los certificados siguen apuntando aqui. Es el inverso de publicar_curso. Llamada directa: solo administracion. El trigger usa la version interna, porque despublicar su propio curso lo puede hacer su autor.';

REVOKE ALL ON FUNCTION public.retirar_curso_de_la_copia(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.retirar_curso_de_la_copia(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.retirar_curso_de_la_copia(uuid) TO service_role;

-- Y un trigger, para que aprobar no pueda olvidarse de publicar.
CREATE OR REPLACE FUNCTION public.al_publicar_refrescar_la_copia()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
BEGIN
  -- LAS INTERNAS, NO LAS PUBLICAS.
  --
  -- Este trigger corre en la sesion de quien cambia el estado, y quien cambia el
  -- estado no siempre es administracion: el autor de un curso publicado puede
  -- pasarlo a draft o a archived. Si llamara a las publicas, esa operacion legitima
  -- se levantaria con 42501 y se desharia el UPDATE entero.
  --
  -- Quien pide publicar por RPC sigue pasando por la puerta: las publicas no
  -- cambian.
  IF NEW.status = 'published' AND OLD.status IS DISTINCT FROM 'published' THEN
    PERFORM public.publicar_curso_interno(NEW.id);
  ELSIF OLD.status = 'published' AND NEW.status IS DISTINCT FROM 'published' THEN
    -- Deja de estar publicado: fuera del catalogo. Marcado, no borrado.
    PERFORM public.retirar_curso_de_la_copia_interno(NEW.id);
  END IF;
  RETURN NULL;
END
$fn$;

COMMENT ON FUNCTION public.al_publicar_refrescar_la_copia() IS
  'Refresca la copia publicada cuando un curso pasa a published, para que aprobar no pueda olvidarse de publicar. SECURITY DEFINER no cambia auth.uid(), asi que la comprobacion de administracion de publicar_curso sigue viendo a quien aprueba de verdad; esta aqui para que escribir en el espejo no dependa de los privilegios de la sesion. Si publicar_curso se levanta —por ejemplo porque al espejo le falta una columna—, la publicacion falla entera: es a proposito, publicar a medias y en silencio es el fallo que esto cierra.';

REVOKE ALL ON FUNCTION public.al_publicar_refrescar_la_copia() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_al_publicar_refrescar_la_copia ON public.courses;
CREATE TRIGGER trg_al_publicar_refrescar_la_copia
  AFTER UPDATE OF status ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION public.al_publicar_refrescar_la_copia();

-- =====================================================
-- 4. EL RELLENO
-- =====================================================
-- Dos partes, y la segunda es la que solo aparecio al medir:
--
--   a) todo lo publicado
--   b) TODO LO QUE ALGUIEN YA TOCO, aunque no este publicado. 59 lecciones tienen
--      progreso y 21 de ellas no son de un curso publicado. Si el espejo no las
--      tuviera, la clave ajena del progreso no se podria ni crear.
--
-- Lo de (b) entra RETIRADO: esta en el registro para que el progreso de esa persona
-- siga cuadrando, pero no es contenido vivo.

DO $relleno$
DECLARE
  v_cols  text[];
  v_lista text;
  r_curso record;
  v_n     integer;
BEGIN
  -- (b) primero los cursos, que son los padres
  v_cols  := public.columnas_a_copiar('courses', 'courses_publicados');
  v_lista := (SELECT string_agg(quote_ident(col.nombre), ', ') FROM unnest(v_cols) AS col(nombre));
  EXECUTE format(
    'INSERT INTO public.courses_publicados (%s, publicado_el, version, retirada_el)
     SELECT %s, now(), 0, now() FROM public.courses o
     WHERE o.published_at IS NOT NULL
        OR o.status = ''published''
        OR o.id IN (SELECT course_id FROM public.certificates)
        OR o.id IN (SELECT course_id FROM public.course_enrollments)
        OR o.id IN (SELECT course_id FROM public.xp_events WHERE course_id IS NOT NULL)
        OR o.id IN (SELECT l.course_id FROM public.lessons l
                     WHERE l.id IN (SELECT lesson_id FROM public.user_progress)
                        OR l.id IN (SELECT lesson_id FROM public.xp_events WHERE lesson_id IS NOT NULL))
        OR o.id IN (SELECT m.course_id FROM public.modules m
                     WHERE m.id IN (SELECT module_id FROM public.certificates WHERE module_id IS NOT NULL)
                        OR m.id IN (SELECT module_id FROM public.quiz_attempts))
     ON CONFLICT (id) DO NOTHING', v_lista, v_lista);
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RAISE NOTICE 'RELLENO  cursos al espejo: %', v_n;

  -- luego los modulos de esos cursos
  v_cols  := public.columnas_a_copiar('modules', 'modules_publicados');
  v_lista := (SELECT string_agg(quote_ident(col.nombre), ', ') FROM unnest(v_cols) AS col(nombre));
  EXECUTE format(
    'INSERT INTO public.modules_publicados (%s, publicado_el, version, retirada_el)
     SELECT %s, now(), 0, now() FROM public.modules o
     WHERE o.course_id IN (SELECT id FROM public.courses_publicados)
     ON CONFLICT (id) DO NOTHING', v_lista, v_lista);
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RAISE NOTICE 'RELLENO  modulos al espejo: %', v_n;

  -- las lecciones
  v_cols  := public.columnas_a_copiar('lessons', 'lessons_publicadas');
  v_lista := (SELECT string_agg(quote_ident(col.nombre), ', ') FROM unnest(v_cols) AS col(nombre));
  EXECUTE format(
    'INSERT INTO public.lessons_publicadas (%s, publicado_el, version, retirada_el)
     SELECT %s, now(), 0, now() FROM public.lessons o
     WHERE o.course_id IN (SELECT id FROM public.courses_publicados)
       AND (o.module_id IS NULL
            OR o.module_id IN (SELECT id FROM public.modules_publicados))
     ON CONFLICT (id) DO NOTHING', v_lista, v_lista);
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RAISE NOTICE 'RELLENO  lecciones al espejo: %', v_n;

  -- y las preguntas
  v_cols  := public.columnas_a_copiar('quiz_questions', 'quiz_questions_publicadas');
  v_lista := (SELECT string_agg(quote_ident(col.nombre), ', ') FROM unnest(v_cols) AS col(nombre));
  EXECUTE format(
    'INSERT INTO public.quiz_questions_publicadas (%s, publicado_el, version, retirada_el)
     SELECT %s, now(), 0, now() FROM public.quiz_questions o
     WHERE o.module_id IN (SELECT id FROM public.modules_publicados)
     ON CONFLICT (id) DO NOTHING', v_lista, v_lista);
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RAISE NOTICE 'RELLENO  preguntas al espejo: %', v_n;

  -- (a) y ahora, cada curso publicado se publica de verdad: eso le pone fecha,
  -- version y le quita la marca de retirada a el y a todo lo suyo.
  -- SOLO status = 'published', y no «published_at IS NOT NULL».
  -- El espejo vivo es el catalogo. Un curso archivado que estuvo publicado alguna vez
  -- tiene published_at puesta —la 116 se encargo de eso— y con esa condicion habria
  -- vuelto al catalogo por la puerta de atras. Las filas de los que no estan
  -- publicados se quedan en el registro, retiradas, para que el progreso y los
  -- certificados de quien paso por ellos sigan cuadrando.
  FOR r_curso IN SELECT id, slug FROM public.courses
           WHERE status = 'published'
           ORDER BY created_at
  LOOP
    PERFORM public.publicar_curso_interno(r_curso.id);
  END LOOP;

  SELECT count(*) INTO v_n FROM public.courses_publicados WHERE retirada_el IS NULL;
  RAISE NOTICE 'RELLENO  cursos vivos en el espejo: %', v_n;
END
$relleno$;

-- =====================================================
-- 5. LAS CLAVES AJENAS DE LA GENTE, AL ESPEJO Y SIN CASCADA
-- =====================================================
-- Esto es el punto 2 del diseño, y es lo que arregla un fallo que ya existia:
--
--   antes                                        ahora
--   user_progress.lesson_id  -> lessons CASCADE   -> lessons_publicadas RESTRICT
--   xp_events.lesson_id      -> lessons CASCADE   -> lessons_publicadas RESTRICT
--   xp_events.course_id      -> courses CASCADE   -> courses_publicados RESTRICT
--   certificates.course_id   -> courses CASCADE   -> courses_publicados RESTRICT
--   certificates.module_id   -> modules SET NULL  -> modules_publicados RESTRICT
--
-- El nombre de la clave vieja no se adivina: se busca en el catalogo y se quita por
-- su nombre. Una lista de nombres recordados es justo lo que falla.

DO $claves$
DECLARE
  r_vieja  record;
  r_fila   record;
  v_nombre text;
BEGIN
  FOR r_fila IN
    SELECT * FROM (VALUES
      ('user_progress', 'lesson_id', 'lessons',  'lessons_publicadas'),
      ('xp_events',     'lesson_id', 'lessons',  'lessons_publicadas'),
      ('xp_events',     'course_id', 'courses',  'courses_publicados'),
      ('certificates',  'course_id', 'courses',  'courses_publicados'),
      ('certificates',  'module_id', 'modules',  'modules_publicados')
    ) AS t(tabla, columna, destino_viejo, destino_nuevo)
  LOOP
    FOR r_vieja IN
      SELECT con.conname
      FROM pg_constraint con
      JOIN pg_class      cl  ON cl.oid  = con.conrelid
      JOIN pg_class      fcl ON fcl.oid = con.confrelid
      JOIN pg_attribute  att ON att.attrelid = con.conrelid
                            AND att.attnum = con.conkey[1]
      WHERE con.contype = 'f'
        AND cl.relnamespace = 'public'::regnamespace
        AND cl.relname  = r_fila.tabla
        AND fcl.relname = r_fila.destino_viejo
        AND att.attname = r_fila.columna
        AND array_length(con.conkey, 1) = 1
    LOOP
      EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT %I', r_fila.tabla, r_vieja.conname);
      RAISE NOTICE 'CLAVES   %.% : quitada la vieja %', r_fila.tabla, r_fila.columna, r_vieja.conname;
    END LOOP;

    v_nombre := format('%s_%s_espejo_fk', r_fila.tabla, r_fila.columna);
    EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I', r_fila.tabla, v_nombre);
    EXECUTE format(
      'ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (%I)
         REFERENCES public.%I(id) ON DELETE RESTRICT',
      r_fila.tabla, v_nombre, r_fila.columna, r_fila.destino_nuevo);
    RAISE NOTICE 'CLAVES   %.% -> %  RESTRICT', r_fila.tabla, r_fila.columna, r_fila.destino_nuevo;
  END LOOP;
END
$claves$;

-- =====================================================
-- 5 bis. Y LAS MATRICULAS, SIN CASCADA
-- =====================================================
-- course_enrollments.course_id NO se repunta al espejo: eso cambiaria quien puede
-- matricularse y no es lo que toca decidir aqui. Pero sigue apuntando a `courses` con
-- ON DELETE CASCADE, asi que borrar un curso borra las matriculas de quienes estaban
-- dentro. Se queda donde esta y se le quita la cascada: borrar un curso con alumnos
-- matriculados pasa a estar impedido, que es lo correcto —primero se mira a quien
-- afecta, y luego se decide—.

DO $matriculas$
DECLARE
  r_clave record;
BEGIN
  FOR r_clave IN
    SELECT con.conname, con.confdeltype
    FROM pg_constraint con
    JOIN pg_class     cl  ON cl.oid  = con.conrelid
    JOIN pg_class     fcl ON fcl.oid = con.confrelid
    JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = con.conkey[1]
    WHERE con.contype = 'f'
      AND cl.relnamespace = 'public'::regnamespace
      AND cl.relname  = 'course_enrollments'
      AND fcl.relname = 'courses'
      AND att.attname = 'course_id'
      AND array_length(con.conkey, 1) = 1
  LOOP
    RAISE NOTICE 'MATRICULAS  clave actual %: ON DELETE %', r_clave.conname,
      CASE r_clave.confdeltype WHEN 'c' THEN 'CASCADE' WHEN 'r' THEN 'RESTRICT'
                         WHEN 'n' THEN 'SET NULL' WHEN 'a' THEN 'NO ACTION'
                         ELSE r_clave.confdeltype::text END;
    EXECUTE format('ALTER TABLE public.course_enrollments DROP CONSTRAINT %I', r_clave.conname);
  END LOOP;

  ALTER TABLE public.course_enrollments
    DROP CONSTRAINT IF EXISTS course_enrollments_course_id_sin_cascada,
    ADD CONSTRAINT course_enrollments_course_id_sin_cascada
      FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE RESTRICT;
  RAISE NOTICE 'MATRICULAS  course_enrollments.course_id -> courses  RESTRICT';
END
$matriculas$;

-- =====================================================
-- LA PRUEBA
-- =====================================================

DO $prueba$
DECLARE
  v_curso      uuid;
  v_modulo     uuid;
  v_leccion    uuid;
  v_persona    uuid;
  v_persona_no_admin uuid;
  v_n          integer;
  v_m          integer;
  v_cuentas    record;
  r_curso      record;
BEGIN
  -- 1. Las cuentas del espejo cuadran, curso a curso, para todo lo publicado
  FOR r_curso IN SELECT id, slug FROM public.courses WHERE status = 'published' LOOP
    SELECT count(*) INTO v_n FROM public.modules WHERE course_id = r_curso.id;
    SELECT count(*) INTO v_m FROM public.modules_publicados
      WHERE course_id = r_curso.id AND retirada_el IS NULL;
    IF v_n <> v_m THEN
      RAISE EXCEPTION 'PRUEBA 1 FALLIDA: % tiene % modulos y el espejo % vivos.', r_curso.slug, v_n, v_m;
    END IF;

    SELECT count(*) INTO v_n FROM public.lessons WHERE course_id = r_curso.id;
    SELECT count(*) INTO v_m FROM public.lessons_publicadas
      WHERE course_id = r_curso.id AND retirada_el IS NULL;
    IF v_n <> v_m THEN
      RAISE EXCEPTION 'PRUEBA 1 FALLIDA: % tiene % lecciones y el espejo % vivas.', r_curso.slug, v_n, v_m;
    END IF;

    SELECT count(*) INTO v_n FROM public.quiz_questions
      WHERE module_id IN (SELECT id FROM public.modules WHERE course_id = r_curso.id);
    SELECT count(*) INTO v_m FROM public.quiz_questions_publicadas
      WHERE module_id IN (SELECT id FROM public.modules_publicados WHERE course_id = r_curso.id)
        AND retirada_el IS NULL;
    IF v_n <> v_m THEN
      RAISE EXCEPTION 'PRUEBA 1 FALLIDA: % tiene % preguntas y el espejo % vivas.', r_curso.slug, v_n, v_m;
    END IF;
  END LOOP;
  RAISE NOTICE 'PRUEBA 1  el espejo cuadra con el trabajo en todo lo publicado   PASA';

  -- 2. Ningun curso publicado se quedo fuera
  SELECT count(*) INTO v_n FROM public.courses cu
   WHERE cu.status = 'published'
     AND NOT EXISTS (SELECT 1 FROM public.courses_publicados e
                      WHERE e.id = cu.id AND e.retirada_el IS NULL);
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'PRUEBA 2 FALLIDA: % cursos publicados no estan vivos en el espejo.', v_n;
  END IF;
  RAISE NOTICE 'PRUEBA 2  ningun curso publicado se queda fuera                 PASA';

  -- 3. Y todo lo que alguien ya toco esta en el registro, publicado o no
  SELECT count(*) INTO v_n FROM public.user_progress p
   WHERE NOT EXISTS (SELECT 1 FROM public.lessons_publicadas e WHERE e.id = p.lesson_id);
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'PRUEBA 3 FALLIDA: % filas de progreso sin su leccion en el registro.', v_n;
  END IF;
  SELECT count(*) INTO v_n FROM public.certificates ce
   WHERE NOT EXISTS (SELECT 1 FROM public.courses_publicados e WHERE e.id = ce.course_id);
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'PRUEBA 3 FALLIDA: % certificados sin su curso en el registro.', v_n;
  END IF;
  RAISE NOTICE 'PRUEBA 3  el progreso y los certificados tienen a que apuntar   PASA';

  -- ── Un curso de usar y tirar para las pruebas de borrado ──────────────────
  SELECT id INTO v_persona FROM public.users ORDER BY created_at LIMIT 1;

  -- Alguien que NO sea admin por ninguna de las dos vias que mira es_admin_actual(),
  -- y PREFERIBLEMENTE con rol de instructor.
  --
  -- El orden importa: la prueba 12 actualiza el curso con SET LOCAL ROLE
  -- authenticated, o sea pasando por la RLS. Si la politica de `courses` pide rol de
  -- instructor ademas de ser el autor, con un `student` el UPDATE no afectaria a
  -- ninguna fila y la prueba fallaria por el motivo equivocado. Ademas, un
  -- instructor es exactamente el caso del informe.
  SELECT u.id INTO v_persona_no_admin
  FROM public.users u
  WHERE u.role <> 'admin'
    AND NOT EXISTS (SELECT 1 FROM public.user_roles ur
                     WHERE ur.user_id = u.id AND ur.role::text = 'admin' AND ur.is_active)
  ORDER BY CASE u.role WHEN 'instructor' THEN 0 WHEN 'mentor' THEN 1 ELSE 2 END,
           u.created_at
  LIMIT 1;
  IF v_persona_no_admin IS NULL THEN
    RAISE EXCEPTION 'La prueba 12 necesita una cuenta que no sea admin.';
  END IF;

  INSERT INTO public.courses (slug, title, level, status, is_free, is_certifiable, specialty_id)
  VALUES ('prueba-117-' || floor(random() * 1000000)::text, 'PRUEBA 117', 'beginner',
          'draft', true, false,
          (SELECT id FROM public.instructor_specialties WHERE slug = 'ethereum-contratos'))
  RETURNING id INTO v_curso;

  INSERT INTO public.modules (course_id, title, order_index)
  VALUES (v_curso, 'PRUEBA 117 modulo', 1) RETURNING id INTO v_modulo;

  INSERT INTO public.lessons (module_id, course_id, title, slug, order_index, content)
  VALUES (v_modulo, v_curso, 'PRUEBA 117 leccion',
          'prueba-117-l-' || floor(random() * 1000000)::text, 1, '<p>x</p>')
  RETURNING id INTO v_leccion;

  -- 4. publicar_curso devuelve cuentas de verdad
  SELECT * INTO v_cuentas FROM public.publicar_curso(v_curso);
  IF v_cuentas.modulos <> 1 OR v_cuentas.lecciones <> 1 THEN
    RAISE EXCEPTION 'PRUEBA 4 FALLIDA: publicar_curso dijo % modulos y % lecciones.',
      v_cuentas.modulos, v_cuentas.lecciones;
  END IF;
  RAISE NOTICE 'PRUEBA 4  publicar_curso copia y devuelve las cuentas           PASA';

  -- 5. Con progreso encima, borrar la leccion de trabajo YA NO SE LO LLEVA
  INSERT INTO public.user_progress (user_id, lesson_id, is_completed, completed_at)
  VALUES (v_persona, v_leccion, true, now());

  DELETE FROM public.lessons WHERE id = v_leccion;

  SELECT count(*) INTO v_n FROM public.user_progress
   WHERE user_id = v_persona AND lesson_id = v_leccion;
  IF v_n <> 1 THEN
    RAISE EXCEPTION 'PRUEBA 5 FALLIDA: el progreso desaparecio al borrar la leccion (quedan %).', v_n;
  END IF;
  RAISE NOTICE 'PRUEBA 5  borrar la leccion de trabajo NO borra el progreso     PASA';

  -- 6. Y al republicar, la fila publicada se RETIRA, no se borra
  SELECT * INTO v_cuentas FROM public.publicar_curso(v_curso);
  IF v_cuentas.retiradas < 1 THEN
    RAISE EXCEPTION 'PRUEBA 6 FALLIDA: la leccion que ya no existe no se retiro.';
  END IF;
  SELECT count(*) INTO v_n FROM public.lessons_publicadas
   WHERE id = v_leccion AND retirada_el IS NOT NULL;
  IF v_n <> 1 THEN
    RAISE EXCEPTION 'PRUEBA 6 FALLIDA: la leccion publicada no quedo marcada como retirada.';
  END IF;
  RAISE NOTICE 'PRUEBA 6  la leccion que se fue queda retirada, no borrada      PASA';

  -- 7. El espejo no se borra: intentarlo se levanta por la clave ajena
  BEGIN
    DELETE FROM public.lessons_publicadas WHERE id = v_leccion;
    RAISE EXCEPTION 'PRUEBA 7 FALLIDA: se pudo borrar del registro una leccion con progreso.';
  EXCEPTION WHEN foreign_key_violation THEN
    RAISE NOTICE 'PRUEBA 7  el registro no deja borrar lo que alguien ya hizo    PASA';
  END;

  -- 8. Y borrar el curso de trabajo no se lleva nada de la gente
  DELETE FROM public.user_progress WHERE user_id = v_persona AND lesson_id = v_leccion;
  DELETE FROM public.quiz_questions WHERE module_id = v_modulo;
  DELETE FROM public.modules WHERE id = v_modulo;
  DELETE FROM public.courses WHERE id = v_curso;

  SELECT count(*) INTO v_n FROM public.courses_publicados WHERE id = v_curso;
  IF v_n <> 1 THEN
    RAISE EXCEPTION 'PRUEBA 8 FALLIDA: el curso desaparecio del registro al borrarlo del trabajo.';
  END IF;
  RAISE NOTICE 'PRUEBA 8  borrar el curso de trabajo no vacia el registro       PASA';

  -- Y SE RETIRA, que es lo que le toca: el curso de prueba ya no existe en el
  -- trabajo, asi que no puede quedarse VIVO en el registro. Si se quedara, en
  -- cuanto la PR 3 lea el espejo apareceria en el catalogo un curso llamado
  -- «PRUEBA 117». La fila se queda —el registro no borra nunca— pero retirada.
  UPDATE public.quiz_questions_publicadas SET retirada_el = now()
   WHERE module_id = v_modulo AND retirada_el IS NULL;
  UPDATE public.lessons_publicadas SET retirada_el = now()
   WHERE course_id = v_curso AND retirada_el IS NULL;
  UPDATE public.modules_publicados SET retirada_el = now()
   WHERE course_id = v_curso AND retirada_el IS NULL;
  UPDATE public.courses_publicados SET retirada_el = now()
   WHERE id = v_curso AND retirada_el IS NULL;

  SELECT count(*) INTO v_n FROM public.courses_publicados
   WHERE id = v_curso AND retirada_el IS NULL;
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'PRUEBA 8 FALLIDA: el curso de prueba se quedo vivo en el registro.';
  END IF;

  -- 9. Quien no es administracion no publica
  PERFORM set_config('request.jwt.claims',
                     json_build_object(
                       'sub', (SELECT u.id FROM public.users u
                                WHERE u.role <> 'admin'
                                  AND NOT EXISTS (SELECT 1 FROM public.user_roles ur
                                                   WHERE ur.user_id = u.id
                                                     AND ur.role::text = 'admin' AND ur.is_active)
                                ORDER BY u.created_at LIMIT 1)::text,
                       'role', 'authenticated')::text,
                     true);
  BEGIN
    PERFORM public.publicar_curso((SELECT id FROM public.courses WHERE status = 'published' LIMIT 1));
    RAISE EXCEPTION 'PRUEBA 9 FALLIDA: alguien que no es admin pudo publicar un curso.';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'PRUEBA 9  publicar es cosa de la administracion                PASA';
  END;
  PERFORM set_config('request.jwt.claims', '', true);

  -- 10. Si al espejo le falta una columna del origen, NO se publica en silencio.
  --     Se comprueba con DOS TABLAS DE USAR Y TIRAR. Quitarle y devolverle una
  --     columna al espejo de verdad para probar esto seria cambiar el esquema real
  --     dentro de una prueba: se perderia el tipo exacto de la columna, su NOT NULL
  --     y, en las filas retiradas, su contenido.
  CREATE TABLE public.prueba_117_origen (id uuid PRIMARY KEY, uno text, dos text);
  CREATE TABLE public.prueba_117_espejo (id uuid PRIMARY KEY, uno text);
  BEGIN
    PERFORM public.columnas_a_copiar('prueba_117_origen', 'prueba_117_espejo');
    RAISE EXCEPTION 'PRUEBA 10 FALLIDA: no se quejo de que al espejo le falta una columna.';
  EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'PRUEBA 10 un espejo al que le falta una columna se queja       PASA';
  END;
  -- y con las dos columnas, no se queja
  ALTER TABLE public.prueba_117_espejo ADD COLUMN dos text;
  IF array_length(public.columnas_a_copiar('prueba_117_origen', 'prueba_117_espejo'), 1) <> 3 THEN
    RAISE EXCEPTION 'PRUEBA 10 FALLIDA: con las columnas completas no devolvio las tres.';
  END IF;
  DROP TABLE public.prueba_117_origen;
  DROP TABLE public.prueba_117_espejo;

  -- 11. El trigger publica al pasar a published, y retira al dejar de estarlo.
  --     Sin el segundo, despublicar un curso lo dejaria en el catalogo.
  INSERT INTO public.courses (slug, title, level, status, is_free, is_certifiable, specialty_id)
  VALUES ('prueba-117-trigger-' || floor(random() * 1000000)::text, 'PRUEBA 117 trigger',
          'beginner', 'draft', true, false,
          (SELECT id FROM public.instructor_specialties WHERE slug = 'ethereum-contratos'))
  RETURNING id INTO v_curso;

  UPDATE public.courses SET status = 'published' WHERE id = v_curso;
  SELECT count(*) INTO v_n FROM public.courses_publicados
   WHERE id = v_curso AND retirada_el IS NULL;
  IF v_n <> 1 THEN
    RAISE EXCEPTION 'PRUEBA 11 FALLIDA: el trigger no publico la copia al pasar a published.';
  END IF;

  UPDATE public.courses SET status = 'draft' WHERE id = v_curso;
  SELECT count(*) INTO v_n FROM public.courses_publicados
   WHERE id = v_curso AND retirada_el IS NULL;
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'PRUEBA 11 FALLIDA: al despublicar, el curso se quedo vivo en el catalogo.';
  END IF;
  RAISE NOTICE 'PRUEBA 11 el trigger publica y retira en las dos direcciones    PASA';

  DELETE FROM public.courses WHERE id = v_curso;

  -- 12. EL CASO QUE FALTABA: un instructor despublica SU PROPIO curso.
  --
  --     Es el fallo que encontro la revision. El trigger corre en la sesion de quien
  --     cambia el estado, y esto lo puede hacer el autor del curso, que no es
  --     administracion. Con la comprobacion de rol dentro de la funcion del trigger,
  --     el UPDATE se deshacia y la API devolvia 500.
  --
  --     Se prueba de verdad: SET LOCAL ROLE authenticated ademas de los claims, para
  --     que pase por la RLS igual que una peticion de PostgREST. El rol se devuelve
  --     antes de mirar nada, porque `authenticated` no tiene SELECT sobre el espejo.
  INSERT INTO public.courses
    (slug, title, level, status, is_free, is_certifiable,
     instructor_id, owner_id, specialty_id)
  VALUES ('prueba-117-instructor-' || floor(random() * 1000000)::text,
          'PRUEBA 117 instructor', 'beginner', 'draft', true, false,
          v_persona_no_admin, v_persona_no_admin,
          (SELECT id FROM public.instructor_specialties WHERE slug = 'ethereum-contratos'))
  RETURNING id INTO v_curso;

  -- Se publica sin sesion, que es como lo hace una migracion
  UPDATE public.courses SET status = 'published' WHERE id = v_curso;
  SELECT count(*) INTO v_n FROM public.courses_publicados
   WHERE id = v_curso AND retirada_el IS NULL;
  IF v_n <> 1 THEN
    RAISE EXCEPTION 'PRUEBA 12 FALLIDA: el curso no quedo publicado en el espejo.';
  END IF;

  BEGIN
    PERFORM set_config('request.jwt.claims',
                       json_build_object('sub', v_persona_no_admin::text,
                                         'role', 'authenticated')::text,
                       true);
    EXECUTE 'SET LOCAL ROLE authenticated';

    UPDATE public.courses SET status = 'draft' WHERE id = v_curso;

    EXECUTE 'RESET ROLE';
  EXCEPTION WHEN OTHERS THEN
    EXECUTE 'RESET ROLE';
    PERFORM set_config('request.jwt.claims', '', true);
    RAISE EXCEPTION 'PRUEBA 12 FALLIDA: un instructor no pudo despublicar su propio curso: % (%)',
      SQLERRM, SQLSTATE;
  END;
  PERFORM set_config('request.jwt.claims', '', true);

  -- Que el UPDATE no afecte a ninguna fila por la RLS seria un falso verde: se
  -- comprueba el estado, no la ausencia de error.
  IF (SELECT status::text FROM public.courses WHERE id = v_curso) <> 'draft' THEN
    RAISE EXCEPTION 'PRUEBA 12 FALLIDA: el UPDATE no cambio el estado (la RLS lo filtro).';
  END IF;

  SELECT count(*) INTO v_n FROM public.courses_publicados
   WHERE id = v_curso AND retirada_el IS NULL;
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'PRUEBA 12 FALLIDA: el curso del instructor se quedo vivo en el catalogo.';
  END IF;
  RAISE NOTICE 'PRUEBA 12 un instructor despublica su propio curso y la copia se retira  PASA';

  DELETE FROM public.courses WHERE id = v_curso;

  -- 13. Y la llamada DIRECTA sigue siendo solo de administracion
  PERFORM set_config('request.jwt.claims',
                     json_build_object('sub', v_persona_no_admin::text,
                                       'role', 'authenticated')::text,
                     true);
  BEGIN
    PERFORM public.retirar_curso_de_la_copia(
      (SELECT id FROM public.courses WHERE status = 'published' LIMIT 1));
    RAISE EXCEPTION 'PRUEBA 13 FALLIDA: alguien que no es admin retiro un curso por RPC.';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'PRUEBA 13 por RPC, retirar sigue siendo cosa de la administracion   PASA';
  END;
  PERFORM set_config('request.jwt.claims', '', true);

  -- 14. Y las internas no las puede llamar nadie desde fuera
  IF has_function_privilege('authenticated', 'public.publicar_curso_interno(uuid)', 'EXECUTE')
     OR has_function_privilege('anon', 'public.publicar_curso_interno(uuid)', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.retirar_curso_de_la_copia_interno(uuid)', 'EXECUTE')
     OR has_function_privilege('anon', 'public.retirar_curso_de_la_copia_interno(uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'PRUEBA 14 FALLIDA: las funciones internas son invocables desde fuera.';
  END IF;
  RAISE NOTICE 'PRUEBA 14 las internas no tienen EXECUTE para anon ni authenticated   PASA';

  -- 15. Borrar un curso ya no se lleva las matriculas: esta impedido
  INSERT INTO public.courses
    (slug, title, level, status, is_free, is_certifiable, specialty_id)
  VALUES ('prueba-117-matricula-' || floor(random() * 1000000)::text,
          'PRUEBA 117 matricula', 'beginner', 'draft', true, false,
          (SELECT id FROM public.instructor_specialties WHERE slug = 'ethereum-contratos'))
  RETURNING id INTO v_curso;

  INSERT INTO public.course_enrollments (user_id, course_id)
  VALUES (v_persona, v_curso);

  BEGIN
    DELETE FROM public.courses WHERE id = v_curso;
    RAISE EXCEPTION 'PRUEBA 15 FALLIDA: se borro un curso con matriculas, y con el las matriculas.';
  EXCEPTION WHEN foreign_key_violation THEN
    RAISE NOTICE 'PRUEBA 15 borrar un curso con matriculas esta impedido              PASA';
  END;

  DELETE FROM public.course_enrollments WHERE course_id = v_curso;
  DELETE FROM public.courses WHERE id = v_curso;

  -- 16. Y el registro queda sin rastro de la prueba.
  --
  --     «El registro no borra nunca» es para las filas a las que apunta algo de
  --     alguien: el progreso, un certificado. A estas dos no apunta nada —el progreso
  --     de la prueba se borro en la 8—, asi que dejarlas seria dejar basura con el
  --     nombre PRUEBA 117 dentro para siempre. Se borran de dentro hacia fuera, que
  --     es lo que exigen las claves ajenas del propio espejo.
  DELETE FROM public.quiz_questions_publicadas
   WHERE module_id IN (SELECT id FROM public.modules_publicados
                        WHERE course_id IN (SELECT id FROM public.courses_publicados
                                             WHERE slug LIKE 'prueba-117-%'));
  DELETE FROM public.lessons_publicadas
   WHERE course_id IN (SELECT id FROM public.courses_publicados WHERE slug LIKE 'prueba-117-%');
  DELETE FROM public.modules_publicados
   WHERE course_id IN (SELECT id FROM public.courses_publicados WHERE slug LIKE 'prueba-117-%');
  DELETE FROM public.courses_publicados WHERE slug LIKE 'prueba-117-%';

  SELECT count(*) INTO v_n FROM public.courses_publicados WHERE slug LIKE 'prueba-117-%';
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'PRUEBA 16 FALLIDA: quedan % cursos de prueba en el registro.', v_n;
  END IF;

  -- 17. No queda nada de la prueba
  SELECT count(*) INTO v_n FROM public.courses WHERE slug LIKE 'prueba-117-%';
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'PRUEBA 17 FALLIDA: quedan % cursos de prueba en las tablas de trabajo.', v_n;
  END IF;
  SELECT count(*) INTO v_n FROM information_schema.tables
   WHERE table_schema = 'public' AND table_name LIKE 'prueba_117_%';
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'PRUEBA 17 FALLIDA: quedan % tablas de prueba.', v_n;
  END IF;
  RAISE NOTICE 'PRUEBA 17 no queda nada, ni en el trabajo ni en el registro    PASA';

  RAISE NOTICE 'Las diecisiete pruebas pasan.';
END
$prueba$;

COMMIT;

-- ============================================================================
-- VERIFICACION
-- ============================================================================

SELECT
  (SELECT count(*) FROM public.courses WHERE status = 'published')                    AS cursos_publicados,
  (SELECT count(*) FROM public.courses_publicados WHERE retirada_el IS NULL)          AS en_el_espejo_vivos,
  (SELECT count(*) FROM public.modules_publicados WHERE retirada_el IS NULL)          AS modulos_vivos,
  (SELECT count(*) FROM public.lessons_publicadas WHERE retirada_el IS NULL)          AS lecciones_vivas,
  (SELECT count(*) FROM public.quiz_questions_publicadas WHERE retirada_el IS NULL)   AS preguntas_vivas,
  (SELECT count(*) FROM public.courses_publicados WHERE retirada_el IS NOT NULL)      AS en_el_registro_retirados,
  (SELECT count(*) FROM pg_constraint con
     JOIN pg_class cl ON cl.oid = con.conrelid
     JOIN pg_class fcl ON fcl.oid = con.confrelid
    WHERE con.contype = 'f' AND con.confdeltype = 'r'
      AND fcl.relname IN ('courses_publicados', 'modules_publicados', 'lessons_publicadas'))
                                                                                      AS claves_al_espejo_restrict,
  (SELECT count(*) FROM public.user_progress p
    WHERE NOT EXISTS (SELECT 1 FROM public.lessons_publicadas e WHERE e.id = p.lesson_id))
                                                                                      AS progreso_sin_registro,
  (SELECT count(*) FROM public.courses WHERE slug LIKE 'prueba-117-%')                AS cursos_de_prueba,
  (SELECT count(*) FROM public.courses_publicados WHERE slug LIKE 'prueba-117-%')     AS de_prueba_en_el_registro,
  CASE
    WHEN (SELECT count(*) FROM public.courses WHERE status = 'published')
       = (SELECT count(*) FROM public.courses_publicados WHERE retirada_el IS NULL)
     AND (SELECT count(*) FROM public.user_progress p
           WHERE NOT EXISTS (SELECT 1 FROM public.lessons_publicadas e WHERE e.id = p.lesson_id)) = 0
     AND (SELECT count(*) FROM pg_constraint con
            JOIN pg_class cl ON cl.oid = con.conrelid
            JOIN pg_class fcl ON fcl.oid = con.confrelid
           WHERE con.contype = 'f' AND con.confdeltype = 'r'
             AND fcl.relname IN ('courses_publicados', 'modules_publicados', 'lessons_publicadas')) >= 5
     AND (SELECT count(*) FROM public.courses WHERE slug LIKE 'prueba-117-%') = 0
     AND (SELECT count(*) FROM public.courses_publicados WHERE slug LIKE 'prueba-117-%') = 0
    THEN 'TODO CORRECTO'
    ELSE 'REVISAR'
  END AS veredicto;

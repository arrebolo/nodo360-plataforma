-- 119. Abrir la copia publicada a la lectura, y que reenviar cambios no la retire.
--
-- Esta es la primera mitad de la PR 3. NO CAMBIA NADA DE LO QUE SE VE: concede permisos
-- que todavía no usa nadie —el código lee las tablas de trabajo hasta la PR 3— y cambia
-- cuándo se retira una fila del espejo. Se puede aplicar con el código actual en
-- producción, y es la condición para mover las lecturas.
--
-- ═════════════════════════════════════════════════════════════════════════════
-- 1. POR QUE EL ESPEJO NACIO CERRADO Y SE ABRE AHORA
--
--    La 117 lo dejó con RLS activada y sin políticas, y con REVOKE a `anon` y a
--    `authenticated`: abrir una tabla que nadie lee es abrirla a ciegas. Ahora sí se
--    sabe quién va a leer qué, así que se abre superficie por superficie.
--
-- 2. DOS MITADES EN CADA POLITICA, Y LA SEGUNDA SALE DE MEDIR
--
--    «Solo las filas vivas» es lo correcto para el catálogo, y le quitaría a la gente su
--    historial. Medido antes de escribir esto:
--
--      · 17 matrículas y 6 certificados en cursos ARCHIVADOS (retirados del espejo)
--      · 33 filas de progreso en 30 lecciones RETIRADAS
--
--    Si solo se pudieran leer las filas vivas, «Mis cursos», el progreso y la página del
--    certificado se quedarían sin esos cursos: gente que terminó un curso dejaría de
--    verlo. Así que cada tabla tiene dos políticas, que se suman (OR):
--
--      a) vivo        → lo lee cualquiera, con sesión o sin ella
--      b) mío         → una fila retirada la lee quien tiene matrícula, certificado o
--                       progreso en ella
--
-- 3. LAS RESPUESTAS DEL EXAMEN NO SE ABREN A NADIE
--
--    Medido en las tablas de trabajo: `quiz_questions.correct_answer` y `.explanation`
--    están cerradas a TODOS los roles, y `quiz_questions` entera está cerrada a `anon`.
--    El espejo tiene que conservar exactamente eso, porque abrirlo de más sería publicar
--    las soluciones del examen. Aquí se conceden columnas, no tablas.
--
-- 4. EL TRIGGER: REENVIAR CAMBIOS NO ES DESPUBLICAR
--
--    La 117 retira la copia en cuanto `status` deja de ser `published`. Eso era correcto
--    mientras `status` significara «está en el catálogo», pero con la copia publicada
--    significa «en qué punto está el trabajo»: cuando el autor de un curso publicado
--    reenvía cambios, el curso pasa a `pending_review` y con la regla vieja
--    DESAPARECERIA DEL CATALOGO —que es justo el fallo que la copia publicada viene a
--    arreglar—. Medido hoy, con las tablas de trabajo: un curso en `pending_review` no
--    lo ve `anon`, ni sus módulos, ni sus lecciones.
--
--    Regla nueva: se retira al LLEGAR a `draft` o `archived` y haber algo vivo que
--    retirar, sin mirar de dónde se viene. El estado anterior no sirve como condición: el
--    camino real es published → pending_review → draft, y en el segundo salto el anterior
--    ya no es `published`, así que la copia se quedaría viva en el catálogo con el curso
--    en borrador.

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Los cursos publicados
-- ─────────────────────────────────────────────────────────────────────────────
GRANT SELECT ON public.courses_publicados TO anon, authenticated;

DROP POLICY IF EXISTS cursos_publicados_vivos ON public.courses_publicados;
CREATE POLICY cursos_publicados_vivos
  ON public.courses_publicados
  FOR SELECT
  TO anon, authenticated
  USING (retirada_el IS NULL);

DROP POLICY IF EXISTS cursos_publicados_mios ON public.courses_publicados;
CREATE POLICY cursos_publicados_mios
  ON public.courses_publicados
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.course_enrollments e
       WHERE e.course_id = courses_publicados.id AND e.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.certificates c
       WHERE c.course_id = courses_publicados.id AND c.user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Los módulos
-- ─────────────────────────────────────────────────────────────────────────────
GRANT SELECT ON public.modules_publicados TO anon, authenticated;

DROP POLICY IF EXISTS modulos_publicados_vivos ON public.modules_publicados;
CREATE POLICY modulos_publicados_vivos
  ON public.modules_publicados
  FOR SELECT
  TO anon, authenticated
  USING (retirada_el IS NULL);

DROP POLICY IF EXISTS modulos_publicados_mios ON public.modules_publicados;
CREATE POLICY modulos_publicados_mios
  ON public.modules_publicados
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.course_enrollments e
       WHERE e.course_id = modules_publicados.course_id AND e.user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Las lecciones
--
-- El progreso cuelga de aquí (`user_progress.lesson_id`, repuntada por la 117), así que
-- esta es la tabla donde «lo mío» importa más: una lección retirada sobre la que alguien
-- tiene progreso tiene que seguir siendo legible para esa persona, o su propio historial
-- deja de poder enseñarse.
-- ─────────────────────────────────────────────────────────────────────────────
GRANT SELECT ON public.lessons_publicadas TO anon, authenticated;

DROP POLICY IF EXISTS lecciones_publicadas_vivas ON public.lessons_publicadas;
CREATE POLICY lecciones_publicadas_vivas
  ON public.lessons_publicadas
  FOR SELECT
  TO anon, authenticated
  USING (retirada_el IS NULL);

DROP POLICY IF EXISTS lecciones_publicadas_mias ON public.lessons_publicadas;
CREATE POLICY lecciones_publicadas_mias
  ON public.lessons_publicadas
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_progress p
       WHERE p.lesson_id = lessons_publicadas.id AND p.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.course_enrollments e
       WHERE e.course_id = lessons_publicadas.course_id AND e.user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Las preguntas del examen: POR COLUMNAS, y solo con sesión
--
-- Igual que en las tablas de trabajo: `anon` no lee preguntas, y `correct_answer` y
-- `explanation` no se conceden a nadie. Quien corrige el examen lo hace con el cliente
-- de servicio, que no pasa por estos permisos.
-- ─────────────────────────────────────────────────────────────────────────────
GRANT SELECT (
  id, module_id, question, options, order_index, difficulty, points,
  created_at, updated_at, publicado_el, version, retirada_el
) ON public.quiz_questions_publicadas TO authenticated;

DROP POLICY IF EXISTS preguntas_publicadas_vivas ON public.quiz_questions_publicadas;
CREATE POLICY preguntas_publicadas_vivas
  ON public.quiz_questions_publicadas
  FOR SELECT
  TO authenticated
  USING (retirada_el IS NULL);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. El trigger: reenviar cambios no retira la copia
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.al_publicar_refrescar_la_copia()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
BEGIN
  -- LAS INTERNAS, NO LAS PUBLICAS: este trigger corre en la sesion de quien cambia el
  -- estado, que no siempre es administracion. Si llamara a las publicas, una operacion
  -- legitima del autor se levantaria con 42501 y desharia el UPDATE entero.
  IF NEW.status = 'published' AND OLD.status IS DISTINCT FROM 'published' THEN
    PERFORM public.publicar_curso_interno(NEW.id);

  -- SE RETIRA AL LLEGAR A draft O archived, SIN MIRAR DE DONDE SE VIENE.
  --
  -- `pending_review`, `changes_requested` y `rejected` son estados de la COPIA DE
  -- TRABAJO: el autor ha mandado cambios y la administracion aun no los ha visto. La
  -- version publicada sigue en pie y los alumnos la siguen leyendo; retirarla ahi era
  -- despublicar un curso por corregirle una falta.
  --
  -- Pero el estado anterior NO puede ser la condicion. El camino real es
  -- published -> pending_review -> draft: en el segundo salto el anterior ya no es
  -- `published`, asi que una condicion sobre OLD.status dejaria la copia VIVA en el
  -- catalogo con el curso en borrador. Lo que decide es a donde se llega, y que haya
  -- algo vivo que retirar.
  ELSIF NEW.status IN ('draft', 'archived')
    AND EXISTS (
      SELECT 1 FROM public.courses_publicados cp
       WHERE cp.id = NEW.id AND cp.retirada_el IS NULL
    )
  THEN
    PERFORM public.retirar_curso_de_la_copia_interno(NEW.id);
  END IF;

  RETURN NULL;
END
$fn$;

COMMENT ON FUNCTION public.al_publicar_refrescar_la_copia() IS
  'Refresca la copia publicada al pasar a published, y la retira al llegar a draft o archived SIN MIRAR EL ESTADO ANTERIOR, porque el camino real es published -> pending_review -> draft. Los estados de revision (pending_review, changes_requested, rejected) no la retiran: son estados de la copia de trabajo, y la version publicada sigue visible mientras la administracion decide. Hasta la 119 cualquier salida de published retiraba la copia, con lo que reenviar cambios despublicaba el curso.';

REVOKE ALL ON FUNCTION public.al_publicar_refrescar_la_copia() FROM PUBLIC;

COMMIT;

-- ═════════════════════════════════════════════════════════════════════════════
-- AUTOPRUEBA
--
-- Se hace pasar por `anon` y por `authenticated` con SET LOCAL ROLE y
-- `request.jwt.claims`, que es lo que lee auth.uid(). NO ESCRIBE NINGUNA FILA de
-- contenido: para el caso «mío» usa una matricula que ya existe en un curso archivado
-- —hay 17—, solo para leer.
--
-- El trigger se prueba sobre un curso de usar y tirar, creado y borrado aqui dentro, y
-- la verificacion final comprueba que no queda.
-- ═════════════════════════════════════════════════════════════════════════════
DO $autoprueba$
DECLARE
  v_fallos        INT := 0;
  v_vivos         INT;
  v_retirados     INT;
  v_como_anon     INT;
  v_como_auth     INT;
  v_usuario       UUID;
  v_curso_ret     UUID;
  v_instructor    UUID;
  v_curso_prueba  UUID := gen_random_uuid();
  v_esp           UUID;
  v_en_espejo     INT;
  v_texto         TEXT;
BEGIN
  SELECT COUNT(*) INTO v_vivos     FROM public.courses_publicados WHERE retirada_el IS NULL;
  SELECT COUNT(*) INTO v_retirados FROM public.courses_publicados WHERE retirada_el IS NOT NULL;

  -- ── Como anon: solo los vivos ─────────────────────────────────────────────
  SET LOCAL ROLE anon;
  SELECT COUNT(*) INTO v_como_anon FROM public.courses_publicados;
  RESET ROLE;

  IF v_como_anon <> v_vivos THEN
    RAISE WARNING 'FALLA: anon ve % cursos del espejo y hay % vivos', v_como_anon, v_vivos;
    v_fallos := v_fallos + 1;
  END IF;

  -- Los modulos y las lecciones vivas, tambien: no se da por bueno «el mismo patron».
  SET LOCAL ROLE anon;
  SELECT COUNT(*) INTO v_como_anon FROM public.modules_publicados;
  RESET ROLE;
  SELECT COUNT(*) INTO v_vivos FROM public.modules_publicados WHERE retirada_el IS NULL;
  IF v_como_anon <> v_vivos THEN
    RAISE WARNING 'FALLA: anon ve % modulos y hay % vivos', v_como_anon, v_vivos;
    v_fallos := v_fallos + 1;
  END IF;

  SET LOCAL ROLE anon;
  SELECT COUNT(*) INTO v_como_anon FROM public.lessons_publicadas;
  RESET ROLE;
  SELECT COUNT(*) INTO v_vivos FROM public.lessons_publicadas WHERE retirada_el IS NULL;
  IF v_como_anon <> v_vivos THEN
    RAISE WARNING 'FALLA: anon ve % lecciones y hay % vivas', v_como_anon, v_vivos;
    v_fallos := v_fallos + 1;
  END IF;

  -- Las preguntas, cerradas a anon
  SET LOCAL ROLE anon;
  BEGIN
    SELECT COUNT(id) INTO v_como_anon FROM public.quiz_questions_publicadas;
    RESET ROLE;
    RAISE WARNING 'FALLA: anon puede leer las preguntas publicadas (% filas)', v_como_anon;
    v_fallos := v_fallos + 1;
  EXCEPTION WHEN insufficient_privilege THEN
    RESET ROLE;
  END;

  -- ── Como authenticated: los vivos, y los retirados que son suyos ──────────
  SELECT e.user_id, e.course_id INTO v_usuario, v_curso_ret
    FROM public.course_enrollments e
    JOIN public.courses_publicados cp ON cp.id = e.course_id
   WHERE cp.retirada_el IS NOT NULL
   LIMIT 1;

  IF v_usuario IS NULL THEN
    RAISE WARNING 'FALLA: no hay ninguna matricula en un curso retirado con la que probar «lo mio»';
    v_fallos := v_fallos + 1;
  ELSE
    SET LOCAL ROLE authenticated;
    PERFORM set_config('request.jwt.claims', json_build_object('sub', v_usuario)::TEXT, TRUE);

    SELECT COUNT(*) INTO v_como_auth FROM public.courses_publicados WHERE id = v_curso_ret;
    IF v_como_auth <> 1 THEN
      RAISE WARNING 'FALLA: quien tiene matricula no ve su curso retirado';
      v_fallos := v_fallos + 1;
    END IF;

    -- Y un retirado que NO es suyo no lo ve
    SELECT COUNT(*) INTO v_como_auth
      FROM public.courses_publicados cp
     WHERE cp.retirada_el IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM public.course_enrollments e
                        WHERE e.course_id = cp.id AND e.user_id = v_usuario)
       AND NOT EXISTS (SELECT 1 FROM public.certificates c
                        WHERE c.course_id = cp.id AND c.user_id = v_usuario);
    RESET ROLE;

    IF v_como_auth <> 0 THEN
      RAISE WARNING 'FALLA: ve % cursos retirados que no son suyos', v_como_auth;
      v_fallos := v_fallos + 1;
    END IF;
  END IF;

  -- Las preguntas: se leen, pero no la respuesta
  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', COALESCE(v_usuario, gen_random_uuid()))::TEXT, TRUE);
  SELECT COUNT(id) INTO v_como_auth FROM public.quiz_questions_publicadas;
  RESET ROLE;
  IF v_como_auth = 0 THEN
    RAISE WARNING 'FALLA: authenticated no puede leer ninguna pregunta publicada';
    v_fallos := v_fallos + 1;
  END IF;

  SET LOCAL ROLE authenticated;
  BEGIN
    SELECT correct_answer::TEXT INTO v_texto FROM public.quiz_questions_publicadas LIMIT 1;
    RESET ROLE;
    RAISE WARNING 'FALLA: authenticated puede leer correct_answer del espejo';
    v_fallos := v_fallos + 1;
  EXCEPTION WHEN insufficient_privilege THEN
    RESET ROLE;
  END;

  -- ── El trigger ────────────────────────────────────────────────────────────
  --
  -- LO QUE HAY QUE RESPETAR, repasado trigger por trigger sobre `public.courses`:
  --
  --   · trg_controlar_publicacion (098/109)  BEFORE INSERT OR UPDATE
  --        se escapa en la primera linea si `auth.uid()` es NULL. Por eso aqui se
  --        DEJAN LAS CLAIMS VACIAS: sin sesion, la puerta no opina, y la autoprueba no
  --        depende de que exista un admin ni de que este verificado en nada.
  --   · trigger_course_modification (030)    BEFORE UPDATE (todas las columnas)
  --        se escapa si NEW.status <> OLD.status. Aqui SOLO se cambia el status, nunca
  --        el contenido, asi que no devuelve nada a revision.
  --   · trg_no_recalificar (114)             BEFORE UPDATE OF specialty_id, jurisdiccion
  --        no se tocan esas dos columnas.
  --   · la_fecha_de_publicacion_no_se_borra (116)  BEFORE UPDATE OF published_at
  --        PROHIBE poner published_at a NULL, y con razon. La primera version de esta
  --        autoprueba lo hacia al limpiar y se levantaba con 42501: no se aplicaba nada.
  --        Aqui published_at SOLO se escribe al publicar, y nunca se borra; la limpieza
  --        es un DELETE, que ese trigger no vigila.
  --   · trg_examen_de_un_publicado (115)     esta sobre quiz_questions, no sobre courses.
  --
  -- UN CURSO DE USAR Y TIRAR POR CASO, para que ninguno herede el estado del anterior.
  PERFORM set_config('request.jwt.claims', '{}', TRUE);

  SELECT id INTO v_esp FROM public.instructor_specialties LIMIT 1;
  SELECT id INTO v_instructor FROM public.users ORDER BY created_at LIMIT 1;

  -- CASO A: publicado y en revision. La copia NO se retira.
  v_curso_prueba := gen_random_uuid();
  INSERT INTO public.courses (id, title, slug, description, level, status, is_free, instructor_id, specialty_id)
  VALUES (v_curso_prueba, 'AUTOPRUEBA 119 A', 'autoprueba-119-' || v_curso_prueba,
          'Caso A de la autoprueba.', 'beginner', 'draft', TRUE, v_instructor, v_esp);

  UPDATE public.courses SET status = 'published', published_at = now() WHERE id = v_curso_prueba;
  SELECT COUNT(*) INTO v_en_espejo FROM public.courses_publicados
   WHERE id = v_curso_prueba AND retirada_el IS NULL;
  IF v_en_espejo <> 1 THEN
    RAISE WARNING 'FALLA (A): al publicar no entro vivo en el espejo';
    v_fallos := v_fallos + 1;
  END IF;

  UPDATE public.courses SET status = 'pending_review' WHERE id = v_curso_prueba;
  SELECT COUNT(*) INTO v_en_espejo FROM public.courses_publicados
   WHERE id = v_curso_prueba AND retirada_el IS NULL;
  IF v_en_espejo <> 1 THEN
    RAISE WARNING 'FALLA (A): pending_review ha retirado la copia publicada';
    v_fallos := v_fallos + 1;
  END IF;

  UPDATE public.courses SET status = 'changes_requested' WHERE id = v_curso_prueba;
  SELECT COUNT(*) INTO v_en_espejo FROM public.courses_publicados
   WHERE id = v_curso_prueba AND retirada_el IS NULL;
  IF v_en_espejo <> 1 THEN
    RAISE WARNING 'FALLA (A): changes_requested ha retirado la copia publicada';
    v_fallos := v_fallos + 1;
  END IF;

  DELETE FROM public.courses WHERE id = v_curso_prueba;
  DELETE FROM public.courses_publicados WHERE id = v_curso_prueba;

  -- CASO B: EL CAMINO REAL. published -> pending_review -> draft SI retira, aunque el
  -- estado anterior al salto ya no sea `published`.
  v_curso_prueba := gen_random_uuid();
  INSERT INTO public.courses (id, title, slug, description, level, status, is_free, instructor_id, specialty_id)
  VALUES (v_curso_prueba, 'AUTOPRUEBA 119 B', 'autoprueba-119-' || v_curso_prueba,
          'Caso B de la autoprueba.', 'beginner', 'draft', TRUE, v_instructor, v_esp);

  UPDATE public.courses SET status = 'published', published_at = now() WHERE id = v_curso_prueba;
  UPDATE public.courses SET status = 'pending_review' WHERE id = v_curso_prueba;
  UPDATE public.courses SET status = 'draft' WHERE id = v_curso_prueba;

  SELECT COUNT(*) INTO v_en_espejo FROM public.courses_publicados
   WHERE id = v_curso_prueba AND retirada_el IS NOT NULL;
  IF v_en_espejo <> 1 THEN
    RAISE WARNING 'FALLA (B): published -> pending_review -> draft NO ha retirado la copia';
    v_fallos := v_fallos + 1;
  END IF;

  SELECT COUNT(*) INTO v_en_espejo FROM public.courses_publicados
   WHERE id = v_curso_prueba AND retirada_el IS NULL;
  IF v_en_espejo <> 0 THEN
    RAISE WARNING 'FALLA (B): la copia sigue viva con el curso en borrador';
    v_fallos := v_fallos + 1;
  END IF;

  DELETE FROM public.courses WHERE id = v_curso_prueba;
  DELETE FROM public.courses_publicados WHERE id = v_curso_prueba;

  -- CASO C: archivar retira, viniendo de donde venga.
  v_curso_prueba := gen_random_uuid();
  INSERT INTO public.courses (id, title, slug, description, level, status, is_free, instructor_id, specialty_id)
  VALUES (v_curso_prueba, 'AUTOPRUEBA 119 C', 'autoprueba-119-' || v_curso_prueba,
          'Caso C de la autoprueba.', 'beginner', 'draft', TRUE, v_instructor, v_esp);

  UPDATE public.courses SET status = 'published', published_at = now() WHERE id = v_curso_prueba;
  UPDATE public.courses SET status = 'changes_requested' WHERE id = v_curso_prueba;
  UPDATE public.courses SET status = 'archived' WHERE id = v_curso_prueba;

  SELECT COUNT(*) INTO v_en_espejo FROM public.courses_publicados
   WHERE id = v_curso_prueba AND retirada_el IS NOT NULL;
  IF v_en_espejo <> 1 THEN
    RAISE WARNING 'FALLA (C): archivar no ha retirado la copia publicada';
    v_fallos := v_fallos + 1;
  END IF;

  DELETE FROM public.courses WHERE id = v_curso_prueba;
  DELETE FROM public.courses_publicados WHERE id = v_curso_prueba;

  -- CASO D: un curso que nunca se publico y pasa a draft no rompe nada.
  v_curso_prueba := gen_random_uuid();
  INSERT INTO public.courses (id, title, slug, description, level, status, is_free, instructor_id, specialty_id)
  VALUES (v_curso_prueba, 'AUTOPRUEBA 119 D', 'autoprueba-119-' || v_curso_prueba,
          'Caso D de la autoprueba.', 'beginner', 'draft', TRUE, v_instructor, v_esp);
  UPDATE public.courses SET status = 'archived' WHERE id = v_curso_prueba;
  SELECT COUNT(*) INTO v_en_espejo FROM public.courses_publicados WHERE id = v_curso_prueba;
  IF v_en_espejo <> 0 THEN
    RAISE WARNING 'FALLA (D): un curso sin publicar ha aparecido en el espejo';
    v_fallos := v_fallos + 1;
  END IF;
  DELETE FROM public.courses WHERE id = v_curso_prueba;

  PERFORM set_config('request.jwt.claims', '{}', TRUE);

  IF v_fallos = 0 THEN
    RAISE NOTICE 'TODO CORRECTO: el espejo se lee como debe y el trigger retira cuando toca y solo cuando toca (16 comprobaciones)';
  ELSE
    RAISE EXCEPTION 'REVISAR: % comprobaciones falladas', v_fallos;
  END IF;
END
$autoprueba$;

-- ═════════════════════════════════════════════════════════════════════════════
-- VERIFICACION, una fila
-- ═════════════════════════════════════════════════════════════════════════════
SELECT
  (SELECT COUNT(*) FROM public.courses_publicados WHERE retirada_el IS NULL)        AS cursos_vivos,
  (SELECT COUNT(*) FROM public.courses WHERE status = 'published')                  AS publicados,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public'
     AND tablename IN ('courses_publicados','modules_publicados','lessons_publicadas','quiz_questions_publicadas')) AS politicas,
  has_table_privilege('anon', 'public.courses_publicados', 'SELECT')                AS cursos_los_lee_anon,
  has_table_privilege('anon', 'public.quiz_questions_publicadas', 'SELECT')         AS preguntas_las_lee_anon,
  has_column_privilege('authenticated', 'public.quiz_questions_publicadas', 'question', 'SELECT')       AS auth_lee_la_pregunta,
  has_column_privilege('authenticated', 'public.quiz_questions_publicadas', 'correct_answer', 'SELECT') AS auth_lee_la_respuesta,
  (SELECT COUNT(*) FROM public.courses WHERE title LIKE 'AUTOPRUEBA 119%')           AS restos_en_courses,
  (SELECT COUNT(*) FROM public.courses_publicados WHERE title LIKE 'AUTOPRUEBA 119%') AS restos_en_el_espejo,
  CASE
    WHEN (SELECT COUNT(*) FROM public.courses_publicados WHERE retirada_el IS NULL)
         = (SELECT COUNT(*) FROM public.courses WHERE status = 'published')
     AND (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public'
            AND tablename IN ('courses_publicados','modules_publicados','lessons_publicadas','quiz_questions_publicadas')) = 7
     AND has_table_privilege('anon', 'public.courses_publicados', 'SELECT')
     AND NOT has_table_privilege('anon', 'public.quiz_questions_publicadas', 'SELECT')
     AND has_column_privilege('authenticated', 'public.quiz_questions_publicadas', 'question', 'SELECT')
     AND NOT has_column_privilege('authenticated', 'public.quiz_questions_publicadas', 'correct_answer', 'SELECT')
     AND (SELECT COUNT(*) FROM public.courses WHERE title LIKE 'AUTOPRUEBA 119%') = 0
     AND (SELECT COUNT(*) FROM public.courses_publicados WHERE title LIKE 'AUTOPRUEBA 119%') = 0
    THEN 'TODO CORRECTO'
    ELSE 'REVISAR'
  END AS veredicto;

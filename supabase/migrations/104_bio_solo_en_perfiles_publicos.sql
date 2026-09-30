-- ============================================================================
-- MIGRACION 104: bio deja de ser publica para todo el mundo
--
-- DE DONDE VIENE
-- La 103 cerro los cuatro enlaces y dejo `bio` como estaba, a proposito: bio es
-- publica desde la 049, no desde la 101, y la leian en publico tres sitios. No se
-- revoca una columna en la misma migracion en la que no sabes quien la lee. Ya se
-- sabe, y son estos tres:
--
--   1. el perfil del instructor            /instructores/[id]
--   2. el perfil del mentor                /mentores/[id]
--   3. el modal de autor de los cursos     CourseCard y CourseHero
--
-- Los tres pasan a leerla de una vista, y la columna se cierra.
--
-- POR QUE UNA SOLA VISTA Y NO TRES
-- Porque la pregunta que hay detras es una sola: «¿de quien se puede contar algo
-- en publico?». La respuesta es: de quien tiene un perfil publico en la
-- plataforma, y eso son tres situaciones, no tres vistas:
--
--   - tiene perfil de instructor ACTIVO
--   - es mentor con fila ACTIVA en user_roles  (es la puerta que usa /mentores/[id],
--     que no mira users.role sino user_roles)
--   - es autor de al menos un curso PUBLICADO (hoy, una cuenta admin)
--
-- Quien no esta en ninguna de las tres no tiene pagina publica, y su biografia no
-- tiene por que poder leerse desde fuera.
--
-- LOS ENLACES SIGUEN SIENDO SOLO DE INSTRUCTOR
-- La vista los devuelve con un CASE: si la fila no tiene perfil de instructor
-- activo, los cuatro enlaces salen a NULL aunque esten escritos. Ser mentor o
-- autor te da biografia publica, no redes publicas. La prueba 5 lo comprueba
-- escribiendo un enlace en una fila que no es instructor.
--
-- Y SUSTITUYE A enlaces_publicos_de_instructor, que se borra: tener dos vistas
-- para «lo publico de una persona» es tener dos sitios donde equivocarse.
--
-- ORDEN DE DESPLIEGUE: PRIMERO DESPLEGAR, DESPUES APLICAR.
-- Es al contrario de lo habitual y tiene un motivo medible: el codigo viejo pide
-- `bio` dentro del embed de /instructores/[id] y dentro del select de
-- /mentores/[id]. Si se revoca antes de desplegar, esas consultas fallan enteras
-- con 42501 y las dos paginas devuelven 404 —no «sin biografia», 404—. Desplegado
-- primero, el codigo nuevo pide la vista: mientras no exista, falta el texto de la
-- biografia y nada mas.
--
-- NO BORRA NI UNA FILA de datos. Es reejecutable. Y se prueba a si misma, leyendo
-- de verdad como anon y como authenticated.
-- ============================================================================

BEGIN;

-- =====================================================
-- 1. La vista: lo que se puede contar en publico de alguien
-- =====================================================

CREATE OR REPLACE VIEW public.perfiles_publicos AS
  SELECT
    u.id,
    u.full_name,
    u.avatar_url,
    u.role,
    u.bio,

    -- Los enlaces, solo si hay perfil de instructor activo.
    CASE WHEN ip.user_id IS NOT NULL THEN u.website  END AS website,
    CASE WHEN ip.user_id IS NOT NULL THEN u.twitter  END AS twitter,
    CASE WHEN ip.user_id IS NOT NULL THEN u.linkedin END AS linkedin,
    CASE WHEN ip.user_id IS NOT NULL THEN u.github   END AS github,

    -- Por que esta fila es publica. Util para depurar sin adivinar.
    (ip.user_id IS NOT NULL) AS es_instructor,
    (me.user_id IS NOT NULL) AS es_mentor,
    (au.autor    IS NOT NULL) AS es_autor

  FROM public.users u

  LEFT JOIN public.instructor_profiles ip
         ON ip.user_id = u.id
        AND ip.is_active

  LEFT JOIN (
    SELECT DISTINCT user_id
      FROM public.user_roles
     WHERE role = 'mentor'
       AND is_active
  ) me ON me.user_id = u.id

  LEFT JOIN (
    SELECT DISTINCT instructor_id AS autor
      FROM public.courses
     WHERE status = 'published'
       AND instructor_id IS NOT NULL
  ) au ON au.autor = u.id

  WHERE ip.user_id IS NOT NULL
     OR me.user_id IS NOT NULL
     OR au.autor  IS NOT NULL;

COMMENT ON VIEW public.perfiles_publicos IS
  'Lo que se puede leer en publico de una persona: nombre, avatar, rol y biografia, y ademas los enlaces SOLO si tiene perfil de instructor activo. Solo aparece quien tiene pagina publica: perfil de instructor activo, mentor activo en user_roles, o autor de un curso publicado. Vista normal a proposito (no SECURITY INVOKER): corre con los privilegios de su dueño, que es lo que le permite leer columnas que anon y authenticated ya no pueden leer. Sustituye a enlaces_publicos_de_instructor.';

REVOKE ALL ON public.perfiles_publicos FROM PUBLIC;
GRANT SELECT ON public.perfiles_publicos TO anon, authenticated;

-- =====================================================
-- 2. Fuera la vista anterior, que esta sustituida
-- =====================================================

DROP VIEW IF EXISTS public.enlaces_publicos_de_instructor;

-- =====================================================
-- 3. Y se cierra bio en la tabla
-- =====================================================

REVOKE SELECT (bio) ON public.users FROM anon;
REVOKE SELECT (bio) ON public.users FROM authenticated;

COMMENT ON COLUMN public.users.bio IS
  'Biografia propia. NO es legible por anon ni authenticated desde la 104: sale por la vista perfiles_publicos, que solo devuelve a quien tiene pagina publica. La fila propia se lee con mi_perfil(). Era publica para cualquier fila no-estudiante desde la 049.';

-- =====================================================
-- 4. La prueba, leyendo de verdad
-- =====================================================

DO $prueba$
DECLARE
  v_instructor uuid;
  v_autor      uuid;
  v_nadie      uuid;
  v_n          integer;
  v_bio        text;
  v_web        text;

  -- Los valores ORIGINALES, para devolverlos tal cual.
  --
  -- La primera version de esta prueba restauraba a NULL, y eso no es restaurar:
  -- la cuenta autora tiene bio y web de verdad escritas, asi que habria borrado
  -- las dos. Una prueba que destruye el dato que estaba comprobando no es una
  -- prueba.
  o_bio_instr  text;
  o_web_instr  text;
  o_web_autor  text;
  o_bio_nadie  text;
  o_habia_mentor boolean;
BEGIN
  SELECT p.user_id INTO v_instructor
    FROM public.instructor_profiles p WHERE p.is_active LIMIT 1;

  SELECT DISTINCT c.instructor_id INTO v_autor
    FROM public.courses c
   WHERE c.status = 'published'
     AND c.instructor_id IS NOT NULL
     AND c.instructor_id <> v_instructor
   LIMIT 1;

  -- Alguien SIN pagina publica: ni instructor, ni mentor activo, ni autor.
  SELECT u.id INTO v_nadie
    FROM public.users u
   WHERE NOT EXISTS (SELECT 1 FROM public.instructor_profiles p WHERE p.user_id = u.id AND p.is_active)
     AND NOT EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = u.id AND r.role = 'mentor' AND r.is_active)
     AND NOT EXISTS (SELECT 1 FROM public.courses c WHERE c.instructor_id = u.id AND c.status = 'published')
   LIMIT 1;

  IF v_instructor IS NULL OR v_autor IS NULL OR v_nadie IS NULL THEN
    RAISE EXCEPTION 'La prueba necesita un instructor activo, un autor distinto y alguien sin pagina publica. instructor=% autor=% nadie=%',
      v_instructor, v_autor, v_nadie;
  END IF;

  SELECT bio, website INTO o_bio_instr, o_web_instr FROM public.users WHERE id = v_instructor;
  SELECT website          INTO o_web_autor              FROM public.users WHERE id = v_autor;
  SELECT bio              INTO o_bio_nadie              FROM public.users WHERE id = v_nadie;
  o_habia_mentor := EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = v_nadie AND role = 'mentor'
  );
  IF o_habia_mentor THEN
    RAISE EXCEPTION 'El sujeto elegido para la prueba de mentor ya tiene fila de mentor; la prueba la retiraria al terminar. Aborta.';
  END IF;

  -- 1. anon YA NO lee users.bio
  BEGIN
    SET LOCAL ROLE anon;
    PERFORM bio FROM public.users WHERE id = v_instructor;
    RESET ROLE;
    RAISE EXCEPTION 'PRUEBA 1 FALLIDA: anon todavia lee users.bio.';
  EXCEPTION WHEN insufficient_privilege THEN
    RESET ROLE;
    RAISE NOTICE 'PRUEBA 1  anon ya no lee users.bio                             PASA';
  END;

  -- 2. authenticated tampoco
  BEGIN
    SET LOCAL ROLE authenticated;
    PERFORM bio FROM public.users WHERE id = v_instructor;
    RESET ROLE;
    RAISE EXCEPTION 'PRUEBA 2 FALLIDA: authenticated todavia lee users.bio.';
  EXCEPTION WHEN insufficient_privilege THEN
    RESET ROLE;
    RAISE NOTICE 'PRUEBA 2  authenticated ya no lee users.bio                   PASA';
  END;

  -- 3. El instructor SI esta en la vista, con sus enlaces
  UPDATE public.users
     SET bio = 'biografia de prueba 104', website = 'https://prueba-104.invalid'
   WHERE id = v_instructor;

  SET LOCAL ROLE anon;
  SELECT bio, website INTO v_bio, v_web
    FROM public.perfiles_publicos WHERE id = v_instructor;
  RESET ROLE;

  IF v_bio IS DISTINCT FROM 'biografia de prueba 104' THEN
    RAISE EXCEPTION 'PRUEBA 3 FALLIDA: anon no lee la bio del instructor por la vista (leyo %).', coalesce(v_bio, 'NULL');
  END IF;
  IF v_web IS DISTINCT FROM 'https://prueba-104.invalid' THEN
    RAISE EXCEPTION 'PRUEBA 3 FALLIDA: la vista no devuelve el enlace del instructor (devolvio %).', coalesce(v_web, 'NULL');
  END IF;
  RAISE NOTICE 'PRUEBA 3  el instructor sale con bio y con enlaces             PASA';

  -- 4. El autor de cursos publicados SI sale, y con biografia
  SET LOCAL ROLE anon;
  SELECT count(*) INTO v_n FROM public.perfiles_publicos WHERE id = v_autor AND es_autor;
  RESET ROLE;
  IF v_n <> 1 THEN
    RAISE EXCEPTION 'PRUEBA 4 FALLIDA: el autor de cursos publicados no sale en la vista.';
  END IF;
  RAISE NOTICE 'PRUEBA 4  el autor de un curso publicado sale en la vista      PASA';

  -- 5. Pero sus ENLACES salen a NULL: ser autor no hace publicas tus redes
  UPDATE public.users SET website = 'https://no-deberia-verse-104.invalid' WHERE id = v_autor;

  SET LOCAL ROLE anon;
  SELECT website INTO v_web FROM public.perfiles_publicos WHERE id = v_autor;
  RESET ROLE;
  IF v_web IS NOT NULL THEN
    RAISE EXCEPTION 'PRUEBA 5 FALLIDA: la vista devuelve el enlace de quien no es instructor (%).', v_web;
  END IF;
  RAISE NOTICE 'PRUEBA 5  sin perfil de instructor, los enlaces salen a NULL   PASA';

  UPDATE public.users SET website = o_web_autor WHERE id = v_autor;

  -- 6. Quien no tiene pagina publica NO esta en la vista
  SET LOCAL ROLE anon;
  SELECT count(*) INTO v_n FROM public.perfiles_publicos WHERE id = v_nadie;
  RESET ROLE;
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'PRUEBA 6 FALLIDA: alguien sin pagina publica sale en la vista.';
  END IF;
  RAISE NOTICE 'PRUEBA 6  sin pagina publica, no sale en la vista              PASA';

  -- 7. LA RAMA DE MENTOR, que hoy no tiene ni un caso real: se fabrica uno.
  --
  -- Hoy user_roles no tiene ninguna fila de mentor activa, asi que /mentores/[id]
  -- responde 404 para todo el mundo. Sin este trozo, la rama de mentor de la
  -- vista se quedaria sin probar, y una rama sin probar es la que falla el dia
  -- que se nombre al primer mentor. Se da de alta, se comprueba y se retira.
  INSERT INTO public.user_roles (user_id, role, notes)
  VALUES (v_nadie, 'mentor', 'prueba de la migracion 104, se retira sola')
  ON CONFLICT (user_id, role) DO UPDATE SET is_active = true;

  UPDATE public.users SET bio = 'bio de mentor de prueba' WHERE id = v_nadie;

  SET LOCAL ROLE anon;
  SELECT bio INTO v_bio FROM public.perfiles_publicos WHERE id = v_nadie AND es_mentor;
  RESET ROLE;
  IF v_bio IS DISTINCT FROM 'bio de mentor de prueba' THEN
    RAISE EXCEPTION 'PRUEBA 7 FALLIDA: un mentor activo no sale en la vista con su bio (leyo %).', coalesce(v_bio, 'NULL');
  END IF;
  RAISE NOTICE 'PRUEBA 7  un mentor activo sale en la vista con su bio         PASA';

  DELETE FROM public.user_roles WHERE user_id = v_nadie AND role = 'mentor';
  UPDATE public.users SET bio = o_bio_nadie WHERE id = v_nadie;

  SET LOCAL ROLE anon;
  SELECT count(*) INTO v_n FROM public.perfiles_publicos WHERE id = v_nadie;
  RESET ROLE;
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'PRUEBA 7 FALLIDA: al retirar el rol de mentor, la fila sigue en la vista.';
  END IF;
  RAISE NOTICE 'PRUEBA 7b al retirarle el rol, deja de estar en la vista       PASA';

  -- 8. Y lo que no se puede romper: la fila propia por mi_perfil()
  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claims',
                     json_build_object('sub', v_instructor::text, 'role', 'authenticated')::text,
                     true);
  SELECT bio INTO v_bio FROM public.mi_perfil();
  RESET ROLE;

  IF v_bio IS DISTINCT FROM 'biografia de prueba 104' THEN
    RAISE EXCEPTION 'PRUEBA 8 FALLIDA: mi_perfil() no devuelve bio (devolvio %). El formulario de perfil y el paso 1 del onboarding quedarian sin datos.', coalesce(v_bio, 'NULL');
  END IF;
  RAISE NOTICE 'PRUEBA 8  mi_perfil() sigue devolviendo la bio propia          PASA';

  -- 9. Todo EXACTAMENTE como estaba, comparado contra los valores originales
  UPDATE public.users SET bio = o_bio_instr, website = o_web_instr WHERE id = v_instructor;

  IF (SELECT bio     FROM public.users WHERE id = v_instructor) IS DISTINCT FROM o_bio_instr
     OR (SELECT website FROM public.users WHERE id = v_instructor) IS DISTINCT FROM o_web_instr
     OR (SELECT website FROM public.users WHERE id = v_autor)      IS DISTINCT FROM o_web_autor
     OR (SELECT bio     FROM public.users WHERE id = v_nadie)      IS DISTINCT FROM o_bio_nadie
     OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = v_nadie AND role = 'mentor') THEN
    RAISE EXCEPTION 'PRUEBA 9 FALLIDA: la base no ha quedado como estaba.';
  END IF;
  RAISE NOTICE 'PRUEBA 9  cada valor vuelve a ser el que era                   PASA';

  RAISE NOTICE 'Las nueve pruebas pasan.';
END
$prueba$;

COMMIT;

-- ============================================================================
-- VERIFICACION
-- ============================================================================

SELECT
  -- bio, cerrada en la tabla
  has_column_privilege('anon',          'public.users', 'bio', 'SELECT')          AS anon_lee_bio,
  has_column_privilege('authenticated', 'public.users', 'bio', 'SELECT')          AS auth_lee_bio,

  -- y abierta en la vista
  has_table_privilege('anon',          'public.perfiles_publicos', 'SELECT')      AS anon_lee_vista,
  has_table_privilege('authenticated', 'public.perfiles_publicos', 'SELECT')      AS auth_lee_vista,

  -- la vista anterior ya no esta
  EXISTS (SELECT 1 FROM pg_views
           WHERE schemaname = 'public' AND viewname = 'enlaces_publicos_de_instructor') AS vista_vieja_sigue,

  -- lo que sigue igual
  has_column_privilege('anon', 'public.users', 'full_name', 'SELECT')             AS anon_lee_full_name,
  has_column_privilege('anon', 'public.users', 'role',      'SELECT')             AS anon_lee_role,
  has_column_privilege('anon', 'public.users', 'email',     'SELECT')             AS anon_lee_email,
  (SELECT count(*) FROM (VALUES ('bio'),('website'),('twitter'),('linkedin'),('github')) AS c(col)
    WHERE has_column_privilege('authenticated', 'public.users', c.col, 'UPDATE')) AS columnas_escribibles_de_5,

  -- quien hay detras de la vista, y por que
  (SELECT count(*) FROM public.perfiles_publicos)                                 AS filas_en_la_vista,
  (SELECT count(*) FROM public.perfiles_publicos WHERE es_instructor)              AS por_instructor,
  (SELECT count(*) FROM public.perfiles_publicos WHERE es_mentor)                  AS por_mentor,
  (SELECT count(*) FROM public.perfiles_publicos WHERE es_autor)                   AS por_autor,
  (SELECT count(*) FROM public.users)                                             AS usuarios,

  CASE
    WHEN NOT has_column_privilege('anon',          'public.users', 'bio', 'SELECT')
     AND NOT has_column_privilege('authenticated', 'public.users', 'bio', 'SELECT')
     AND has_table_privilege('anon',          'public.perfiles_publicos', 'SELECT')
     AND has_table_privilege('authenticated', 'public.perfiles_publicos', 'SELECT')
     AND NOT EXISTS (SELECT 1 FROM pg_views
                      WHERE schemaname = 'public' AND viewname = 'enlaces_publicos_de_instructor')
     AND has_column_privilege('anon', 'public.users', 'full_name', 'SELECT')
     AND has_column_privilege('anon', 'public.users', 'role',      'SELECT')
     AND NOT has_column_privilege('anon', 'public.users', 'email', 'SELECT')
     AND (SELECT count(*) FROM (VALUES ('bio'),('website'),('twitter'),('linkedin'),('github')) AS c(col)
           WHERE has_column_privilege('authenticated', 'public.users', c.col, 'UPDATE')) = 5
     AND (SELECT count(*) FROM public.perfiles_publicos) > 0
      THEN 'TODO CORRECTO'
    ELSE 'REVISAR: mira las columnas de esta misma fila'
  END                                                                             AS veredicto;

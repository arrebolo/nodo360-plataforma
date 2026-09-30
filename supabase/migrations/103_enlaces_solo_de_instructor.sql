-- ============================================================================
-- MIGRACION 103: los enlaces del perfil solo son publicos si hay perfil publico
--
-- LO QUE HIZO MAL LA 101
-- La 101 abrio website, twitter, linkedin y github a anon con un GRANT de
-- columna. Un GRANT de columna es por ROL, no por fila: no distingue «los
-- enlaces de un instructor» de «los enlaces de cualquiera». El perfil publico
-- del instructor era el unico que los necesitaba, y se abrieron para toda la
-- tabla.
--
-- CUANTO SE ABRIO DE VERDAD, MEDIDO
-- Menos de lo que parece, porque las FILAS ya estaban limitadas antes: la
-- politica de lectura de `users` no deja ver a los estudiantes. Comprobado con
-- la clave anonima: 4 filas visibles de 26, y las 22 ocultas son todas
-- `student`. Las 4 visibles son 2 admin, 1 mentor y 1 instructor.
--
-- Asi que lo expuesto eran los enlaces de las cuentas con rol admin, mentor e
-- instructor. No es una fuga de datos de los alumnos, pero tampoco es lo que se
-- pedia: el sitio publico de un enlace es un perfil publico.
--
-- COMO SE CIERRA
-- Se revoca el GRANT de las cuatro columnas —a anon Y a authenticated— y los
-- enlaces salen por una vista que solo devuelve filas con perfil de instructor
-- ACTIVO. Es el patron de `sellos_de_instructor` (093): una vista normal corre
-- con los privilegios de su dueño, asi que puede leer una tabla cerrada y
-- enseñar de ella solo la proyeccion que es segura.
--
-- POR QUE TAMBIEN SE LE QUITA A authenticated
-- Porque no lo necesita. Comprobado: el unico sitio del codigo que lee esas
-- cuatro columnas es el perfil publico del instructor, y la fila PROPIA no se
-- lee por SELECT sino por mi_perfil(), que es SECURITY DEFINER y no depende de
-- estos GRANT. El formulario de perfil escribe con UPDATE y no pide devolucion,
-- asi que tampoco necesita SELECT. La prueba de aqui abajo lo comprueba en vez
-- de suponerlo.
--
-- LO QUE ESTA MIGRACION NO TOCA: `bio`
-- bio es publica desde la 049, no desde la 101, y hoy la leen en publico TRES
-- sitios: el perfil del instructor, el perfil del mentor (/mentores/[id]) y el
-- modal de autor que sale en las tarjetas y en la cabecera de los cursos
-- (CourseCard y CourseHero), donde el autor de los cursos publicados es una
-- cuenta admin. Cerrarla exige llevar esos tres a vistas, y eso no se hace a
-- ciegas en la misma migracion que revoca. Queda propuesto aparte.
--
-- NO BORRA NI UNA FILA. Es reejecutable. Y se prueba a si misma, leyendo de
-- verdad como anon y como authenticated.
-- ============================================================================

BEGIN;

-- =====================================================
-- 1. La vista: enlaces de quien tiene perfil publico
-- =====================================================

CREATE OR REPLACE VIEW public.enlaces_publicos_de_instructor AS
  SELECT
    u.id AS user_id,
    u.website,
    u.twitter,
    u.linkedin,
    u.github
  FROM public.users u
  JOIN public.instructor_profiles p
    ON p.user_id = u.id
   AND p.is_active;

COMMENT ON VIEW public.enlaces_publicos_de_instructor IS
  'Los enlaces del perfil de quien tiene perfil de instructor ACTIVO, y de nadie mas. Existe porque un GRANT de columna sobre users no distingue filas: la 101 abrio las cuatro columnas a anon y con ellas los enlaces de cualquier cuenta no-estudiante. Vista normal a proposito (no SECURITY INVOKER): corre con los privilegios de su dueño, que es lo que le permite leer columnas que anon ya no puede leer. Si alguien desactiva su perfil de instructor, sus enlaces dejan de ser publicos sin tocar nada mas.';

REVOKE ALL ON public.enlaces_publicos_de_instructor FROM PUBLIC;
GRANT SELECT ON public.enlaces_publicos_de_instructor TO anon, authenticated;

-- =====================================================
-- 2. Y se cierran las columnas en la tabla
-- =====================================================

REVOKE SELECT (website, twitter, linkedin, github) ON public.users FROM anon;
REVOKE SELECT (website, twitter, linkedin, github) ON public.users FROM authenticated;

COMMENT ON COLUMN public.users.website IS
  'Enlace propio. NO es legible por anon ni authenticated desde la 103: sale por la vista enlaces_publicos_de_instructor, que solo devuelve filas con perfil de instructor activo. La fila propia se lee con mi_perfil(). Tiene CHECK de formato desde la 101.';
COMMENT ON COLUMN public.users.twitter IS
  'Perfil de X. Admite la URL completa o el nombre con arroba: se normaliza al pintarlo, y por eso no lleva CHECK. Cerrada en la tabla desde la 103; sale por enlaces_publicos_de_instructor.';
COMMENT ON COLUMN public.users.linkedin IS
  'Perfil de LinkedIn. Cerrada en la tabla desde la 103; sale por enlaces_publicos_de_instructor.';
COMMENT ON COLUMN public.users.github IS
  'Perfil de GitHub. Cerrada en la tabla desde la 103; sale por enlaces_publicos_de_instructor.';

-- =====================================================
-- 3. La prueba, leyendo de verdad
-- =====================================================

DO $prueba$
DECLARE
  v_instructor uuid;
  v_otro       uuid;
  v_n          integer;
  v_web        text;
BEGIN
  SELECT p.user_id INTO v_instructor
    FROM public.instructor_profiles p
   WHERE p.is_active
   LIMIT 1;

  -- Alguien SIN perfil de instructor y que anon si puede ver por filas (no student)
  SELECT u.id INTO v_otro
    FROM public.users u
   WHERE u.role <> 'student'
     AND NOT EXISTS (SELECT 1 FROM public.instructor_profiles p WHERE p.user_id = u.id)
   LIMIT 1;

  IF v_instructor IS NULL OR v_otro IS NULL THEN
    RAISE EXCEPTION 'La prueba necesita un instructor con perfil activo y alguien no-estudiante sin perfil. instructor=% otro=%', v_instructor, v_otro;
  END IF;

  -- 1. anon YA NO puede leer los enlaces de la tabla
  BEGIN
    SET LOCAL ROLE anon;
    PERFORM website FROM public.users WHERE id = v_instructor;
    RESET ROLE;
    RAISE EXCEPTION 'PRUEBA 1 FALLIDA: anon todavia lee users.website.';
  EXCEPTION WHEN insufficient_privilege THEN
    RESET ROLE;
    RAISE NOTICE 'PRUEBA 1  anon ya no lee users.website                         PASA';
  END;

  -- 2. authenticated tampoco
  BEGIN
    SET LOCAL ROLE authenticated;
    PERFORM twitter FROM public.users WHERE id = v_instructor;
    RESET ROLE;
    RAISE EXCEPTION 'PRUEBA 2 FALLIDA: authenticated todavia lee users.twitter.';
  EXCEPTION WHEN insufficient_privilege THEN
    RESET ROLE;
    RAISE NOTICE 'PRUEBA 2  authenticated ya no lee users.twitter               PASA';
  END;

  -- 3. Pero anon SI lee la vista, y ahi esta el instructor
  SET LOCAL ROLE anon;
  SELECT count(*) INTO v_n
    FROM public.enlaces_publicos_de_instructor
   WHERE user_id = v_instructor;
  RESET ROLE;
  IF v_n <> 1 THEN
    RAISE EXCEPTION 'PRUEBA 3 FALLIDA: la vista devolvio % filas para el instructor, esperaba 1.', v_n;
  END IF;
  RAISE NOTICE 'PRUEBA 3  anon lee los enlaces del instructor por la vista      PASA';

  -- 4. Y quien no tiene perfil de instructor NO esta en la vista
  SET LOCAL ROLE anon;
  SELECT count(*) INTO v_n
    FROM public.enlaces_publicos_de_instructor
   WHERE user_id = v_otro;
  RESET ROLE;
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'PRUEBA 4 FALLIDA: la vista devolvio % filas para una cuenta sin perfil de instructor.', v_n;
  END IF;
  RAISE NOTICE 'PRUEBA 4  sin perfil de instructor, no sale en la vista         PASA';

  -- 5. Y lo que no se puede romper: la fila propia por mi_perfil()
  --
  -- Aqui es donde se comprobaria si revocarle el SELECT a authenticated ha roto
  -- el formulario de perfil. mi_perfil() es SECURITY DEFINER, asi que no debe
  -- depender del GRANT: se impersona una sesion de verdad para verlo.
  UPDATE public.users SET website = 'https://prueba-103.invalid' WHERE id = v_instructor;

  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claims',
                     json_build_object('sub', v_instructor::text, 'role', 'authenticated')::text,
                     true);
  SELECT website INTO v_web FROM public.mi_perfil();
  RESET ROLE;

  IF v_web IS DISTINCT FROM 'https://prueba-103.invalid' THEN
    RAISE EXCEPTION 'PRUEBA 5 FALLIDA: mi_perfil() no devuelve website (devolvio %). El formulario de perfil quedaria sin datos.', coalesce(v_web, 'NULL');
  END IF;
  RAISE NOTICE 'PRUEBA 5  mi_perfil() sigue devolviendo los enlaces propios     PASA';

  -- Se deja como estaba
  UPDATE public.users SET website = NULL WHERE id = v_instructor;
  IF (SELECT website FROM public.users WHERE id = v_instructor) IS NOT NULL THEN
    RAISE EXCEPTION 'PRUEBA 6 FALLIDA: no se restauro website a NULL.';
  END IF;
  RAISE NOTICE 'PRUEBA 6  la fila de prueba queda como estaba                   PASA';

  RAISE NOTICE 'Las seis pruebas pasan.';
END
$prueba$;

COMMIT;

-- ============================================================================
-- VERIFICACION
-- ============================================================================

SELECT
  -- Cerrado en la tabla
  has_column_privilege('anon',          'public.users', 'website',  'SELECT')     AS anon_lee_website,
  has_column_privilege('anon',          'public.users', 'twitter',  'SELECT')     AS anon_lee_twitter,
  has_column_privilege('anon',          'public.users', 'linkedin', 'SELECT')     AS anon_lee_linkedin,
  has_column_privilege('anon',          'public.users', 'github',   'SELECT')     AS anon_lee_github,
  has_column_privilege('authenticated', 'public.users', 'website',  'SELECT')     AS auth_lee_website,

  -- Abierto en la vista
  has_table_privilege('anon',          'public.enlaces_publicos_de_instructor', 'SELECT') AS anon_lee_vista,
  has_table_privilege('authenticated', 'public.enlaces_publicos_de_instructor', 'SELECT') AS auth_lee_vista,

  -- Lo que sigue escribiendose y leyendose igual
  (SELECT count(*) FROM (VALUES ('bio'),('website'),('twitter'),('linkedin'),('github')) AS c(col)
    WHERE has_column_privilege('authenticated', 'public.users', c.col, 'UPDATE')) AS columnas_escribibles_de_5,
  has_column_privilege('anon', 'public.users', 'bio', 'SELECT')                   AS anon_lee_bio_sin_tocar,
  has_column_privilege('anon', 'public.users', 'email', 'SELECT')                 AS anon_lee_email,

  -- Cuantos perfiles hay detras de la vista
  (SELECT count(*) FROM public.enlaces_publicos_de_instructor)                    AS filas_en_la_vista,
  (SELECT count(*) FROM public.instructor_profiles WHERE is_active)               AS perfiles_activos,

  CASE
    WHEN NOT has_column_privilege('anon',          'public.users', 'website',  'SELECT')
     AND NOT has_column_privilege('anon',          'public.users', 'twitter',  'SELECT')
     AND NOT has_column_privilege('anon',          'public.users', 'linkedin', 'SELECT')
     AND NOT has_column_privilege('anon',          'public.users', 'github',   'SELECT')
     AND NOT has_column_privilege('authenticated', 'public.users', 'website',  'SELECT')
     AND has_table_privilege('anon',          'public.enlaces_publicos_de_instructor', 'SELECT')
     AND has_table_privilege('authenticated', 'public.enlaces_publicos_de_instructor', 'SELECT')
     AND (SELECT count(*) FROM (VALUES ('bio'),('website'),('twitter'),('linkedin'),('github')) AS c(col)
           WHERE has_column_privilege('authenticated', 'public.users', c.col, 'UPDATE')) = 5
     AND NOT has_column_privilege('anon', 'public.users', 'email', 'SELECT')
     AND (SELECT count(*) FROM public.enlaces_publicos_de_instructor)
       = (SELECT count(*) FROM public.instructor_profiles WHERE is_active)
      THEN 'TODO CORRECTO'
    ELSE 'REVISAR: mira las columnas de esta misma fila'
  END                                                                            AS veredicto;

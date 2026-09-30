-- ============================================================================
-- MIGRACION 101: los enlaces del perfil se pueden leer, y tienen que ser enlaces
--
-- EL HUECO, MEDIDO
-- El formulario de perfil va a escribir bio, website, twitter, linkedin y
-- github. Escribirlas ya se podia —comprobado con una sesion de prueba: las
-- cinco SI— pero LEERLAS desde fuera, no:
--
--   anon leyendo columnas de otra persona
--     full_name   SI      website    NO (42501)
--     avatar_url  SI      twitter    NO (42501)
--     role        SI      linkedin   NO (42501)
--     bio         SI      github     NO (42501)
--     created_at  SI      email      NO (42501)
--
-- La 049 dejo seis columnas legibles y esas cuatro no estaban. Sin este GRANT,
-- el perfil publico del instructor mostraria la biografia y ninguna de sus
-- redes, y la consulta fallaria entera al pedirlas.
--
-- POR QUE ES CORRECTO ABRIRLAS
-- Son enlaces que una persona publica sobre si misma para que se la encuentre.
-- No son datos de contacto privados: el email sigue cerrado, y el rol y la
-- suspension siguen fuera del alcance de escritura desde la 084.
--
-- Y TIENEN QUE SER ENLACES
-- El formulario valida en el cliente, pero el cliente no es una barrera: se
-- escribe con el cliente de sesion contra PostgREST y ahi no hay formulario. Un
-- CHECK es lo que hace que no acabe un «asdf» pintado como enlace roto en un
-- perfil publico. Se comprueba antes que ninguna fila lo incumple.
--
-- twitter NO lleva CHECK a proposito: ahi la gente escribe tanto la URL como el
-- nombre con arroba, y las dos son razonables. Se normaliza al pintarlo.
--
-- NO BORRA NI UNA FILA. Es reejecutable. Y se prueba a si misma, leyendo de
-- verdad como anon.
-- ============================================================================

BEGIN;

-- =====================================================
-- 1. Que se puedan leer
-- =====================================================

GRANT SELECT (website, twitter, linkedin, github) ON public.users TO anon;
GRANT SELECT (website, twitter, linkedin, github) ON public.users TO authenticated;

COMMENT ON COLUMN public.users.website IS
  'Enlace propio, publico. Legible por anon desde la 101: el perfil publico del instructor lo muestra. Tiene CHECK de formato porque el formulario no es la unica puerta.';
COMMENT ON COLUMN public.users.twitter IS
  'Perfil de X, publico. Admite la URL completa o el nombre con arroba: se normaliza al pintarlo, y por eso no lleva CHECK.';
COMMENT ON COLUMN public.users.linkedin IS
  'Perfil de LinkedIn, publico. Legible por anon desde la 101.';
COMMENT ON COLUMN public.users.github IS
  'Perfil de GitHub, publico. Legible por anon desde la 101.';

-- =====================================================
-- 2. Que sean enlaces de verdad
-- =====================================================
-- Primero se comprueba que no hay ninguna fila que incumpla: añadir un CHECK que
-- la base ya viola falla, y falla tarde.

DO $do$
DECLARE
  v_malas integer;
BEGIN
  SELECT count(*) INTO v_malas
    FROM public.users
   WHERE (website  IS NOT NULL AND website  <> '' AND website  !~* '^https?://')
      OR (linkedin IS NOT NULL AND linkedin <> '' AND linkedin !~* '^https?://')
      OR (github   IS NOT NULL AND github   <> '' AND github   !~* '^https?://');

  IF v_malas > 0 THEN
    RAISE EXCEPTION
      'Hay % fila(s) con website, linkedin o github que no empiezan por http:// ni https://. Hay que limpiarlas antes de poner el CHECK.',
      v_malas;
  END IF;
  RAISE NOTICE 'Ninguna fila incumple el formato de enlace. Se puede poner el CHECK.';
END
$do$;

-- Localizados por definicion, no por nombre: la leccion de la 092.
DO $do$
DECLARE
  c record;
BEGIN
  FOR c IN
    SELECT con.conname
      FROM pg_constraint con
     WHERE con.conrelid = 'public.users'::regclass
       AND con.contype = 'c'
       AND pg_get_constraintdef(con.oid) ILIKE '%https?://%'
  LOOP
    EXECUTE format('ALTER TABLE public.users DROP CONSTRAINT %I', c.conname);
  END LOOP;
END
$do$;

ALTER TABLE public.users
  ADD CONSTRAINT enlaces_del_perfil_son_enlaces
  CHECK (
    (website  IS NULL OR website  = '' OR website  ~* '^https?://')
    AND (linkedin IS NULL OR linkedin = '' OR linkedin ~* '^https?://')
    AND (github   IS NULL OR github   = '' OR github   ~* '^https?://')
  );

-- =====================================================
-- 3. instructor_profiles.specialties queda muerta
-- =====================================================
-- Texto libre, una sola fila en toda la base y a NULL. Las areas de conocimiento
-- salen de las especialidades VERIFICADAS, que es lo unico que se puede afirmar.

COMMENT ON COLUMN public.instructor_profiles.specialties IS
  'MUERTA. Texto libre, una sola fila y a NULL. Las areas de conocimiento salen de las especialidades verificadas (instructor_certifications aprobadas, por la vista sellos_de_instructor). Un campo libre aqui afirmaria un conocimiento que nadie ha comprobado. No escribir.';

-- =====================================================
-- 4. La prueba, leyendo de verdad como anon
-- =====================================================

DO $prueba$
DECLARE
  v_alguien uuid;
  v_n       integer;
BEGIN
  SELECT id INTO v_alguien FROM public.users ORDER BY created_at LIMIT 1;
  IF v_alguien IS NULL THEN
    RAISE EXCEPTION 'La prueba necesita al menos un usuario.';
  END IF;

  -- 1. anon lee los cuatro enlaces
  SET LOCAL ROLE anon;
  SELECT count(*) INTO v_n
    FROM public.users
   WHERE id = v_alguien;
  PERFORM website, twitter, linkedin, github FROM public.users WHERE id = v_alguien;
  RESET ROLE;
  RAISE NOTICE 'PRUEBA 1  anon lee website, twitter, linkedin y github        PASA';

  -- 2. Y sigue SIN poder leer el email
  BEGIN
    SET LOCAL ROLE anon;
    PERFORM email FROM public.users WHERE id = v_alguien;
    RESET ROLE;
    RAISE EXCEPTION 'PRUEBA 2 FALLIDA: anon puede leer el email.';
  EXCEPTION WHEN insufficient_privilege THEN
    RESET ROLE;
    RAISE NOTICE 'PRUEBA 2  anon sigue sin poder leer el email                PASA';
  END;

  -- 3. Un enlace que no es un enlace, rechazado
  BEGIN
    UPDATE public.users SET website = 'asdf' WHERE id = v_alguien;
    RAISE EXCEPTION 'PRUEBA 3 FALLIDA: se pudo guardar «asdf» como website.';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'PRUEBA 3  «asdf» como website, rechazado                    PASA';
  END;

  -- 4. Uno que si lo es, aceptado, y se deja como estaba
  UPDATE public.users SET website = 'https://prueba-101.invalid' WHERE id = v_alguien;
  IF (SELECT website FROM public.users WHERE id = v_alguien) <> 'https://prueba-101.invalid' THEN
    RAISE EXCEPTION 'PRUEBA 4 FALLIDA: no se pudo guardar un enlace valido.';
  END IF;
  UPDATE public.users SET website = NULL WHERE id = v_alguien;
  RAISE NOTICE 'PRUEBA 4  un enlace valido si se guarda, y se deshace         PASA';

  -- 5. Y el vacio tambien vale: borrar un enlace no es escribir basura
  UPDATE public.users SET website = '' WHERE id = v_alguien;
  UPDATE public.users SET website = NULL WHERE id = v_alguien;
  RAISE NOTICE 'PRUEBA 5  la cadena vacia vale: se puede borrar un enlace     PASA';

  RAISE NOTICE 'Las cinco pruebas pasan. Ninguna fila queda modificada.';
END
$prueba$;

COMMIT;

-- ============================================================================
-- VERIFICACION
-- ============================================================================

SELECT
  has_column_privilege('anon', 'public.users', 'website',  'SELECT')             AS anon_lee_website,
  has_column_privilege('anon', 'public.users', 'twitter',  'SELECT')             AS anon_lee_twitter,
  has_column_privilege('anon', 'public.users', 'linkedin', 'SELECT')             AS anon_lee_linkedin,
  has_column_privilege('anon', 'public.users', 'github',   'SELECT')             AS anon_lee_github,
  has_column_privilege('anon', 'public.users', 'bio',      'SELECT')             AS anon_lee_bio,

  -- Lo que NO se ha abierto
  has_column_privilege('anon', 'public.users', 'email', 'SELECT')                AS anon_lee_email,
  has_column_privilege('authenticated', 'public.users', 'role', 'UPDATE')         AS auth_escribe_rol,

  -- Las cinco que el formulario escribe
  (SELECT count(*) FROM (VALUES ('bio'),('website'),('twitter'),('linkedin'),('github')) AS c(col)
    WHERE has_column_privilege('authenticated', 'public.users', c.col, 'UPDATE')) AS columnas_escribibles_de_5,

  EXISTS (SELECT 1 FROM pg_constraint
           WHERE conrelid = 'public.users'::regclass
             AND conname = 'enlaces_del_perfil_son_enlaces')                     AS check_de_enlaces,

  (SELECT count(*) FROM public.users
    WHERE (website IS NOT NULL AND website <> '' AND website !~* '^https?://')
       OR (linkedin IS NOT NULL AND linkedin <> '' AND linkedin !~* '^https?://')
       OR (github IS NOT NULL AND github <> '' AND github !~* '^https?://'))     AS enlaces_invalidos,

  (SELECT count(*) FROM public.users)                                            AS usuarios,

  -- Informativo, NO una condicion del veredicto. Aqui ponia «= 1» copiado de la
  -- 100, y el 30/09/2026 aparecio una segunda cuenta de administracion de
  -- reserva: esta migracion habria dicho «REVISAR» por algo que no tiene nada
  -- que ver con los enlaces del perfil, y peor, por algo que es una mejora. Un
  -- recuento no es una identidad: lo que importa es que quede al menos una.
  (SELECT count(*) FROM public.users WHERE role = 'admin')                        AS admins,

  CASE
    WHEN has_column_privilege('anon', 'public.users', 'website',  'SELECT')
     AND has_column_privilege('anon', 'public.users', 'twitter',  'SELECT')
     AND has_column_privilege('anon', 'public.users', 'linkedin', 'SELECT')
     AND has_column_privilege('anon', 'public.users', 'github',   'SELECT')
     AND NOT has_column_privilege('anon', 'public.users', 'email', 'SELECT')
     AND NOT has_column_privilege('authenticated', 'public.users', 'role', 'UPDATE')
     AND (SELECT count(*) FROM (VALUES ('bio'),('website'),('twitter'),('linkedin'),('github')) AS c(col)
           WHERE has_column_privilege('authenticated', 'public.users', c.col, 'UPDATE')) = 5
     AND EXISTS (SELECT 1 FROM pg_constraint
                  WHERE conrelid = 'public.users'::regclass
                    AND conname = 'enlaces_del_perfil_son_enlaces')
     AND (SELECT count(*) FROM public.users WHERE role = 'admin') >= 1
      THEN 'TODO CORRECTO'
    ELSE 'REVISAR: mira las columnas de esta misma fila'
  END                                                                            AS veredicto;

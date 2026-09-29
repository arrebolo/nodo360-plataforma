-- ============================================================================
-- MIGRACION 093: quien lee las certificaciones, y el catalogo que no se leia
--
-- Dos agujeros, los dos medidos con la clave anonima y con una cuenta de
-- prueba, antes de escribir la pantalla del evaluador del paso 4.
--
-- 1. LOS DATOS PERSONALES DE UNA CERTIFICACION ERAN DE LECTURA PUBLICA
--    Con la clave anonima —que es publica— y con cualquier sesion:
--
--      anon      -> SELECT sobre instructor_certifications: OK
--      con sesion -> lee accreditation_ref y evaluator_notes: OK
--
--    La 092 acaba de añadir esas dos columnas. accreditation_ref es un numero
--    de colegiacion o la referencia de un titulo, y evaluator_notes son las
--    notas de quien evalua sobre una persona concreta. Con cero filas no se
--    filtraba nada todavia; en cuanto hubiera una certificacion, si.
--
--    El sello publico necesita leer ALGO, pero no eso. Por eso el acceso
--    directo a la tabla se cierra y lo publico sale por una vista con los
--    campos justos.
--
-- 2. EL CATALOGO DE ESPECIALIDADES NO SE PODIA LEER SIN SESION
--    La 090 le dio GRANT SELECT a anon y una politica
--    USING (is_active OR public.es_admin_actual()). Pero la 034 revoco a anon
--    el EXECUTE de es_admin_actual(), asi que evaluar la politica falla:
--
--      anon -> instructor_specialties: 42501 permission denied for function
--              es_admin_actual
--
--    La verificacion de la 090 dijo anon_lee true porque preguntaba
--    has_table_privilege, que mira el GRANT y no ejecuta la politica. Nunca
--    intento una lectura. Es el mismo error que comprobar una restriccion por
--    su nombre en vez de por su definicion: medir lo que se puede medir en vez
--    de lo que importa.
--
--    Se arregla partiendo la politica por rol, para que anon no llegue nunca a
--    esa funcion.
--
-- NO BORRA NI UNA FILA. Es reejecutable. Y se prueba a si misma, incluida una
-- lectura REAL haciendose pasar por anon, que es lo que faltaba en la 090.
-- ============================================================================

BEGIN;

-- =====================================================
-- 1. El catalogo, legible sin sesion de verdad
-- =====================================================

DO $do$
DECLARE
  p record;
BEGIN
  FOR p IN
    SELECT policyname FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'instructor_specialties' AND cmd = 'SELECT'
  LOOP
    RAISE NOTICE 'Retirando politica SELECT de instructor_specialties: %', p.policyname;
    EXECUTE format('DROP POLICY %I ON public.instructor_specialties', p.policyname);
  END LOOP;
END
$do$;

-- Sin sesion: solo las activas, y sin tocar ninguna funcion que anon no pueda
-- ejecutar. Es la mitad del arreglo: la politica anterior era correcta en
-- intencion y no se podia evaluar.
CREATE POLICY "El catalogo activo se lee sin sesion"
  ON public.instructor_specialties
  FOR SELECT
  TO anon
  USING (is_active);

-- Con sesion: igual, y la administracion ve tambien las desactivadas.
CREATE POLICY "El catalogo se lee con sesion, y entero si es administracion"
  ON public.instructor_specialties
  FOR SELECT
  TO authenticated
  USING (is_active OR public.es_admin_actual());

-- =====================================================
-- 2. Las certificaciones dejan de ser de lectura publica
-- =====================================================

ALTER TABLE public.instructor_certifications ENABLE ROW LEVEL SECURITY;

DO $do$
DECLARE
  p record;
BEGIN
  FOR p IN
    SELECT policyname, cmd, coalesce(qual, '(sin USING)') AS usando
      FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'instructor_certifications'
  LOOP
    RAISE NOTICE 'Retirando politica de instructor_certifications: % (%) · USING %', p.policyname, p.cmd, p.usando;
    EXECUTE format('DROP POLICY %I ON public.instructor_certifications', p.policyname);
  END LOOP;
END
$do$;

-- Su propia certificacion, entera: es su numero de colegiacion y su evaluacion.
CREATE POLICY "Cada uno ve sus propias certificaciones"
  ON public.instructor_certifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "La administracion ve todas las certificaciones"
  ON public.instructor_certifications
  FOR SELECT
  TO authenticated
  USING (public.es_admin_actual());

-- Escribir, solo desde el servidor. La pantalla del evaluador va con el cliente
-- de servicio detras de requireAdmin(), como el resto del panel: ninguna sesion
-- necesita INSERT ni UPDATE aqui, y dejarlo abierto seria dar de alta
-- certificaciones desde PostgREST.
REVOKE ALL ON public.instructor_certifications FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.instructor_certifications FROM authenticated;
GRANT SELECT ON public.instructor_certifications TO authenticated;

COMMENT ON TABLE public.instructor_certifications IS
  'Verificaciones de instructor. Lectura: la propia o la administracion. Escritura: solo el cliente de servicio. Antes de la 093 la leia hasta la clave anonima, con accreditation_ref y evaluator_notes dentro. Lo publico sale por la vista sellos_de_instructor.';

-- =====================================================
-- 3. La vista publica: los campos justos y ni uno mas
-- =====================================================
-- Una vista normal, no SECURITY INVOKER: se ejecuta con los privilegios de su
-- dueño y por eso puede leer la tabla que anon ya no ve. Eso es lo que la
-- convierte en la unica puerta publica, con la proyeccion elegida a mano.
--
-- Lo que NO sale: accreditation_ref, accreditation_type, evaluator_notes,
-- evaluator_id, revoked_reason, exam_id, attempt_id. Ni el id de la fila.
--
-- certification_number SI sale: es el identificador de la credencial, no un
-- dato personal, y las dos paginas del sello ya lo mostraban.

DROP VIEW IF EXISTS public.sellos_de_instructor;

CREATE VIEW public.sellos_de_instructor AS
  SELECT
    c.user_id,
    c.certification_number,
    e.slug        AS especialidad_slug,
    e.nombre      AS especialidad,
    c.issued_at,
    c.expires_at,
    (c.expires_at IS NULL OR c.expires_at > now()) AS vigente
  FROM public.instructor_certifications c
  JOIN public.instructor_specialties e ON e.id = c.specialty_id
 WHERE c.status = 'aprobada'
   AND c.revoked_at IS NULL;

COMMENT ON VIEW public.sellos_de_instructor IS
  'Lo unico publico de una verificacion: quien, en que especialidad, desde cuando y hasta cuando. Sin el numero de colegiacion, sin las notas del evaluador y sin quien evaluo. Solo las aprobadas y no retiradas.';

GRANT SELECT ON public.sellos_de_instructor TO anon, authenticated;

-- =====================================================
-- 4. La prueba, con una lectura REAL haciendose pasar por anon
-- =====================================================
-- Es lo que le faltaba a la 090: preguntar por el privilegio no es leer. Aqui
-- se cambia de rol de verdad dentro de la transaccion y se intenta la consulta.

DO $prueba$
DECLARE
  v_n integer;
BEGIN
  -- 1. anon lee el catalogo activo
  SET LOCAL ROLE anon;
  SELECT count(*) INTO v_n FROM public.instructor_specialties;
  RESET ROLE;
  IF v_n < 1 THEN
    RAISE EXCEPTION 'PRUEBA 1 FALLIDA: anon no ve ninguna especialidad activa (vio %).', v_n;
  END IF;
  RAISE NOTICE 'PRUEBA 1  anon lee el catalogo: % especialidades             PASA', v_n;

  -- 2. anon NO lee las certificaciones
  BEGIN
    SET LOCAL ROLE anon;
    PERFORM 1 FROM public.instructor_certifications LIMIT 1;
    RESET ROLE;
    RAISE EXCEPTION 'PRUEBA 2 FALLIDA: anon todavia puede leer instructor_certifications.';
  EXCEPTION
    WHEN insufficient_privilege THEN
      RESET ROLE;
      RAISE NOTICE 'PRUEBA 2  anon ya no lee las certificaciones               PASA';
  END;

  -- 3. Pero si lee la vista publica
  SET LOCAL ROLE anon;
  SELECT count(*) INTO v_n FROM public.sellos_de_instructor;
  RESET ROLE;
  RAISE NOTICE 'PRUEBA 3  anon lee la vista publica: % sellos                PASA', v_n;

  -- 4. Y la vista no expone los datos personales
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'sellos_de_instructor'
       AND column_name IN ('accreditation_ref','accreditation_type','evaluator_notes',
                           'evaluator_id','revoked_reason','exam_id','attempt_id','id')
  ) THEN
    RAISE EXCEPTION 'PRUEBA 4 FALLIDA: la vista publica expone columnas que no debe.';
  END IF;
  RAISE NOTICE 'PRUEBA 4  la vista no expone datos personales               PASA';

  RAISE NOTICE 'Las cuatro pruebas pasan.';
END
$prueba$;

COMMIT;

-- ============================================================================
-- VERIFICACION
-- ============================================================================

SELECT
  (SELECT count(*) FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'instructor_specialties' AND cmd = 'SELECT')
                                                                          AS politicas_del_catalogo,

  -- Que ninguna politica dirigida a anon llame a una funcion que anon no puede
  -- ejecutar. Este es el fallo concreto de la 090.
  (SELECT count(*) FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'instructor_specialties'
      AND 'anon' = ANY (roles)
      AND coalesce(qual, '') ILIKE '%es_admin_actual%')                     AS politicas_de_anon_con_funcion_vetada,

  (SELECT count(*) FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'instructor_certifications') AS politicas_de_certificaciones,

  (SELECT relrowsecurity FROM pg_class
    WHERE oid = 'public.instructor_certifications'::regclass)               AS rls_en_certificaciones,

  has_table_privilege('anon', 'public.instructor_certifications', 'SELECT') AS anon_lee_certificaciones,
  has_table_privilege('authenticated', 'public.instructor_certifications', 'INSERT')
                                                                          AS auth_inserta_certificaciones,
  has_table_privilege('anon', 'public.sellos_de_instructor', 'SELECT')      AS anon_lee_la_vista,

  (SELECT count(*) FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sellos_de_instructor')  AS columnas_de_la_vista,

  (SELECT count(*) FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sellos_de_instructor'
      AND column_name IN ('accreditation_ref','accreditation_type','evaluator_notes',
                          'evaluator_id','revoked_reason','exam_id','attempt_id','id'))
                                                                          AS columnas_personales_filtradas,

  (SELECT count(*) FROM public.instructor_specialties WHERE is_active)      AS especialidades_activas,
  (SELECT count(*) FROM public.instructor_certifications)                  AS certificaciones,

  CASE
    WHEN (SELECT count(*) FROM pg_policies
           WHERE schemaname = 'public' AND tablename = 'instructor_specialties' AND cmd = 'SELECT') = 2
     AND (SELECT count(*) FROM pg_policies
           WHERE schemaname = 'public' AND tablename = 'instructor_specialties'
             AND 'anon' = ANY (roles)
             AND coalesce(qual, '') ILIKE '%es_admin_actual%') = 0
     AND (SELECT relrowsecurity FROM pg_class
           WHERE oid = 'public.instructor_certifications'::regclass)
     AND NOT has_table_privilege('anon', 'public.instructor_certifications', 'SELECT')
     AND NOT has_table_privilege('authenticated', 'public.instructor_certifications', 'INSERT')
     AND has_table_privilege('anon', 'public.sellos_de_instructor', 'SELECT')
     AND (SELECT count(*) FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = 'sellos_de_instructor'
             AND column_name IN ('accreditation_ref','accreditation_type','evaluator_notes',
                                 'evaluator_id','revoked_reason','exam_id','attempt_id','id')) = 0
      THEN 'TODO CORRECTO'
    ELSE 'REVISAR: mira las columnas de esta misma fila'
  END                                                                      AS veredicto;

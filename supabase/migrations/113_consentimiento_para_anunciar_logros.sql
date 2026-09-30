-- ============================================================================
-- MIGRACION 113: publicar el nombre de un alumno necesita su permiso
--
-- LO QUE ESTABA PASANDO
-- Dos anuncios automaticos publicaban el nombre de una persona en el grupo de
-- Telegram sin haberselo preguntado:
--
--   «🏆 Curso completado — X ha completado el curso Y. ¡Felicidades!»
--   «👋 Nuevo usuario beta — X se ha unido a la comunidad Nodo360!»
--
-- El segundo salta al conceder acceso beta, desde app/api/admin/users/beta.
-- Los dos con `defaultOptions = { inApp: true, discord: true, telegram: true }`,
-- o sea con los canales publicos encendidos por defecto y sin preguntar nada.
--
-- Terminar un curso es un logro de quien lo termina, y decidir si eso se cuenta en
-- publico tambien es suyo. El principio #8 es explicito.
--
-- LA COLUMNA
-- anunciar_logros, booleana, FALSE por defecto. Por defecto no se publica: un
-- consentimiento que hay que retirar no es un consentimiento.
--
-- Y HACE FALTA UN GRANT. Desde la 084 `users` no tiene privilegio de tabla para
-- authenticated, solo GRANT por columna, asi que una columna nueva nace NO
-- escribible —comprobado con welcome_email_sent_at en la 102, que dio
-- auth_la_escribe false—. Sin este GRANT, la casilla del perfil no podria
-- guardarse. La prueba de aqui abajo lo comprueba escribiendo de verdad como el
-- dueño de la fila.
--
-- NO se abre para LECTURA: el perfil propio se lee con mi_perfil(), que es
-- SECURITY DEFINER, y de quien puede anunciar solo tiene que enterarse el
-- servidor.
--
-- NO BORRA NI UNA FILA. Es reejecutable. Y se prueba a si misma.
-- ============================================================================

BEGIN;

-- =====================================================
-- 1. La columna
-- =====================================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS anunciar_logros boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.users.anunciar_logros IS
  'La persona acepta que sus logros —cursos completados— se anuncien con su nombre en los canales de la comunidad. FALSE por defecto: sin marcarla no se publica nada. Se cambia desde /dashboard/perfil. No es legible por anon ni authenticated: el propio dueño la lee por mi_perfil() y quien decide si publicar es el servidor.';

-- =====================================================
-- 2. Que su dueño pueda cambiarla
-- =====================================================

GRANT UPDATE (anunciar_logros) ON public.users TO authenticated;

-- =====================================================
-- 3. La prueba, escribiendo de verdad como el dueño
-- =====================================================

DO $prueba$
DECLARE
  v_persona uuid;
  v_antes   boolean;
  v_ahora   boolean;
  v_n       integer;
BEGIN
  SELECT id, anunciar_logros INTO v_persona, v_antes
    FROM public.users
   WHERE role = 'student'
   ORDER BY created_at
   LIMIT 1;

  IF v_persona IS NULL THEN
    RAISE EXCEPTION 'La prueba necesita un estudiante.';
  END IF;

  -- 1. Nadie la tiene activada: el valor por defecto es el correcto
  SELECT count(*) INTO v_n FROM public.users WHERE anunciar_logros;
  IF v_n <> 0 THEN
    RAISE NOTICE 'PRUEBA 1  ojo: % cuenta(s) ya la tienen activada', v_n;
  ELSE
    RAISE NOTICE 'PRUEBA 1  nadie la tiene activada: por defecto no se publica   PASA';
  END IF;

  -- 2. EL DUEÑO PUEDE CAMBIARLA. Se impersona una sesion de verdad: preguntar por
  --    el privilegio no es escribir, que es la leccion de la 090.
  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claims',
                     json_build_object('sub', v_persona::text, 'role', 'authenticated')::text,
                     true);

  UPDATE public.users SET anunciar_logros = true WHERE id = v_persona;
  RESET ROLE;

  SELECT anunciar_logros INTO v_ahora FROM public.users WHERE id = v_persona;
  IF v_ahora IS NOT TRUE THEN
    RAISE EXCEPTION 'PRUEBA 2 FALLIDA: el dueño no pudo activar anunciar_logros.';
  END IF;
  RAISE NOTICE 'PRUEBA 2  el dueño de la fila puede activarla                    PASA';

  -- 3. Y puede volver a desactivarla: retirar el consentimiento tiene que ser tan
  --    facil como darlo.
  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claims',
                     json_build_object('sub', v_persona::text, 'role', 'authenticated')::text,
                     true);

  UPDATE public.users SET anunciar_logros = false WHERE id = v_persona;
  RESET ROLE;

  SELECT anunciar_logros INTO v_ahora FROM public.users WHERE id = v_persona;
  IF v_ahora IS NOT FALSE THEN
    RAISE EXCEPTION 'PRUEBA 3 FALLIDA: no se pudo retirar el consentimiento.';
  END IF;
  RAISE NOTICE 'PRUEBA 3  y puede retirarlo                                      PASA';

  -- 4. Pero sigue SIN poder tocar el rol: el GRANT es de una sola columna
  BEGIN
    SET LOCAL ROLE authenticated;
    PERFORM set_config('request.jwt.claims',
                       json_build_object('sub', v_persona::text, 'role', 'authenticated')::text,
                       true);
    UPDATE public.users SET role = 'admin' WHERE id = v_persona;
    RESET ROLE;
    RAISE EXCEPTION 'PRUEBA 4 FALLIDA: el GRANT abrio mas de lo que debia: se pudo cambiar el rol.';
  EXCEPTION WHEN insufficient_privilege THEN
    RESET ROLE;
    RAISE NOTICE 'PRUEBA 4  el rol sigue cerrado: el GRANT es de una columna      PASA';
  END;

  -- 5. Y anon no la lee
  BEGIN
    SET LOCAL ROLE anon;
    PERFORM anunciar_logros FROM public.users WHERE id = v_persona;
    RESET ROLE;
    RAISE EXCEPTION 'PRUEBA 5 FALLIDA: anon puede leer anunciar_logros.';
  EXCEPTION WHEN insufficient_privilege THEN
    RESET ROLE;
    RAISE NOTICE 'PRUEBA 5  anon no puede leerla                                  PASA';
  END;

  -- 6. Todo como estaba
  UPDATE public.users SET anunciar_logros = v_antes WHERE id = v_persona;
  IF (SELECT anunciar_logros FROM public.users WHERE id = v_persona) IS DISTINCT FROM v_antes THEN
    RAISE EXCEPTION 'PRUEBA 6 FALLIDA: no se restauro el valor original.';
  END IF;
  RAISE NOTICE 'PRUEBA 6  la fila queda como estaba                              PASA';

  RAISE NOTICE 'Las pruebas pasan.';
END
$prueba$;

COMMIT;

-- ============================================================================
-- VERIFICACION
-- ============================================================================

SELECT
  EXISTS (SELECT 1 FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = 'users'
             AND column_name = 'anunciar_logros')                                AS columna_creada,

  has_column_privilege('authenticated', 'public.users', 'anunciar_logros', 'UPDATE') AS auth_la_escribe,
  has_column_privilege('anon',          'public.users', 'anunciar_logros', 'SELECT') AS anon_la_lee,
  has_column_privilege('authenticated', 'public.users', 'role', 'UPDATE')          AS auth_escribe_rol,

  (SELECT count(*) FROM public.users)                                            AS usuarios,
  (SELECT count(*) FROM public.users WHERE anunciar_logros)                       AS con_consentimiento,

  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema = 'public' AND table_name = 'users'
                    AND column_name = 'anunciar_logros')
     AND has_column_privilege('authenticated', 'public.users', 'anunciar_logros', 'UPDATE')
     AND NOT has_column_privilege('anon', 'public.users', 'anunciar_logros', 'SELECT')
     AND NOT has_column_privilege('authenticated', 'public.users', 'role', 'UPDATE')
      THEN 'TODO CORRECTO'
    ELSE 'REVISAR: mira las columnas de esta misma fila'
  END                                                                            AS veredicto;

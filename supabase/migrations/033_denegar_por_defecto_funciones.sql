-- ============================================================================
-- 033: denegar por defecto en las funciones de public
--
-- Cierra la exposición de las 73 funciones SECURITY DEFINER de public: 72 las
-- podía ejecutar anon y 44 no tenían search_path.
--
-- Probado en producción el 22/09/2026 con la clave anon —la que viaja en el
-- paquete del navegador— sobre diez funciones de solo lectura: las diez
-- respondieron, ninguna devolvió 42501. Entre ellas
-- get_instructor_earnings_summary, que devolvió accumulated_cents,
-- last_month_cents y paid_cents de un usuario cualquiera a quien no había
-- iniciado sesión. No se probó ninguna función de escritura: ejecutar
-- admin_assign_mentor para "comprobar" sería causar el daño investigado.
--
-- LA CAUSA, QUE NO ES UN DESCUIDO
-- Toda función nueva de Postgres nace con EXECUTE para PUBLIC, y anon y
-- authenticated heredan de PUBLIC. Por eso ha pasado tres veces (is_admin,
-- get_unread_message_count, create_notification). El bloque 7 corta la causa;
-- el resto limpia lo acumulado.
--
-- REQUISITO PREVIO, YA CUMPLIDO
-- app/api/admin/roles/route.ts llamaba a las cuatro admin_* con la sesión del
-- usuario. Se cambió a createAdminClient en el PR #141, mergeado y desplegado.
-- Verificado sobre main d37e1f3: las cuatro usan admin.rpc y no queda ningún
-- supabase.rpc('admin_. Por eso el bloque 5 NO les devuelve el permiso.
--
-- Fecha: 22/09/2026
-- ============================================================================

-- ----------------------------------------------------------------------------
-- VERSIONADO A POSTERIORI
-- Esta migracion se aplico a mano en el SQL Editor de Supabase el 22/09/2026 y
-- se versiona despues, como exige la regla 4 del PROMPT-MAESTRO. Se aplico SIN el bloque
-- ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin, que fallaba con
--     42501: permission denied to change default privileges
-- porque el SQL Editor corre como postgres y ese rol no puede cambiar los
-- privilegios por defecto de otro. Ese bloque no esta aqui.
-- ----------------------------------------------------------------------------

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Cierre por defecto
--
--    No se usa REVOKE ... ON ALL FUNCTIONS IN SCHEMA public: esa forma alcanza
--    también las funciones que instalan las extensiones. Si alguna vive en
--    public (uuid-ossp, pgcrypto, pg_trgm, citext), revocarle EXECUTE a PUBLIC
--    rompe cosas sin relación: un DEFAULT uuid_generate_v4() deja de funcionar
--    para authenticated y todo INSERT en esa tabla empieza a fallar.
--
--    Se recorre función a función saltando las de extensión
--    (pg_depend.deptype = 'e'), los agregados y las funciones de ventana
--    (prokind <> 'f').
--
--    Se revoca también a authenticated, que hoy tiene EXECUTE en todo por
--    herencia de PUBLIC. Sin eso, "denegar por defecto" no significa nada. Los
--    bloques 4 y 5 le devuelven lo que necesita, y el 6 comprueba que no falta.
-- ----------------------------------------------------------------------------

DO $$
DECLARE
  r RECORD;
  v_n INT := 0;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public'
       AND p.prokind = 'f'
       AND NOT EXISTS (SELECT 1 FROM pg_depend d
                        WHERE d.objid = p.oid AND d.deptype = 'e')
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC', r.sig);
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon', r.sig);
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM authenticated', r.sig);
    v_n := v_n + 1;
  END LOOP;
  RAISE NOTICE '1. EXECUTE revocado en % funciones', v_n;
END $$;

-- ----------------------------------------------------------------------------
-- 2. service_role
--    La clave del servidor recupera todo de forma explícita, para que ningún
--    proceso interno dependa de heredar de PUBLIC.
-- ----------------------------------------------------------------------------

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- ----------------------------------------------------------------------------
-- 3. search_path en las que no lo tienen
--
--    ALTER FUNCTION, no CREATE OR REPLACE: no se reescribe ningún cuerpo. Solo
--    toca las que les falta, así que es idempotente.
-- ----------------------------------------------------------------------------

DO $$
DECLARE
  r RECORD;
  v_n INT := 0;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public'
       AND p.prosecdef
       AND p.prokind = 'f'
       AND NOT EXISTS (SELECT 1 FROM pg_depend d
                        WHERE d.objid = p.oid AND d.deptype = 'e')
       AND NOT EXISTS (SELECT 1 FROM unnest(COALESCE(p.proconfig, '{}')) AS c
                        WHERE c LIKE 'search\_path=%')
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = public, pg_temp', r.sig);
    v_n := v_n + 1;
  END LOOP;
  RAISE NOTICE '3. search_path fijado en % funciones', v_n;
END $$;

-- ----------------------------------------------------------------------------
-- 4. Lo que el propio esquema necesita  (categoría b)
--
--    Del inventario: is_admin, is_project_author, is_project_collaborator,
--    project_is_publicly_visible y user_has_role aparecen dentro de políticas
--    RLS; calculate_gpower, dentro de la vista proposals_with_details.
--
--    Aun así NO se escribe esa lista a mano: se calcula. Una lista fija
--    envejece en cuanto alguien añade una política, y aquí equivocarse
--    significa tumbar todas las consultas a esa tabla con "permission denied
--    for function".
--
--    \m y \M son límites de palabra de Postgres. Sin ellos, is_admin casaría
--    dentro de is_admin_or_owner y se concedería de más.
--
--    QUIÉN RECIBE QUÉ
--    - Políticas: authenticated siempre; anon solo si la política alcanza a
--      anon o a public. Una política que solo aplica a authenticated no
--      justifica abrirle nada a un visitante sin sesión.
--    - Vistas: depende de security_invoker. Con la vista normal, los permisos
--      de lo que hay dentro se comprueban contra el DUEÑO de la vista, así que
--      quien consulta no necesita EXECUTE. Con security_invoker = on se
--      comprueban contra quien consulta, y entonces sí.
--      Importa de verdad: GET /api/governance/proposals no exige sesión y lee
--      proposals_with_details, que usa calculate_gpower. Si esa vista es
--      security_invoker y anon se queda sin EXECUTE, la gobernanza pública
--      deja de cargar.
--    - Funciones SECURITY INVOKER que la llamen: authenticated.
-- ----------------------------------------------------------------------------

DO $$
DECLARE
  r RECORD;
  v_a INT := 0;
  v_n INT := 0;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig,
           p.proname,
           -- politica que alcanza a anon o public
           EXISTS (
             SELECT 1 FROM pg_policies pol
              WHERE pol.schemaname = 'public'
                AND (COALESCE(pol.qual,'') ~ ('\m'||p.proname||'\M')
                  OR COALESCE(pol.with_check,'') ~ ('\m'||p.proname||'\M'))
                AND pol.roles && ARRAY['anon','public']::name[]
           ) AS pol_anon,
           EXISTS (
             SELECT 1 FROM pg_policies pol
              WHERE pol.schemaname = 'public'
                AND (COALESCE(pol.qual,'') ~ ('\m'||p.proname||'\M')
                  OR COALESCE(pol.with_check,'') ~ ('\m'||p.proname||'\M'))
           ) AS en_politica,
           -- vista con security_invoker que la use
           EXISTS (
             SELECT 1
               FROM pg_views v
               JOIN pg_class c ON c.relname = v.viewname
               JOIN pg_namespace nv ON nv.oid = c.relnamespace AND nv.nspname = 'public'
              WHERE v.schemaname = 'public'
                AND v.definition ~ ('\m'||p.proname||'\M')
                AND EXISTS (SELECT 1 FROM unnest(COALESCE(c.reloptions,'{}')) AS o
                             WHERE o IN ('security_invoker=on','security_invoker=true'))
           ) AS vista_invoker,
           EXISTS (
             SELECT 1 FROM pg_views v
              WHERE v.schemaname = 'public'
                AND v.definition ~ ('\m'||p.proname||'\M')
           ) AS en_vista,
           EXISTS (
             SELECT 1 FROM pg_proc p2
             JOIN pg_namespace n2 ON n2.oid = p2.pronamespace
              WHERE n2.nspname = 'public'
                AND NOT p2.prosecdef
                AND p2.oid <> p.oid
                AND p2.prosrc ~ ('\m'||p.proname||'\M')
           ) AS en_invoker
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public'
       AND p.prokind = 'f'
       AND NOT EXISTS (SELECT 1 FROM pg_depend d
                        WHERE d.objid = p.oid AND d.deptype = 'e')
  LOOP
    IF r.en_politica OR r.en_vista OR r.en_invoker THEN
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', r.sig);
      v_a := v_a + 1;

      IF r.pol_anon OR r.vista_invoker THEN
        EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO anon', r.sig);
        v_n := v_n + 1;
        RAISE NOTICE '4. anon conserva EXECUTE en % (politica publica o vista security_invoker)', r.sig;
      END IF;
    END IF;
  END LOOP;
  RAISE NOTICE '4. usadas por el esquema: % a authenticated, % a anon', v_a, v_n;
END $$;

-- ----------------------------------------------------------------------------
-- 5. Lo que llama el código con la sesión del usuario  (categoría c)
--
--    De recorrer app/, lib/, components/ y hooks/ buscando .rpc(): 25 puntos de
--    llamada, 22 funciones distintas. Quedan fuera de esta lista:
--      - check_project_eligibility: ya usa createAdminClient (service_role).
--      - admin_assign_instructor, admin_assign_mentor, admin_revoke_instructor
--        y admin_revoke_mentor: desde el PR #141 usan createAdminClient. Este
--        es el motivo de que puedan quedarse sin permiso.
--
--    OJO: estar en esta lista significa que hay que darle EXECUTE, no que sea
--    segura. Todas reciben p_user_id del llamante. Cerrarlas por dentro (que
--    usen auth.uid()) es otra migración; esta solo corta el acceso anónimo.
-- ----------------------------------------------------------------------------

DO $$
DECLARE
  r RECORD;
  s RECORD;
  v_falta TEXT := '';
  v_n INT := 0;
BEGIN
  FOR r IN
    SELECT unnest(ARRAY[
      'calculate_gpower',
      'can_apply_mentor',
      'can_attempt_exam',
      'can_create_proposal',
      'can_validate_proposal',
      'generate_referral_code',
      'get_best_quiz_attempt',
      'get_exam_eligibility_details',
      'get_or_create_conversation',
      'get_unread_message_count',
      'has_passed_module_quiz',
      'mark_messages_as_read',
      'select_exam_model',
      'submit_mentor_application',
      'track_referral_click',
      'track_referral_conversion',
      'vote_mentor_application'
    ]) AS nombre
  LOOP
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
                WHERE n.nspname = 'public' AND p.proname = r.nombre) THEN
      FOR s IN SELECT p.oid::regprocedure AS sig
                 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
                WHERE n.nspname = 'public' AND p.proname = r.nombre
      LOOP
        EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', s.sig);
        v_n := v_n + 1;
      END LOOP;
    ELSE
      v_falta := v_falta || r.nombre || ' ';
    END IF;
  END LOOP;

  IF v_falta <> '' THEN
    RAISE EXCEPTION 'El codigo llama a funciones que no existen: %', v_falta;
  END IF;
  RAISE NOTICE '5. EXECUTE devuelto a authenticated en % firmas del codigo', v_n;
END $$;

-- ----------------------------------------------------------------------------
-- 6. Red de seguridad
--
--    Antes de confirmar, se comprueba que las seis funciones que el esquema
--    necesita conservan lo suyo. Si el cálculo del bloque 4 fallara —una
--    política escrita de forma que el patrón no la detecte, por ejemplo— esto
--    aborta y NO se escribe nada, en vez de dejar la plataforma sin
--    poder consultar proyectos ni propuestas.
--
--    Se comprueba authenticated, que es quien las necesita siempre. Para anon
--    no se exige nada: depende de si la política es pública o la vista es
--    security_invoker, y eso ya lo decide el bloque 4. La verificación
--    posterior lo muestra.
-- ----------------------------------------------------------------------------

DO $$
DECLARE
  r RECORD;
  v_mal TEXT := '';
BEGIN
  FOR r IN
    SELECT p.oid AS id, p.oid::regprocedure AS sig
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public'
       AND p.prokind = 'f'
       AND p.proname IN ('is_admin', 'is_project_author', 'is_project_collaborator',
                         'project_is_publicly_visible', 'user_has_role',
                         'calculate_gpower')
  LOOP
    -- Con el oid, no con el texto de la firma: evita cualquier problema de
    -- resolucion de tipos al reparsear la cadena.
    IF NOT has_function_privilege('authenticated', r.id, 'EXECUTE') THEN
      v_mal := v_mal || r.sig || ' ';
    END IF;
  END LOOP;

  IF v_mal <> '' THEN
    RAISE EXCEPTION
      'Abortada: estas funciones las usan politicas RLS o la vista proposals_with_details y se han quedado sin EXECUTE para authenticated: %',
      v_mal;
  END IF;
  RAISE NOTICE '6. las 6 funciones del esquema conservan EXECUTE para authenticated';
END $$;

-- ----------------------------------------------------------------------------
-- 7. Que las futuras no nazcan abiertas
--
--    Esto es lo que impide la cuarta repetición. ALTER DEFAULT PRIVILEGES actúa
--    por rol creador, no de forma global.
--
--    Solo se declara para postgres. Había una tercera sentencia FOR ROLE
--    supabase_admin y se ha retirado: el SQL Editor se ejecuta como postgres,
--    que no puede cambiar los privilegios por defecto de otro rol, y la
--    migración entera fallaba con
--        42501: permission denied to change default privileges
--
--    Las dos que quedan son la misma cosa cuando esto se ejecuta como postgres:
--    la primera, sin FOR ROLE, se aplica al rol actual. Se dejan las dos a
--    propósito, para que la segunda siga siendo correcta si algún día lo
--    aplica otro rol.
--
--    LO QUE ESTO NO CUBRE: las funciones que cree supabase_admin seguirán
--    naciendo con EXECUTE para PUBLIC. En este proyecto no es el caso práctico
--    —las migraciones se aplican en el SQL Editor como postgres, y de ahí
--    salieron las 73 funciones auditadas—, pero sí lo es de lo que instalen las
--    extensiones. Por eso la comprobación 8 de 033-comprobar.sql lista los
--    privilegios por defecto existentes: si algún día aparece una función nueva
--    abierta a PUBLIC que nadie creó a mano, viene por esa rendija.
-- ----------------------------------------------------------------------------

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Esta es la linea que se ejecuto de verdad, y va mas lejos que la de arriba:
-- revoca tambien a anon y a authenticated, no solo a PUBLIC. Asi una funcion
-- futura no nace abierta ni siquiera si alguien concede a esos roles por
-- costumbre. Verificado despues de aplicarla: pg_default_acl del rol postgres
-- queda en {postgres=X, service_role=X}.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated;

COMMIT;

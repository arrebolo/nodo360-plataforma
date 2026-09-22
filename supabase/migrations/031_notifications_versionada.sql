-- ============================================================================
-- 031: versiona notifications y get_unread_message_count
--
-- POR QUE
-- La tabla public.notifications lleva en produccion desde hace meses y no
-- estaba en ninguna migracion del repo: no hay CREATE TABLE ni un solo indice
-- para ella en supabase/migrations/. La funcion get_unread_message_count
-- tampoco: vive en supabase/018_messaging_system.sql, fuera del directorio de
-- migraciones, y nunca se versiono. Ambas incumplen la regla 4 del
-- PROMPT-MAESTRO: lo que esta en la base de datos tiene que estar en el repo.
--
-- Esta migracion NO crea nada nuevo: documenta lo que ya existe y corrige lo
-- que la revision encontro. Es idempotente y se puede aplicar tal cual.
--
-- QUE CAMBIA DE VERDAD EN LA BASE DE DATOS
--   1. Dos indices nuevos sobre notifications (hoy no tiene ninguno propio).
--   2. get_unread_message_count pasa a tener SET search_path y deja de ser
--      ejecutable por anon.
--   3. get_unread_message_count deja de aceptar un p_user_id ajeno.
--   4. Se revocan a anon los privilegios de tabla sobre notifications.
--
-- LO QUE NO TOCA
--   No altera columnas ni datos existentes, y no reescribe las politicas RLS
--   que ya hubiera: solo crea las que falten, por nombre. La consulta de
--   verificacion del final lista las que queden, para poder revisarlas.
--
-- Fecha: 22/09/2026
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Tipo enumerado
--    Valores tal como estan hoy en la base de datos, leidos del spec OpenAPI
--    que PostgREST publica en /rest/v1/.
-- ----------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
      JOIN pg_namespace n ON n.oid = t.typnamespace
     WHERE t.typname = 'notification_type' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.notification_type AS ENUM (
      'beta_granted',
      'course_published',
      'proposal_active',
      'course_completed',
      'certificate_issued',
      'badge_earned',
      'level_up',
      'feedback_reply',
      'welcome',
      'system'
    );
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 2. La tabla, tal como existe hoy
--    IF NOT EXISTS: en produccion ya esta, asi que esto no hace nada. Sirve
--    para que el repo describa el esquema y para levantar un entorno limpio.
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type       public.notification_type NOT NULL,
  title      TEXT NOT NULL,
  message    TEXT NOT NULL,
  read       BOOLEAN NOT NULL DEFAULT FALSE,
  data       JSONB,
  link       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.notifications      IS 'Notificaciones en la campana de la cabecera. Las inserta el servidor con service_role (lib/notifications/broadcast.ts).';
COMMENT ON COLUMN public.notifications.type IS 'Tipo de notificacion para iconos/estilos';
COMMENT ON COLUMN public.notifications.data IS 'Metadata adicional (course_id, badge_id, etc)';
COMMENT ON COLUMN public.notifications.link IS 'URL para navegar al hacer click';

-- ----------------------------------------------------------------------------
-- 3. Indices
--    Hoy la tabla no tiene ninguno propio: solo la clave primaria. Con 31 filas
--    da igual, pero /api/notifications se llama del orden de 150 veces cada 26
--    minutos y hace DOS consultas por llamada. Cada una tiene su indice:
--
--    a) La lista:  WHERE user_id = ? ORDER BY created_at DESC LIMIT 10
--    b) El conteo: WHERE user_id = ? AND read = false
--
--    El segundo es parcial: solo indexa las no leidas, que son la minoria y las
--    unicas que se cuentan. Ocupa una fraccion de lo que ocuparia completo.
-- ----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS notifications_user_created_idx
  ON public.notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS notifications_user_unread_idx
  ON public.notifications (user_id, read)
  WHERE read = FALSE;

-- ----------------------------------------------------------------------------
-- 4. RLS y privilegios de tabla
--
--    Comprobado contra la base de datos antes de escribir esto: con la clave
--    anon, GET /rest/v1/notifications devuelve 200 con [] — las politicas ya
--    filtran bien. Pero anon conserva el GRANT de tabla que Supabase concede
--    por defecto, asi que puede alcanzarla. Se revoca: RLS protege filas, y el
--    GRANT es una capa independiente (regla 2).
--
--    Quien escribe, comprobado en el codigo:
--      INSERT  -> solo service_role, desde lib/notifications/broadcast.ts
--      SELECT  -> authenticated (GET  /api/notifications)
--      UPDATE  -> authenticated (PATCH /api/notifications/[id] y /read-all)
--      DELETE  -> authenticated (DELETE /api/notifications/[id])
--    authenticated NO necesita INSERT: nadie inserta desde la sesion del
--    usuario. Darselo permitiria fabricarse notificaciones.
-- ----------------------------------------------------------------------------

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.notifications FROM anon;
REVOKE ALL ON public.notifications FROM authenticated;

GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL                    ON public.notifications TO service_role;

-- Politicas. Se crean SOLO si falta ese nombre concreto, para no pisar lo que
-- ya hubiera. Si la tabla tiene politicas con otro nombre, siguen ahi: la
-- verificacion del final las lista todas para poder revisarlas.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'notifications'
       AND policyname = 'notifications_select_own'
  ) THEN
    CREATE POLICY notifications_select_own ON public.notifications
      FOR SELECT TO authenticated
      USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'notifications'
       AND policyname = 'notifications_update_own'
  ) THEN
    -- WITH CHECK explicito: sin el, Postgres reutiliza el USING y un UPDATE
    -- podria reasignar user_id a otro usuario.
    CREATE POLICY notifications_update_own ON public.notifications
      FOR UPDATE TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'notifications'
       AND policyname = 'notifications_delete_own'
  ) THEN
    CREATE POLICY notifications_delete_own ON public.notifications
      FOR DELETE TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 5. get_unread_message_count
--
--    Cuerpo identico al de supabase/018_messaging_system.sql, que es el que
--    esta vivo en produccion. Cambian tres cosas, todas de la revision:
--
--    a) SET search_path = public, pg_temp
--       Es SECURITY DEFINER y no lo tenia. Sin eso, quien pueda crear objetos
--       en un esquema que aparezca antes en el search_path puede suplantar
--       public.messages o public.conversations y ejecutar codigo propio con los
--       privilegios del dueno de la funcion.
--
--    b) Deja de aceptar un p_user_id ajeno
--       Es SECURITY DEFINER, o sea que se salta RLS. Comprobado con la clave
--       anon: la llamada respondia 200 en lugar de rechazarla, de modo que
--       cualquiera podia preguntar por el id de otro usuario. Hoy devuelve 0
--       porque no hay ningun mensaje sin leer en la base de datos, asi que la
--       exposicion es latente y no ha filtrado nada, pero esta abierta.
--
--       OJO, CAMBIO DE COMPORTAMIENTO: a partir de aqui la funcion exige que
--       p_user_id sea el del llamante. El unico sitio que la usa es
--       app/api/messages/unread/route.ts, que ya pasa user.id, asi que no
--       rompe nada. Pero una llamada con service_role (sin JWT) fallara: si
--       algun proceso interno la necesita, tendra que consultar las tablas
--       directamente.
--
--    c) REVOKE de PUBLIC
--       Postgres concede EXECUTE a PUBLIC en toda funcion nueva. Por eso anon
--       podia llamarla pese a que el 018 solo daba EXECUTE a authenticated:
--       ese GRANT sumaba, no sustituia.
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_unread_message_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  IF p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'No autorizado'
      USING ERRCODE = '42501';
  END IF;

  SELECT COUNT(*)::INTEGER INTO v_count
  FROM public.messages m
  JOIN public.conversations c ON m.conversation_id = c.id
  WHERE (c.participant_1 = p_user_id OR c.participant_2 = p_user_id)
    AND m.sender_id != p_user_id
    AND m.read_at IS NULL;

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.get_unread_message_count(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_unread_message_count(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_unread_message_count(UUID) TO authenticated;

COMMIT;


-- ============================================================================
-- VERIFICACION
-- Ejecutar despues. Es de solo lectura y devuelve todo en una sola tabla.
--
-- QUE DEBE SALIR
--   1. indices                -> 3 (la PK y los dos nuevos)
--   2. RLS activo             -> true
--   3. privilegios de anon    -> 0
--   4. privilegios authent.   -> DELETE, SELECT, UPDATE   (sin INSERT)
--   5. anon ejecuta la RPC    -> false
--   6. search_path de la RPC  -> search_path=public, pg_temp
--   7. politicas              -> una fila por politica: revisar que no haya
--                                ninguna mas permisiva de lo esperado
--   8. funciones que insertan -> (ninguna) esperado.
--
-- SOBRE LA FILA 8. El repo no tiene ningun INSERT INTO notifications en SQL,
-- pero la tabla tampoco estaba versionada, asi que el repo no demuestra nada
-- por si solo. La fila 8 busca en el cuerpo de todas las funciones de public
-- alguna que inserte en la tabla. Si aparece alguna y NO es SECURITY DEFINER,
-- necesita el privilegio de INSERT del usuario que dispara el trigger, y esta
-- migracion se lo acaba de quitar a authenticated. En ese caso, devolverlo:
--
--   GRANT INSERT ON public.notifications TO authenticated;
--
-- y anotarlo, porque entonces cualquiera puede fabricarse notificaciones y lo
-- suyo seria pasar esa funcion a SECURITY DEFINER.
-- ============================================================================

SELECT 1 AS n, 'indices sobre notifications' AS comprobacion,
       string_agg(indexname, ', ' ORDER BY indexname) AS observado
  FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'notifications'
UNION ALL
SELECT 2, 'RLS activo en notifications', relrowsecurity::TEXT
  FROM pg_class WHERE oid = 'public.notifications'::regclass
UNION ALL
SELECT 3, 'privilegios de anon sobre notifications',
       COALESCE(string_agg(privilege_type, ', ' ORDER BY privilege_type), '(ninguno)')
  FROM information_schema.role_table_grants
 WHERE table_schema = 'public' AND table_name = 'notifications' AND grantee = 'anon'
UNION ALL
SELECT 4, 'privilegios de authenticated sobre notifications',
       COALESCE(string_agg(privilege_type, ', ' ORDER BY privilege_type), '(ninguno)')
  FROM information_schema.role_table_grants
 WHERE table_schema = 'public' AND table_name = 'notifications' AND grantee = 'authenticated'
UNION ALL
SELECT 5, 'anon puede ejecutar get_unread_message_count',
       has_function_privilege('anon', 'public.get_unread_message_count(uuid)', 'EXECUTE')::TEXT
UNION ALL
SELECT 6, 'search_path de get_unread_message_count',
       COALESCE(array_to_string(p.proconfig, ', '), '(SIN search_path)')
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public' AND p.proname = 'get_unread_message_count'
UNION ALL
SELECT 7, 'politica: ' || policyname,
       cmd || ' | roles ' || array_to_string(roles, ',') ||
       ' | USING ' || COALESCE(qual, '-') ||
       ' | CHECK ' || COALESCE(with_check, '-')
  FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notifications'
UNION ALL
SELECT 8, 'funciones que insertan en notifications',
       COALESCE(
         string_agg(p.proname || CASE WHEN p.prosecdef THEN ' (SECURITY DEFINER)'
                                      ELSE ' (SECURITY INVOKER, revisar)' END, ', '),
         '(ninguna)')
  FROM pg_proc p JOIN pg_namespace n2 ON n2.oid = p.pronamespace
 WHERE n2.nspname = 'public'
   AND p.prosrc ~* 'insert\s+into\s+(public\.)?notifications'
 ORDER BY n, comprobacion;

-- ============================================================================
-- 032: cierra create_notification
--
-- EL PROBLEMA
-- public.create_notification(uuid, notification_type, text, text, text, jsonb)
-- es SECURITY DEFINER y anon la puede ejecutar. Comprobado en producción el
-- 22/09/2026 con la clave anon, que va en el paquete del navegador y por tanto
-- es pública: la llamada llegó hasta el INSERT y solo falló por la clave ajena
-- ("Key (user_id)=(000…000) is not present in table users"). Con un user_id
-- real habría creado la notificación.
--
-- Por qué importa más de lo que parece: NotificationBell hace
-- router.push(notification.link) con el enlace que trae la fila. Cualquiera
-- podía fabricar a cualquier usuario una notificación con título y texto de
-- apariencia oficial y un enlace a donde quisiera. Es una primitiva de
-- phishing completa dentro de la sesión autenticada del usuario.
--
-- SE PUEDE REVOCAR SIN ROMPER NADA
-- No hay una sola llamada a create_notification en el código: ni .rpc(…) ni
-- nada. La aplicación crea notificaciones insertando directamente en la tabla
-- con createAdminClient() (service_role) desde lib/notifications/broadcast.ts.
-- La función tampoco ha estado nunca en el repo: git log --all -S no devuelve
-- ningún commit. Es decir, se creó a mano en la base de datos.
--
-- Lo que no puedo comprobar desde fuera es si algún trigger o función de la
-- propia base de datos la invoca. Por eso el paso 0 de abajo aborta la
-- migración si encuentra un llamante que la necesite.
--
-- Fecha: 22/09/2026
-- ============================================================================

-- ----------------------------------------------------------------------------
-- VERSIONADO A POSTERIORI
-- Esta migracion se aplico a mano en el SQL Editor de Supabase el 22/09/2026 y
-- se versiona despues, como exige la regla 4 del PROMPT-MAESTRO. El contenido
-- es el que se ejecuto, con las diferencias anotadas mas abajo si las hay.
-- ----------------------------------------------------------------------------

BEGIN;

-- ----------------------------------------------------------------------------
-- 0. Guarda de seguridad
--
--    Si alguna función de public llama a create_notification y NO es SECURITY
--    DEFINER, se ejecuta con los privilegios de quien dispara el trigger. Al
--    revocarle EXECUTE a authenticated, esa función se rompería en cuanto un
--    usuario hiciera la acción que la dispara.
--
--    Una función SECURITY DEFINER, en cambio, corre con los privilegios de su
--    dueño y no le afecta el REVOKE.
--
--    Si esto aborta la migración, NO se ha escrito nada (va dentro de la
--    transacción). Ejecuta 032-comprobar.sql para ver quién es y decidir: lo
--    normal será pasar esa función a SECURITY DEFINER con su propio
--    search_path, y entonces reintentar.
-- ----------------------------------------------------------------------------

DO $$
DECLARE
  v_invocadores TEXT;
BEGIN
  SELECT string_agg(p.proname, ', ' ORDER BY p.proname)
    INTO v_invocadores
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public'
     AND p.proname <> 'create_notification'
     AND p.prosrc ~* 'create_notification'
     AND NOT p.prosecdef;

  IF v_invocadores IS NOT NULL THEN
    RAISE EXCEPTION
      'Abortada: estas funciones SECURITY INVOKER llaman a create_notification y el REVOKE las romperia: %',
      v_invocadores;
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 1. search_path
--
--    Se usa ALTER FUNCTION en lugar de CREATE OR REPLACE a propósito: el
--    cuerpo de la función no está en el repo y no lo puedo leer desde fuera de
--    la base de datos. ALTER FUNCTION … SET search_path fija el search_path sin
--    tocar ni una línea del cuerpo, que es justo lo que hace falta.
--
--    Sin esto, siendo SECURITY DEFINER, quien pueda crear objetos en un esquema
--    que aparezca antes en el search_path puede suplantar public.notifications
--    y ejecutar código propio con los privilegios del dueño de la función.
--
--    Es idempotente: si ya lo tiene, lo deja igual.
-- ----------------------------------------------------------------------------

ALTER FUNCTION public.create_notification(UUID, public.notification_type, TEXT, TEXT, TEXT, JSONB)
  SET search_path = public, pg_temp;

-- ----------------------------------------------------------------------------
-- 2. Privilegios de ejecución
--
--    El REVOKE de PUBLIC es el que de verdad cierra el agujero. Postgres
--    concede EXECUTE a PUBLIC en toda función nueva, y anon y authenticated
--    heredan de PUBLIC. Revocar solo a esos dos roles y dejar PUBLIC intacto no
--    serviría de nada: es la misma trampa que teníamos en
--    get_unread_message_count, donde un GRANT a authenticated sumaba en lugar
--    de sustituir.
--
--    service_role recibe EXECUTE explícito. Hoy nadie la llama, pero si mañana
--    se usa desde el servidor, será con esa clave.
-- ----------------------------------------------------------------------------

REVOKE ALL ON FUNCTION public.create_notification(UUID, public.notification_type, TEXT, TEXT, TEXT, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_notification(UUID, public.notification_type, TEXT, TEXT, TEXT, JSONB) FROM anon;
REVOKE ALL ON FUNCTION public.create_notification(UUID, public.notification_type, TEXT, TEXT, TEXT, JSONB) FROM authenticated;

GRANT EXECUTE ON FUNCTION public.create_notification(UUID, public.notification_type, TEXT, TEXT, TEXT, JSONB) TO service_role;

-- ----------------------------------------------------------------------------
-- 3. Las dos políticas de "Service role"
--
--    "Service role can insert notifications" y "Service role can delete
--    notifications" tenían USING/WITH CHECK a true y se aplicaban al rol
--    public, no a service_role. El nombre decía una cosa y la política hacía
--    otra: cualquiera podía insertar y borrar cualquier fila.
--
--    No hacen ninguna falta: service_role NO pasa por RLS. Su acceso viene del
--    GRANT ALL de la migración 031, no de una política.
--
--    IF EXISTS porque ya las borraste a mano. Esto solo deja constancia
--    versionada, para que levantar la base desde cero no las recree.
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Service role can delete notifications" ON public.notifications;

COMMIT;

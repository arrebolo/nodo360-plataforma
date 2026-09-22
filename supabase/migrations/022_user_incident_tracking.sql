-- =====================================================
-- Migration: User Incident Tracking
-- Combina flags + reportes para detectar reincidencia
-- =====================================================
--
-- NO APLICADA. Revisada y corregida el 21 de septiembre de 2026; la vista no
-- existe en la base de datos, asi que /api/admin/moderation/users devuelve 500.
--
-- Defectos de la version anterior de este archivo:
--
--  1. FUGA DE DATOS DE MODERACION. La vista se creaba sin security_invoker, de
--     modo que se ejecuta con los privilegios de su propietario y se salta la
--     RLS de message_flags y message_reports. Con GRANT SELECT a authenticated,
--     CUALQUIER usuario con sesion podia leer el historial de incidencias de
--     todos: nombre, rol, numero de flags, reportes abiertos y nivel de riesgo.
--     El comentario del archivo afirmaba lo contrario ("solo admins via RLS de
--     las tablas subyacentes"). Corregido con security_invoker = on y GRANT
--     solo a service_role, que es lo unico que consume la vista.
--
--  2. EL JOIN DE FLAGS ERA SEMANTICAMENTE INCORRECTO. Hacia
--     "LEFT JOIN message_flags mf ON mf.created_by = u.id". Segun la migracion
--     020, created_by es quien CREA el flag y vale NULL si lo genera el sistema,
--     no el usuario senalado. Consecuencias: los flags automaticos (la mayoria)
--     no se atribuian a nadie, y un moderador que marcase mensajes a mano
--     acumulaba "incidencias" contra si mismo. El usuario senalado se alcanza a
--     traves de messages.sender_id.
--
--  3. ORDER BY dentro de la definicion de la vista. No aporta nada: el orden lo
--     fija la consulta que la usa, y aqui solo impide que el planificador elija
--     un plan mejor. Se mueve la responsabilidad a quien consulta.
--
-- Comprobado contra el esquema real: message_flags(id, message_id, severity,
-- reviewed_at, created_at, created_by), message_reports(id, reported_user_id,
-- status, created_at) y messages(id, sender_id, conversation_id) existen con
-- esos nombres.
-- =====================================================

DROP VIEW IF EXISTS user_incident_summary;

CREATE VIEW user_incident_summary
WITH (security_invoker = on) AS
SELECT
    u.id as user_id,
    u.full_name,
    u.avatar_url,
    u.role,
    -- Flags automaticos sobre mensajes enviados por este usuario
    COUNT(DISTINCT mf.id) as total_flags,
    COUNT(DISTINCT mf.id) FILTER (WHERE mf.severity >= 4) as high_severity_flags,
    COUNT(DISTINCT mf.id) FILTER (WHERE mf.reviewed_at IS NULL) as pending_flags,
    -- Reportes recibidos
    COUNT(DISTINCT mr.id) as total_reports_received,
    COUNT(DISTINCT mr.id) FILTER (WHERE mr.status = 'open') as open_reports,
    COUNT(DISTINCT mr.id) FILTER (WHERE mr.status = 'actioned') as actioned_reports,
    -- Timestamps
    MAX(mf.created_at) as last_flag_at,
    MAX(mr.created_at) as last_report_at,
    -- Reincidencia
    CASE
        WHEN COUNT(DISTINCT mf.id) + COUNT(DISTINCT mr.id) >= 5 THEN 'alto'
        WHEN COUNT(DISTINCT mf.id) + COUNT(DISTINCT mr.id) >= 3 THEN 'medio'
        WHEN COUNT(DISTINCT mf.id) + COUNT(DISTINCT mr.id) >= 1 THEN 'bajo'
        ELSE 'limpio'
    END as risk_level
FROM users u
-- Corregido: el flag apunta a un mensaje; el usuario senalado es quien lo envio
LEFT JOIN messages m       ON m.sender_id = u.id
LEFT JOIN message_flags mf ON mf.message_id = m.id
LEFT JOIN message_reports mr ON mr.reported_user_id = u.id
GROUP BY u.id, u.full_name, u.avatar_url, u.role
HAVING COUNT(DISTINCT mf.id) + COUNT(DISTINCT mr.id) > 0;

COMMENT ON VIEW user_incident_summary IS
  'Flags y reportes agregados por usuario, para detectar reincidencia.
   security_invoker = on: respeta la RLS de message_flags y message_reports, de
   modo que un usuario sin privilegios sobre esas tablas no obtiene filas.
   La consume /api/admin/moderation/users con service_role, tras requireAdmin().';

-- --------------------------------------------------------------------------
-- Privilegios
-- --------------------------------------------------------------------------
-- La vista solo se consulta desde /api/admin/moderation/users y
-- /api/admin/moderation/users/[userId], ambas con createAdminClient()
-- (service_role) y detras de una comprobacion de admin en el codigo.
-- No hay motivo para que anon ni authenticated la tengan.

REVOKE ALL ON user_incident_summary FROM anon, authenticated;
GRANT SELECT ON user_incident_summary TO service_role;


-- =====================================================
-- COMPROBACIONES (solo lectura, ejecutar aparte)
-- =====================================================
-- 1. Que la vista respeta los privilegios de quien consulta:
--    select * from pg_views where viewname = 'user_incident_summary';
--    En la definicion debe constar security_invoker.
--
-- 2. Que anon y authenticated no la ven:
--    select grantee, privilege_type from information_schema.role_table_grants
--    where table_name = 'user_incident_summary';
--    Solo debe aparecer service_role (y el propietario).
--
-- 3. Que los flags se atribuyen al emisor y no al moderador:
--    select user_id, full_name, total_flags, total_reports_received, risk_level
--    from user_incident_summary order by total_flags desc;
--    Con 6 filas en message_flags, 1 en message_reports y 12 en messages
--    (estado del 21/09/2026), ninguna fila debe atribuir flags a una cuenta de
--    admin por el mero hecho de haberlos revisado.

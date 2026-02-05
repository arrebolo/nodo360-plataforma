-- =====================================================
-- Migration: User Incident Tracking
-- Combines flags + reports for recidivism detection
-- =====================================================

-- Vista de incidentes por usuario (combina flags + reportes)
CREATE OR REPLACE VIEW user_incident_summary AS
SELECT
    u.id as user_id,
    u.full_name,
    u.avatar_url,
    u.role,
    -- Flags automáticos
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
LEFT JOIN message_flags mf ON mf.created_by = u.id
LEFT JOIN message_reports mr ON mr.reported_user_id = u.id
GROUP BY u.id, u.full_name, u.avatar_url, u.role
HAVING COUNT(DISTINCT mf.id) + COUNT(DISTINCT mr.id) > 0
ORDER BY (COUNT(DISTINCT mf.id) + COUNT(DISTINCT mr.id)) DESC;

-- Comentarios
COMMENT ON VIEW user_incident_summary IS 'Vista combinada de flags y reportes por usuario para detección de reincidencia';

-- Permisos (solo admins vía RLS de las tablas subyacentes)
GRANT SELECT ON user_incident_summary TO authenticated;

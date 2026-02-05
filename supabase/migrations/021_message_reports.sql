-- =====================================================
-- Migration: Message Reports by Users
-- Phase 2: User-initiated report system
-- =====================================================

-- Enum para razones de reporte
DO $$ BEGIN
    CREATE TYPE message_report_reason AS ENUM (
        'spam',
        'external_promo',
        'trading_promo',
        'harassment',
        'scam',
        'inappropriate',
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enum para estado del reporte
DO $$ BEGIN
    CREATE TYPE message_report_status AS ENUM (
        'open',
        'triaged',
        'closed',
        'actioned'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tabla de reportes de usuarios
CREATE TABLE IF NOT EXISTS message_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    reporter_user_id UUID NOT NULL REFERENCES users(id),
    reported_user_id UUID NOT NULL REFERENCES users(id),
    reason message_report_reason NOT NULL,
    details TEXT, -- descripción opcional del usuario
    status message_report_status DEFAULT 'open',
    admin_notes TEXT, -- notas internas del admin
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsqueda eficiente
CREATE INDEX IF NOT EXISTS idx_message_reports_status ON message_reports(status) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS idx_message_reports_reporter ON message_reports(reporter_user_id);
CREATE INDEX IF NOT EXISTS idx_message_reports_reported ON message_reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_message_reports_conversation ON message_reports(conversation_id);
CREATE INDEX IF NOT EXISTS idx_message_reports_created ON message_reports(created_at DESC);

-- Evitar reportes duplicados del mismo usuario al mismo mensaje
CREATE UNIQUE INDEX IF NOT EXISTS idx_message_reports_unique
ON message_reports(reporter_user_id, message_id)
WHERE message_id IS NOT NULL;

-- Comentarios para documentación
COMMENT ON TABLE message_reports IS 'Reportes de usuarios sobre mensajes sospechosos';
COMMENT ON COLUMN message_reports.reason IS 'Razón del reporte seleccionada por el usuario';
COMMENT ON COLUMN message_reports.details IS 'Descripción opcional proporcionada por el usuario';
COMMENT ON COLUMN message_reports.admin_notes IS 'Notas internas del admin que revisa el reporte';

-- RLS
ALTER TABLE message_reports ENABLE ROW LEVEL SECURITY;

-- Usuario puede crear reportes
DROP POLICY IF EXISTS "Users can create reports" ON message_reports;
CREATE POLICY "Users can create reports" ON message_reports
FOR INSERT WITH CHECK (auth.uid() = reporter_user_id);

-- Usuario puede ver sus propios reportes
DROP POLICY IF EXISTS "Users can view own reports" ON message_reports;
CREATE POLICY "Users can view own reports" ON message_reports
FOR SELECT USING (auth.uid() = reporter_user_id);

-- Admins pueden ver todos los reportes
DROP POLICY IF EXISTS "Admins can view all reports" ON message_reports;
CREATE POLICY "Admins can view all reports" ON message_reports
FOR SELECT USING (is_admin(auth.uid()));

-- Admins pueden actualizar reportes
DROP POLICY IF EXISTS "Admins can update reports" ON message_reports;
CREATE POLICY "Admins can update reports" ON message_reports
FOR UPDATE USING (is_admin(auth.uid()));

-- Trigger para updated_at (reutiliza función existente si existe)
DO $$ BEGIN
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $func$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DROP TRIGGER IF EXISTS update_message_reports_updated_at ON message_reports;
CREATE TRIGGER update_message_reports_updated_at
BEFORE UPDATE ON message_reports
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Vista para panel de admin con estadísticas de reportes
CREATE OR REPLACE VIEW message_reports_summary AS
SELECT
    reason,
    status,
    COUNT(*) as total_reports,
    COUNT(*) FILTER (WHERE status = 'open') as pending,
    COUNT(*) FILTER (WHERE status = 'actioned') as actioned,
    COUNT(DISTINCT reported_user_id) as unique_reported_users,
    MAX(created_at) as last_report_at
FROM message_reports
GROUP BY reason, status
ORDER BY pending DESC, total_reports DESC;

-- Vista de usuarios más reportados (para detectar problemas)
CREATE OR REPLACE VIEW most_reported_users AS
SELECT
    reported_user_id,
    u.full_name,
    u.email,
    COUNT(*) as total_reports,
    COUNT(*) FILTER (WHERE mr.status = 'open') as open_reports,
    COUNT(*) FILTER (WHERE mr.status = 'actioned') as actioned_reports,
    array_agg(DISTINCT mr.reason) as report_reasons,
    MAX(mr.created_at) as last_reported_at
FROM message_reports mr
JOIN users u ON u.id = mr.reported_user_id
GROUP BY reported_user_id, u.full_name, u.email
HAVING COUNT(*) >= 2
ORDER BY total_reports DESC, open_reports DESC;

-- Permisos para las vistas (solo admins)
GRANT SELECT ON message_reports_summary TO authenticated;
GRANT SELECT ON most_reported_users TO authenticated;

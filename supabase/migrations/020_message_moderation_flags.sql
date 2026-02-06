-- =====================================================
-- Migration: Message Moderation Flags
-- Phase 1: Automatic flag detection system
-- =====================================================

-- Enum para tipos de flag
DO $$ BEGIN
    CREATE TYPE message_flag_type AS ENUM (
        'external_link',
        'invite_link',
        'spam_pattern',
        'trading_promo',
        'repeat_message',
        'mass_dm'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tabla de flags automáticos
CREATE TABLE IF NOT EXISTS message_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    flag_type message_flag_type NOT NULL,
    severity INT NOT NULL CHECK (severity BETWEEN 1 AND 5),
    evidence_hash TEXT, -- hash del patrón, NO el texto
    evidence_meta JSONB DEFAULT '{}', -- ej: {"domain": "t.me", "keyword_count": 3}
    reviewed_at TIMESTAMPTZ, -- null si no ha sido revisado
    reviewed_by UUID REFERENCES users(id),
    review_action TEXT, -- 'dismissed', 'warning_sent', 'user_banned', etc.
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id) -- null si es system
);

-- Índices para búsqueda eficiente
CREATE INDEX IF NOT EXISTS idx_message_flags_conversation ON message_flags(conversation_id);
CREATE INDEX IF NOT EXISTS idx_message_flags_severity ON message_flags(severity) WHERE severity >= 4;
CREATE INDEX IF NOT EXISTS idx_message_flags_type ON message_flags(flag_type);
CREATE INDEX IF NOT EXISTS idx_message_flags_created ON message_flags(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_flags_unreviewed ON message_flags(created_at DESC) WHERE reviewed_at IS NULL;

-- Comentarios para documentación
COMMENT ON TABLE message_flags IS 'Sistema de flags automáticos para moderación de mensajes';
COMMENT ON COLUMN message_flags.severity IS 'Severidad del flag: 1=bajo, 2=medio-bajo, 3=medio, 4=alto, 5=crítico';
COMMENT ON COLUMN message_flags.evidence_hash IS 'Hash SHA256 truncado del contenido detectado (privacidad)';
COMMENT ON COLUMN message_flags.evidence_meta IS 'Metadata sin contenido sensible: domain, keyword_count, etc.';

-- RLS
ALTER TABLE message_flags ENABLE ROW LEVEL SECURITY;

-- Función helper para verificar si es admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users
        WHERE id = user_id AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Solo admins pueden ver flags
DROP POLICY IF EXISTS "Admins can view all flags" ON message_flags;
CREATE POLICY "Admins can view all flags" ON message_flags
FOR SELECT USING (is_admin(auth.uid()));

-- Solo admins pueden actualizar (para marcar como revisado)
DROP POLICY IF EXISTS "Admins can update flags" ON message_flags;
CREATE POLICY "Admins can update flags" ON message_flags
FOR UPDATE USING (is_admin(auth.uid()));

-- Solo service_role puede insertar (via API con service key)
-- Los usuarios normales no pueden insertar flags
DROP POLICY IF EXISTS "Service role inserts flags" ON message_flags;
CREATE POLICY "Service role inserts flags" ON message_flags
FOR INSERT WITH CHECK (false); -- Solo service_role bypasea RLS

-- Vista para panel de admin con estadísticas
CREATE OR REPLACE VIEW message_flags_summary AS
SELECT
    flag_type,
    severity,
    COUNT(*) as total_flags,
    COUNT(*) FILTER (WHERE reviewed_at IS NULL) as pending_review,
    COUNT(*) FILTER (WHERE reviewed_at IS NOT NULL) as reviewed,
    MAX(created_at) as last_flag_at
FROM message_flags
GROUP BY flag_type, severity
ORDER BY severity DESC, total_flags DESC;

-- Permisos para la vista
GRANT SELECT ON message_flags_summary TO authenticated;

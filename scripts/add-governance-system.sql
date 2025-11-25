-- =============================================
-- SISTEMA DE GOBERNANZA - NODO360
-- =============================================

-- 1. Categorías de propuestas
CREATE TABLE IF NOT EXISTS public.governance_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT '📋',
    color TEXT DEFAULT '#ff6b35',
    proposal_level INTEGER DEFAULT 1 CHECK (proposal_level IN (1, 2)),
    is_active BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Propuestas de gobernanza
CREATE TABLE IF NOT EXISTS public.governance_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Info básica
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    detailed_content TEXT,

    -- Categorización
    category_id UUID REFERENCES public.governance_categories(id),
    proposal_level INTEGER NOT NULL DEFAULT 1 CHECK (proposal_level IN (1, 2)),
    tags TEXT[] DEFAULT '{}',

    -- Autor
    author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

    -- Estado y flujo
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
        'draft',           -- Borrador
        'pending_review',  -- Esperando validación
        'active',          -- Votación activa
        'passed',          -- Aprobada
        'rejected',        -- Rechazada
        'implemented',     -- Implementada
        'cancelled'        -- Cancelada
    )),

    -- Validación
    validated_by UUID REFERENCES public.users(id),
    validated_at TIMESTAMPTZ,
    validation_notes TEXT,

    -- Configuración de votación
    voting_starts_at TIMESTAMPTZ,
    voting_ends_at TIMESTAMPTZ,
    quorum_required INTEGER DEFAULT 10,
    approval_threshold DECIMAL(3,2) DEFAULT 0.60,

    -- Resultados
    total_votes INTEGER DEFAULT 0,
    total_gpower_for DECIMAL(12,2) DEFAULT 0,
    total_gpower_against DECIMAL(12,2) DEFAULT 0,
    total_gpower_abstain DECIMAL(12,2) DEFAULT 0,

    -- Implementación
    implemented_at TIMESTAMPTZ,
    implementation_notes TEXT,

    -- Metadatos
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Votos de gobernanza
CREATE TABLE IF NOT EXISTS public.governance_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id UUID NOT NULL REFERENCES public.governance_proposals(id) ON DELETE CASCADE,
    voter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

    -- Voto
    vote TEXT NOT NULL CHECK (vote IN ('for', 'against', 'abstain')),

    -- Poder de voto al momento de votar (snapshot)
    gpower_used DECIMAL(10,2) NOT NULL,
    xp_at_vote INTEGER NOT NULL,
    reputation_at_vote INTEGER DEFAULT 0,
    badges_count_at_vote INTEGER DEFAULT 0,

    -- Opcional: comentario del votante
    comment TEXT,

    -- Metadatos
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Un usuario solo puede votar una vez por propuesta
    UNIQUE(proposal_id, voter_id)
);

-- 4. Tabla de reputación (para el cálculo de gPower)
CREATE TABLE IF NOT EXISTS public.user_reputation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

    -- Puntos de reputación
    reputation_points INTEGER DEFAULT 0,

    -- Factores que suman reputación
    proposals_created INTEGER DEFAULT 0,
    proposals_passed INTEGER DEFAULT 0,
    votes_cast INTEGER DEFAULT 0,
    helpful_votes INTEGER DEFAULT 0,  -- Votos en propuestas que pasaron
    mentoring_sessions INTEGER DEFAULT 0,
    courses_completed INTEGER DEFAULT 0,

    -- Penalizaciones (opcional)
    warnings INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Historial de cambios de reputación
CREATE TABLE IF NOT EXISTS public.reputation_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    change_amount INTEGER NOT NULL,
    reason TEXT NOT NULL,
    related_proposal_id UUID REFERENCES public.governance_proposals(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ÍNDICES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_proposals_status ON public.governance_proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_author ON public.governance_proposals(author_id);
CREATE INDEX IF NOT EXISTS idx_proposals_category ON public.governance_proposals(category_id);
CREATE INDEX IF NOT EXISTS idx_proposals_level ON public.governance_proposals(proposal_level);
CREATE INDEX IF NOT EXISTS idx_proposals_voting_dates ON public.governance_proposals(voting_starts_at, voting_ends_at);

CREATE INDEX IF NOT EXISTS idx_votes_proposal ON public.governance_votes(proposal_id);
CREATE INDEX IF NOT EXISTS idx_votes_voter ON public.governance_votes(voter_id);

CREATE INDEX IF NOT EXISTS idx_reputation_user ON public.user_reputation(user_id);
CREATE INDEX IF NOT EXISTS idx_reputation_points ON public.user_reputation(reputation_points DESC);

-- =============================================
-- FUNCIONES
-- =============================================

-- Función para calcular gPower de un usuario
CREATE OR REPLACE FUNCTION public.calculate_gpower(p_user_id UUID)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    v_xp INTEGER;
    v_reputation INTEGER;
    v_badges_count INTEGER;
    v_gpower DECIMAL(10,2);
BEGIN
    -- Obtener XP
    SELECT COALESCE(total_xp, 0) INTO v_xp
    FROM public.user_gamification_stats
    WHERE user_id = p_user_id;

    -- Obtener reputación
    SELECT COALESCE(reputation_points, 0) INTO v_reputation
    FROM public.user_reputation
    WHERE user_id = p_user_id;

    -- Contar badges/hitos
    SELECT COUNT(*) INTO v_badges_count
    FROM public.user_badges
    WHERE user_id = p_user_id;

    -- Calcular gPower: XP * 0.4 + Rep * 0.4 + Badges * 0.2
    -- Normalizado: XP/100, Rep/10, Badges*10
    v_gpower := (COALESCE(v_xp, 0)::DECIMAL / 100 * 0.4) +
                (COALESCE(v_reputation, 0)::DECIMAL / 10 * 0.4) +
                (COALESCE(v_badges_count, 0)::DECIMAL * 10 * 0.2);

    -- Mínimo de 1 para usuarios activos
    IF v_gpower < 1 AND (v_xp > 0 OR v_reputation > 0 OR v_badges_count > 0) THEN
        v_gpower := 1;
    END IF;

    RETURN ROUND(v_gpower, 2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si usuario puede crear propuesta
CREATE OR REPLACE FUNCTION public.can_create_proposal(p_user_id UUID, p_level INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    v_xp INTEGER;
    v_role TEXT;
BEGIN
    -- Obtener XP y rol
    SELECT COALESCE(gs.total_xp, 0), u.role
    INTO v_xp, v_role
    FROM public.users u
    LEFT JOIN public.user_gamification_stats gs ON gs.user_id = u.id
    WHERE u.id = p_user_id;

    -- Nivel 1: Usuario con 50+ XP
    IF p_level = 1 THEN
        RETURN v_xp >= 50;
    END IF;

    -- Nivel 2: Solo mentor, admin o council
    IF p_level = 2 THEN
        RETURN v_role IN ('mentor', 'admin', 'council');
    END IF;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si usuario puede validar propuesta
CREATE OR REPLACE FUNCTION public.can_validate_proposal(p_user_id UUID, p_proposal_level INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    v_role TEXT;
BEGIN
    SELECT role INTO v_role
    FROM public.users
    WHERE id = p_user_id;

    -- Nivel 1: Mentores pueden validar
    IF p_proposal_level = 1 THEN
        RETURN v_role IN ('mentor', 'admin', 'council');
    END IF;

    -- Nivel 2: Solo council/admin
    IF p_proposal_level = 2 THEN
        RETURN v_role IN ('admin', 'council');
    END IF;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para actualizar contadores de propuesta al votar
CREATE OR REPLACE FUNCTION public.update_proposal_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.governance_proposals
        SET
            total_votes = total_votes + 1,
            total_gpower_for = CASE WHEN NEW.vote = 'for' THEN total_gpower_for + NEW.gpower_used ELSE total_gpower_for END,
            total_gpower_against = CASE WHEN NEW.vote = 'against' THEN total_gpower_against + NEW.gpower_used ELSE total_gpower_against END,
            total_gpower_abstain = CASE WHEN NEW.vote = 'abstain' THEN total_gpower_abstain + NEW.gpower_used ELSE total_gpower_abstain END,
            updated_at = NOW()
        WHERE id = NEW.proposal_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_vote_counts ON public.governance_votes;
CREATE TRIGGER trigger_update_vote_counts
    AFTER INSERT ON public.governance_votes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_proposal_vote_counts();

-- Trigger para actualizar reputación al pasar propuesta
CREATE OR REPLACE FUNCTION public.update_reputation_on_proposal_pass()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'passed' AND OLD.status = 'active' THEN
        -- +50 rep al autor
        INSERT INTO public.user_reputation (user_id, reputation_points, proposals_passed)
        VALUES (NEW.author_id, 50, 1)
        ON CONFLICT (user_id) DO UPDATE SET
            reputation_points = user_reputation.reputation_points + 50,
            proposals_passed = user_reputation.proposals_passed + 1,
            updated_at = NOW();

        -- Registrar en historial
        INSERT INTO public.reputation_history (user_id, change_amount, reason, related_proposal_id)
        VALUES (NEW.author_id, 50, 'Propuesta aprobada: ' || NEW.title, NEW.id);

        -- +10 rep a votantes que votaron "for"
        INSERT INTO public.reputation_history (user_id, change_amount, reason, related_proposal_id)
        SELECT voter_id, 10, 'Voto acertado en propuesta aprobada', NEW.id
        FROM public.governance_votes
        WHERE proposal_id = NEW.id AND vote = 'for';

        UPDATE public.user_reputation ur
        SET
            reputation_points = ur.reputation_points + 10,
            helpful_votes = ur.helpful_votes + 1,
            updated_at = NOW()
        FROM public.governance_votes gv
        WHERE gv.proposal_id = NEW.id
        AND gv.vote = 'for'
        AND gv.voter_id = ur.user_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_reputation_on_proposal ON public.governance_proposals;
CREATE TRIGGER trigger_reputation_on_proposal
    AFTER UPDATE ON public.governance_proposals
    FOR EACH ROW
    EXECUTE FUNCTION public.update_reputation_on_proposal_pass();

-- =============================================
-- RLS POLICIES
-- =============================================

ALTER TABLE public.governance_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.governance_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.governance_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reputation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reputation_history ENABLE ROW LEVEL SECURITY;

-- Categorías: todos pueden ver
DROP POLICY IF EXISTS "Anyone can view categories" ON public.governance_categories;
CREATE POLICY "Anyone can view categories"
    ON public.governance_categories FOR SELECT
    USING (true);

-- Propuestas: todos pueden ver las activas/pasadas
DROP POLICY IF EXISTS "Anyone can view public proposals" ON public.governance_proposals;
CREATE POLICY "Anyone can view public proposals"
    ON public.governance_proposals FOR SELECT
    USING (status NOT IN ('draft'));

-- Propuestas: autor puede ver sus borradores
DROP POLICY IF EXISTS "Authors can view own drafts" ON public.governance_proposals;
CREATE POLICY "Authors can view own drafts"
    ON public.governance_proposals FOR SELECT
    USING (author_id = auth.uid() AND status = 'draft');

-- Propuestas: usuarios autenticados pueden crear
DROP POLICY IF EXISTS "Authenticated users can create proposals" ON public.governance_proposals;
CREATE POLICY "Authenticated users can create proposals"
    ON public.governance_proposals FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Propuestas: autor puede editar borradores
DROP POLICY IF EXISTS "Authors can update own drafts" ON public.governance_proposals;
CREATE POLICY "Authors can update own drafts"
    ON public.governance_proposals FOR UPDATE
    USING (author_id = auth.uid() AND status = 'draft');

-- Votos: usuarios autenticados pueden votar
DROP POLICY IF EXISTS "Authenticated users can vote" ON public.governance_votes;
CREATE POLICY "Authenticated users can vote"
    ON public.governance_votes FOR INSERT
    WITH CHECK (auth.uid() = voter_id);

-- Votos: todos pueden ver votos
DROP POLICY IF EXISTS "Anyone can view votes" ON public.governance_votes;
CREATE POLICY "Anyone can view votes"
    ON public.governance_votes FOR SELECT
    USING (true);

-- Reputación: usuarios pueden ver su propia reputación
DROP POLICY IF EXISTS "Users can view own reputation" ON public.user_reputation;
CREATE POLICY "Users can view own reputation"
    ON public.user_reputation FOR SELECT
    USING (auth.uid() = user_id);

-- Reputación: todos pueden ver ranking público
DROP POLICY IF EXISTS "Anyone can view reputation ranking" ON public.user_reputation;
CREATE POLICY "Anyone can view reputation ranking"
    ON public.user_reputation FOR SELECT
    USING (true);

-- Historial de reputación: usuarios ven el propio
DROP POLICY IF EXISTS "Users can view own reputation history" ON public.reputation_history;
CREATE POLICY "Users can view own reputation history"
    ON public.reputation_history FOR SELECT
    USING (auth.uid() = user_id);

-- =============================================
-- DATOS INICIALES
-- =============================================

-- Categorías de propuestas
INSERT INTO public.governance_categories (slug, name, description, icon, color, proposal_level, order_index) VALUES
    ('ui-ux', 'Interfaz y Experiencia', 'Mejoras de diseño y usabilidad', '🎨', '#ff6b35', 1, 1),
    ('contenido', 'Contenido Educativo', 'Sugerencias de temas y materiales', '📚', '#f7931a', 1, 2),
    ('comunidad', 'Comunidad', 'Eventos, iniciativas sociales', '👥', '#10b981', 1, 3),
    ('gamificacion', 'Gamificación', 'Badges, XP, recompensas', '🎮', '#8b5cf6', 1, 4),
    ('nuevos-cursos', 'Nuevos Cursos', 'Propuestas de cursos completos', '🎓', '#3b82f6', 2, 5),
    ('politicas', 'Políticas', 'Reglas y normas de la plataforma', '📜', '#ef4444', 2, 6),
    ('tecnologia', 'Tecnología', 'Features técnicas importantes', '⚙️', '#6366f1', 2, 7),
    ('gobernanza', 'Gobernanza', 'Cambios al sistema de gobernanza', '🏛️', '#f59e0b', 2, 8)
ON CONFLICT (slug) DO NOTHING;

-- Crear registro de reputación para usuarios existentes
INSERT INTO public.user_reputation (user_id)
SELECT id FROM public.users
WHERE id NOT IN (SELECT user_id FROM public.user_reputation)
ON CONFLICT (user_id) DO NOTHING;

-- =============================================
-- VISTA PARA PROPUESTAS CON DETALLES
-- =============================================

DROP VIEW IF EXISTS public.proposals_with_details;
CREATE OR REPLACE VIEW public.proposals_with_details AS
SELECT
    p.*,
    u.full_name as author_name,
    u.avatar_url as author_avatar,
    u.role as author_role,
    c.name as category_name,
    c.icon as category_icon,
    c.color as category_color,
    public.calculate_gpower(p.author_id) as author_gpower,
    CASE
        WHEN p.voting_ends_at IS NOT NULL AND p.voting_ends_at > NOW()
        THEN EXTRACT(EPOCH FROM (p.voting_ends_at - NOW()))::INTEGER
        ELSE 0
    END as seconds_remaining
FROM public.governance_proposals p
JOIN public.users u ON u.id = p.author_id
LEFT JOIN public.governance_categories c ON c.id = p.category_id;

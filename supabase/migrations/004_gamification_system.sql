-- ================================================
-- SISTEMA DE GAMIFICACIÓN - NODO360
-- XP, Niveles, Badges y Leaderboard
-- ================================================

-- ================================================
-- 1. TABLA: user_gamification_stats
-- Estadísticas de gamificación por usuario
-- ================================================
CREATE TABLE IF NOT EXISTS public.user_gamification_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  total_xp INTEGER DEFAULT 0 NOT NULL,
  current_level INTEGER DEFAULT 1 NOT NULL,
  xp_to_next_level INTEGER DEFAULT 100 NOT NULL,
  total_badges INTEGER DEFAULT 0 NOT NULL,
  current_streak INTEGER DEFAULT 0 NOT NULL,
  longest_streak INTEGER DEFAULT 0 NOT NULL,
  last_activity_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  CONSTRAINT positive_xp CHECK (total_xp >= 0),
  CONSTRAINT positive_level CHECK (current_level >= 1),
  CONSTRAINT positive_streak CHECK (current_streak >= 0)
);

-- ================================================
-- 2. TABLA: xp_events
-- Registro de todos los eventos de XP
-- ================================================
CREATE TABLE IF NOT EXISTS public.xp_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'lesson_completed', 'course_completed', 'quiz_passed', 'streak_bonus'
  xp_earned INTEGER NOT NULL,
  related_id UUID, -- ID de la lección, curso, etc.
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  CONSTRAINT positive_xp_earned CHECK (xp_earned > 0)
);

-- ================================================
-- 3. TABLA: badges
-- Catálogo de badges disponibles
-- ================================================
CREATE TABLE IF NOT EXISTS public.badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- emoji o URL de imagen
  category TEXT, -- 'achievement', 'milestone', 'special'
  rarity TEXT CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  xp_reward INTEGER DEFAULT 0,
  requirement_type TEXT NOT NULL, -- 'lessons_completed', 'courses_completed', 'streak_days', 'total_xp'
  requirement_value INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  CONSTRAINT positive_requirement CHECK (requirement_value > 0)
);

-- ================================================
-- 4. TABLA: user_badges
-- Badges desbloqueados por usuarios
-- ================================================
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  UNIQUE(user_id, badge_id)
);

-- ================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ================================================
CREATE INDEX IF NOT EXISTS idx_gamification_user ON public.user_gamification_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_events_user ON public.xp_events(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_events_created ON public.xp_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_unlocked ON public.user_badges(unlocked_at DESC);
CREATE INDEX IF NOT EXISTS idx_gamification_level ON public.user_gamification_stats(current_level DESC);
CREATE INDEX IF NOT EXISTS idx_gamification_xp ON public.user_gamification_stats(total_xp DESC);

-- ================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================
ALTER TABLE public.user_gamification_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Políticas: user_gamification_stats
DROP POLICY IF EXISTS "Users can view own stats" ON public.user_gamification_stats;
CREATE POLICY "Users can view own stats"
  ON public.user_gamification_stats FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view all stats for leaderboard" ON public.user_gamification_stats;
CREATE POLICY "Users can view all stats for leaderboard"
  ON public.user_gamification_stats FOR SELECT
  USING (true);

-- Políticas: xp_events
DROP POLICY IF EXISTS "Users can view own xp events" ON public.xp_events;
CREATE POLICY "Users can view own xp events"
  ON public.xp_events FOR SELECT
  USING (auth.uid() = user_id);

-- Políticas: badges (todos pueden ver badges disponibles)
DROP POLICY IF EXISTS "Anyone can view active badges" ON public.badges;
CREATE POLICY "Anyone can view active badges"
  ON public.badges FOR SELECT
  USING (is_active = true);

-- Políticas: user_badges
DROP POLICY IF EXISTS "Users can view own badges" ON public.user_badges;
CREATE POLICY "Users can view own badges"
  ON public.user_badges FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view all badges for display" ON public.user_badges;
CREATE POLICY "Users can view all badges for display"
  ON public.user_badges FOR SELECT
  USING (true);

-- ================================================
-- FUNCIÓN: Calcular nivel desde XP
-- ================================================
CREATE OR REPLACE FUNCTION calculate_level_from_xp(xp INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  level INTEGER := 1;
  xp_required INTEGER := 100;
  xp_remaining INTEGER := xp;
BEGIN
  WHILE xp_remaining >= xp_required LOOP
    xp_remaining := xp_remaining - xp_required;
    level := level + 1;
    -- XP requerido aumenta 50 por nivel
    xp_required := 100 + ((level - 1) * 50);
  END LOOP;

  RETURN level;
END;
$$;

-- ================================================
-- FUNCIÓN: Calcular XP para siguiente nivel
-- ================================================
CREATE OR REPLACE FUNCTION calculate_xp_to_next_level(current_xp INTEGER, current_level INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  xp_for_level INTEGER := 100 + ((current_level - 1) * 50);
  xp_in_current_level INTEGER;
  level INTEGER := 1;
  total_xp_for_levels INTEGER := 0;
BEGIN
  -- Calcular XP total necesario hasta el nivel actual
  FOR i IN 1..(current_level - 1) LOOP
    total_xp_for_levels := total_xp_for_levels + (100 + ((i - 1) * 50));
  END LOOP;

  -- XP que tiene en el nivel actual
  xp_in_current_level := current_xp - total_xp_for_levels;

  -- XP que falta para siguiente nivel
  RETURN xp_for_level - xp_in_current_level;
END;
$$;

-- ================================================
-- TRIGGER: Actualizar stats al ganar XP
-- ================================================
CREATE OR REPLACE FUNCTION update_user_stats_on_xp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  new_total_xp INTEGER;
  new_level INTEGER;
  new_xp_to_next INTEGER;
BEGIN
  -- Actualizar total XP
  UPDATE user_gamification_stats
  SET
    total_xp = total_xp + NEW.xp_earned,
    updated_at = NOW()
  WHERE user_id = NEW.user_id
  RETURNING total_xp INTO new_total_xp;

  -- Calcular nuevo nivel
  new_level := calculate_level_from_xp(new_total_xp);

  -- Calcular XP para siguiente nivel
  new_xp_to_next := calculate_xp_to_next_level(new_total_xp, new_level);

  -- Actualizar nivel y XP to next
  UPDATE user_gamification_stats
  SET
    current_level = new_level,
    xp_to_next_level = new_xp_to_next,
    updated_at = NOW()
  WHERE user_id = NEW.user_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_stats_on_xp ON public.xp_events;
CREATE TRIGGER trigger_update_stats_on_xp
  AFTER INSERT ON public.xp_events
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats_on_xp();

-- ================================================
-- TRIGGER: Crear stats al crear usuario
-- ================================================
CREATE OR REPLACE FUNCTION create_user_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO user_gamification_stats (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_create_user_stats ON public.users;
CREATE TRIGGER trigger_create_user_stats
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_stats();

-- ================================================
-- TRIGGER: Otorgar XP al completar lección
-- ================================================
CREATE OR REPLACE FUNCTION award_xp_on_lesson_complete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Solo otorgar XP si es la primera vez que completa esta lección
  IF NEW.is_completed = true AND (OLD.is_completed IS NULL OR OLD.is_completed = false) THEN
    INSERT INTO xp_events (user_id, event_type, xp_earned, related_id, description)
    VALUES (
      NEW.user_id,
      'lesson_completed',
      10, -- 10 XP por lección
      NEW.lesson_id,
      'Lección completada'
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_award_xp_lesson ON public.user_progress;
CREATE TRIGGER trigger_award_xp_lesson
  AFTER INSERT OR UPDATE ON public.user_progress
  FOR EACH ROW
  EXECUTE FUNCTION award_xp_on_lesson_complete();

-- ================================================
-- DATOS INICIALES: BADGES
-- ================================================
INSERT INTO public.badges (slug, title, description, icon, category, rarity, xp_reward, requirement_type, requirement_value, order_index) VALUES
-- Badges de progreso básico
('first-lesson', 'Primera Lección', 'Completaste tu primera lección', '🎯', 'achievement', 'common', 5, 'lessons_completed', 1, 1),
('aprendiz', 'Aprendiz', 'Completaste 10 lecciones', '📚', 'milestone', 'common', 25, 'lessons_completed', 10, 2),
('estudioso', 'Estudioso', 'Completaste 25 lecciones', '📖', 'milestone', 'rare', 50, 'lessons_completed', 25, 3),
('erudito', 'Erudito', 'Completaste 50 lecciones', '🎓', 'milestone', 'epic', 100, 'lessons_completed', 50, 4),
('maestro', 'Maestro del Conocimiento', 'Completaste 100 lecciones', '👨‍🎓', 'milestone', 'legendary', 250, 'lessons_completed', 100, 5),

-- Badges de cursos
('first-course', 'Primer Curso', 'Completaste tu primer curso', '🏆', 'achievement', 'common', 50, 'courses_completed', 1, 10),
('dedicado', 'Dedicado', 'Completaste 3 cursos', '💎', 'milestone', 'rare', 150, 'courses_completed', 3, 11),
('experto', 'Experto', 'Completaste 5 cursos', '⭐', 'milestone', 'epic', 300, 'courses_completed', 5, 12),

-- Badges de racha
('racha-7', 'Racha Semanal', '7 días seguidos aprendiendo', '🔥', 'achievement', 'rare', 75, 'streak_days', 7, 20),
('racha-30', 'Racha Mensual', '30 días seguidos aprendiendo', '🌟', 'achievement', 'epic', 200, 'streak_days', 30, 21),
('racha-100', 'Racha Centenaria', '100 días seguidos aprendiendo', '💫', 'achievement', 'legendary', 500, 'streak_days', 100, 22),

-- Badges de XP
('nivel-5', 'Nivel 5', 'Alcanzaste el nivel 5', '🥉', 'milestone', 'common', 0, 'total_xp', 400, 30),
('nivel-10', 'Nivel 10', 'Alcanzaste el nivel 10', '🥈', 'milestone', 'rare', 0, 'total_xp', 1400, 31),
('nivel-20', 'Nivel 20', 'Alcanzaste el nivel 20', '🥇', 'milestone', 'epic', 0, 'total_xp', 4400, 32),

-- Badges especiales
('early-adopter', 'Early Adopter', 'Usuario de las primeras 100 personas', '🚀', 'special', 'legendary', 500, 'lessons_completed', 1, 100),
('crypto-master', 'Crypto Master', 'Completaste todos los cursos de Bitcoin', '₿', 'special', 'legendary', 1000, 'courses_completed', 3, 101)
ON CONFLICT (slug) DO NOTHING;

-- ================================================
-- FUNCIÓN: Verificar y otorgar badges
-- ================================================
CREATE OR REPLACE FUNCTION check_and_award_badges(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  user_stats RECORD;
  badge RECORD;
  lessons_completed INTEGER;
  courses_completed INTEGER;
BEGIN
  -- Obtener stats del usuario
  SELECT * INTO user_stats
  FROM user_gamification_stats
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Contar lecciones completadas
  SELECT COUNT(*) INTO lessons_completed
  FROM user_progress
  WHERE user_id = p_user_id AND is_completed = true;

  -- Contar cursos completados (todos los módulos y lecciones completos)
  -- Por ahora simplificado
  courses_completed := 0;

  -- Revisar cada badge y otorgar si cumple requisitos
  FOR badge IN
    SELECT b.*
    FROM badges b
    WHERE b.is_active = true
    AND NOT EXISTS (
      SELECT 1 FROM user_badges ub
      WHERE ub.user_id = p_user_id AND ub.badge_id = b.id
    )
  LOOP
    DECLARE
      should_award BOOLEAN := false;
    BEGIN
      -- Verificar requisito según tipo
      CASE badge.requirement_type
        WHEN 'lessons_completed' THEN
          should_award := lessons_completed >= badge.requirement_value;
        WHEN 'courses_completed' THEN
          should_award := courses_completed >= badge.requirement_value;
        WHEN 'streak_days' THEN
          should_award := user_stats.current_streak >= badge.requirement_value;
        WHEN 'total_xp' THEN
          should_award := user_stats.total_xp >= badge.requirement_value;
      END CASE;

      -- Otorgar badge si cumple
      IF should_award THEN
        INSERT INTO user_badges (user_id, badge_id)
        VALUES (p_user_id, badge.id)
        ON CONFLICT DO NOTHING;

        -- Actualizar contador de badges
        UPDATE user_gamification_stats
        SET total_badges = total_badges + 1
        WHERE user_id = p_user_id;

        -- Otorgar XP bonus del badge
        IF badge.xp_reward > 0 THEN
          INSERT INTO xp_events (user_id, event_type, xp_earned, related_id, description)
          VALUES (
            p_user_id,
            'badge_unlocked',
            badge.xp_reward,
            badge.id,
            'Badge desbloqueado: ' || badge.title
          );
        END IF;
      END IF;
    END;
  END LOOP;
END;
$$;

-- ================================================
-- TRIGGER: Verificar badges al ganar XP
-- ================================================
CREATE OR REPLACE FUNCTION check_badges_on_xp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM check_and_award_badges(NEW.user_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_check_badges ON public.xp_events;
CREATE TRIGGER trigger_check_badges
  AFTER INSERT ON public.xp_events
  FOR EACH ROW
  EXECUTE FUNCTION check_badges_on_xp();

-- ================================================
-- COMENTARIOS
-- ================================================
COMMENT ON TABLE public.user_gamification_stats IS 'Estadísticas de gamificación por usuario';
COMMENT ON TABLE public.xp_events IS 'Registro de eventos de XP';
COMMENT ON TABLE public.badges IS 'Catálogo de badges disponibles';
COMMENT ON TABLE public.user_badges IS 'Badges desbloqueados por usuarios';

COMMENT ON COLUMN public.user_gamification_stats.total_xp IS 'XP total acumulado';
COMMENT ON COLUMN public.user_gamification_stats.current_level IS 'Nivel actual del usuario';
COMMENT ON COLUMN public.user_gamification_stats.xp_to_next_level IS 'XP necesario para siguiente nivel';
COMMENT ON COLUMN public.xp_events.event_type IS 'Tipo de evento que otorgó XP';
COMMENT ON COLUMN public.badges.requirement_type IS 'Tipo de requisito para desbloquear';
COMMENT ON COLUMN public.badges.requirement_value IS 'Valor del requisito';

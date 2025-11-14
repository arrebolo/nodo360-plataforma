-- ============================================
-- USER PROGRESS & DASHBOARD TABLES
-- ============================================

-- Tabla de inscripciones de cursos
CREATE TABLE IF NOT EXISTS course_enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  progress_percentage INTEGER DEFAULT 0,
  UNIQUE(user_id, course_id)
);

-- Tabla de progreso por lección
CREATE TABLE IF NOT EXISTS lesson_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  last_position INTEGER DEFAULT 0, -- Para videos/lecturas largas
  time_spent_seconds INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  UNIQUE(user_id, lesson_id)
);

-- Tabla de certificados
CREATE TABLE IF NOT EXISTS certificates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  certificate_number TEXT UNIQUE NOT NULL,
  certificate_url TEXT, -- URL al PDF generado
  UNIQUE(user_id, course_id)
);

-- Tabla de logros/achievements
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL, -- 'first_lesson', 'streak_7', 'course_completed', etc.
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB, -- Datos adicionales del logro
  UNIQUE(user_id, achievement_type)
);

-- Tabla de actividad
CREATE TABLE IF NOT EXISTS user_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- 'lesson_started', 'lesson_completed', 'course_enrolled', etc.
  related_id UUID, -- ID del curso/lección relacionado
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB
);

-- Tabla de perfil de usuario extendido
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  total_xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_enrollments_user ON course_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user ON lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_course ON lesson_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson ON lesson_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_certificates_user ON certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_user ON user_activity(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user ON user_profiles(user_id);

-- ============================================
-- FUNCIONES
-- ============================================

-- Función para calcular progreso del curso
CREATE OR REPLACE FUNCTION calculate_course_progress(p_user_id UUID, p_course_id UUID)
RETURNS INTEGER AS $$
DECLARE
  total_lessons INTEGER;
  completed_lessons INTEGER;
BEGIN
  -- Contar total de lecciones del curso
  SELECT COUNT(*) INTO total_lessons
  FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = p_course_id;

  -- Contar lecciones completadas por el usuario
  SELECT COUNT(*) INTO completed_lessons
  FROM lesson_progress lp
  JOIN lessons l ON lp.lesson_id = l.id
  JOIN modules m ON l.module_id = m.id
  WHERE lp.user_id = p_user_id
    AND m.course_id = p_course_id
    AND lp.is_completed = true;

  -- Calcular porcentaje
  IF total_lessons = 0 THEN
    RETURN 0;
  END IF;

  RETURN (completed_lessons * 100 / total_lessons);
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar progreso del curso
CREATE OR REPLACE FUNCTION update_course_progress()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE course_enrollments
  SET
    progress_percentage = calculate_course_progress(NEW.user_id, NEW.course_id),
    last_accessed_at = NOW()
  WHERE user_id = NEW.user_id AND course_id = NEW.course_id;

  -- Marcar curso como completado si llegó al 100%
  UPDATE course_enrollments
  SET completed_at = NOW()
  WHERE user_id = NEW.user_id
    AND course_id = NEW.course_id
    AND progress_percentage = 100
    AND completed_at IS NULL;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_course_progress ON lesson_progress;
CREATE TRIGGER trigger_update_course_progress
AFTER INSERT OR UPDATE ON lesson_progress
FOR EACH ROW
EXECUTE FUNCTION update_course_progress();

-- Función para actualizar racha de usuario
CREATE OR REPLACE FUNCTION update_user_streak()
RETURNS TRIGGER AS $$
DECLARE
  last_date DATE;
  current_date DATE := CURRENT_DATE;
BEGIN
  SELECT last_activity_date INTO last_date
  FROM user_profiles
  WHERE user_id = NEW.user_id;

  -- Si es el primer registro o no hay actividad previa
  IF last_date IS NULL THEN
    UPDATE user_profiles
    SET
      current_streak = 1,
      longest_streak = GREATEST(longest_streak, 1),
      last_activity_date = current_date
    WHERE user_id = NEW.user_id;
    RETURN NEW;
  END IF;

  -- Si ya hubo actividad hoy, no hacer nada
  IF last_date = current_date THEN
    RETURN NEW;
  END IF;

  -- Si fue ayer, incrementar racha
  IF last_date = current_date - INTERVAL '1 day' THEN
    UPDATE user_profiles
    SET
      current_streak = current_streak + 1,
      longest_streak = GREATEST(longest_streak, current_streak + 1),
      last_activity_date = current_date
    WHERE user_id = NEW.user_id;
  ELSE
    -- Si fue hace más de 1 día, reiniciar racha
    UPDATE user_profiles
    SET
      current_streak = 1,
      last_activity_date = current_date
    WHERE user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_streak ON user_activity;
CREATE TRIGGER trigger_update_streak
AFTER INSERT ON user_activity
FOR EACH ROW
EXECUTE FUNCTION update_user_streak();

-- Función para crear perfil de usuario automáticamente
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario'))
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_profile ON auth.users;
CREATE TRIGGER trigger_create_profile
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION create_user_profile();

-- ============================================
-- DATOS INICIALES - DEFINICIÓN DE LOGROS
-- ============================================

-- Comentario: Los logros se validan en el backend, esta es solo documentación

/*
LOGROS DISPONIBLES:

- first_lesson: Primera lección completada
- streak_3: Racha de 3 días consecutivos
- streak_7: Racha de 7 días consecutivos
- streak_30: Racha de 30 días consecutivos
- course_completed_1: Primer curso completado
- course_completed_5: 5 cursos completados
- course_completed_10: 10 cursos completados
- lessons_10: 10 lecciones completadas
- lessons_50: 50 lecciones completadas
- lessons_100: 100 lecciones completadas
- hours_10: 10 horas de estudio
- hours_50: 50 horas de estudio
- hours_100: 100 horas de estudio
- bitcoin_expert: Completó todos los cursos de Bitcoin
- blockchain_expert: Completó todos los cursos de Blockchain
- defi_expert: Completó todos los cursos de DeFi
*/

-- ============================================
-- COMENTARIOS
-- ============================================

COMMENT ON TABLE course_enrollments IS 'Registro de inscripciones de usuarios en cursos';
COMMENT ON TABLE lesson_progress IS 'Progreso detallado de cada usuario en cada lección';
COMMENT ON TABLE certificates IS 'Certificados emitidos a usuarios por completar cursos';
COMMENT ON TABLE user_achievements IS 'Logros desbloqueados por usuarios';
COMMENT ON TABLE user_activity IS 'Timeline de actividad de usuarios para el dashboard';
COMMENT ON TABLE user_profiles IS 'Perfil extendido de usuario con estadísticas de gamificación';

-- =====================================================
-- MIGRATION 006: Course Counters Auto-Update Triggers
-- =====================================================
-- Fixes the issue where courses show "0 modules" and "0 lessons"
-- by creating triggers that automatically update counters.
--
-- Run this in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- STEP 1: Update existing course counters
-- =====================================================

-- Update total_modules for all courses
UPDATE public.courses c
SET total_modules = (
  SELECT COUNT(*)
  FROM public.modules m
  WHERE m.course_id = c.id
);

-- Update total_lessons for all courses
UPDATE public.courses c
SET total_lessons = (
  SELECT COUNT(*)
  FROM public.lessons l
  JOIN public.modules m ON l.module_id = m.id
  WHERE m.course_id = c.id
);

-- Update total_lessons for all modules
UPDATE public.modules m
SET total_lessons = (
  SELECT COUNT(*)
  FROM public.lessons l
  WHERE l.module_id = m.id
);

-- =====================================================
-- STEP 2: Create trigger function for modules
-- =====================================================

CREATE OR REPLACE FUNCTION update_course_module_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment module count
    UPDATE public.courses
    SET total_modules = total_modules + 1,
        updated_at = NOW()
    WHERE id = NEW.course_id;
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement module count
    UPDATE public.courses
    SET total_modules = GREATEST(0, total_modules - 1),
        updated_at = NOW()
    WHERE id = OLD.course_id;

    -- Also decrement total_lessons by the deleted module's lesson count
    UPDATE public.courses
    SET total_lessons = GREATEST(0, total_lessons - COALESCE(OLD.total_lessons, 0))
    WHERE id = OLD.course_id;

    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 3: Create trigger function for lessons
-- =====================================================

CREATE OR REPLACE FUNCTION update_lesson_counts()
RETURNS TRIGGER AS $$
DECLARE
  v_course_id UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Get course_id from module
    SELECT course_id INTO v_course_id
    FROM public.modules
    WHERE id = NEW.module_id;

    -- Increment lesson count in module
    UPDATE public.modules
    SET total_lessons = total_lessons + 1,
        updated_at = NOW()
    WHERE id = NEW.module_id;

    -- Increment lesson count in course
    UPDATE public.courses
    SET total_lessons = total_lessons + 1,
        updated_at = NOW()
    WHERE id = v_course_id;

    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    -- Get course_id from module
    SELECT course_id INTO v_course_id
    FROM public.modules
    WHERE id = OLD.module_id;

    -- Decrement lesson count in module
    UPDATE public.modules
    SET total_lessons = GREATEST(0, total_lessons - 1),
        updated_at = NOW()
    WHERE id = OLD.module_id;

    -- Decrement lesson count in course
    UPDATE public.courses
    SET total_lessons = GREATEST(0, total_lessons - 1),
        updated_at = NOW()
    WHERE id = v_course_id;

    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 4: Create the triggers
-- =====================================================

-- Drop existing triggers if they exist (for idempotency)
DROP TRIGGER IF EXISTS trigger_update_course_module_count ON public.modules;
DROP TRIGGER IF EXISTS trigger_update_lesson_counts ON public.lessons;

-- Create trigger for modules table
CREATE TRIGGER trigger_update_course_module_count
  AFTER INSERT OR DELETE ON public.modules
  FOR EACH ROW
  EXECUTE FUNCTION update_course_module_count();

-- Create trigger for lessons table
CREATE TRIGGER trigger_update_lesson_counts
  AFTER INSERT OR DELETE ON public.lessons
  FOR EACH ROW
  EXECUTE FUNCTION update_lesson_counts();

-- =====================================================
-- STEP 5: Verify the update
-- =====================================================

-- Show updated course stats (for verification)
SELECT
  c.id,
  c.title,
  c.total_modules,
  c.total_lessons,
  (SELECT COUNT(*) FROM public.modules m WHERE m.course_id = c.id) as actual_modules,
  (SELECT COUNT(*) FROM public.lessons l JOIN public.modules m ON l.module_id = m.id WHERE m.course_id = c.id) as actual_lessons
FROM public.courses c
ORDER BY c.created_at DESC
LIMIT 10;

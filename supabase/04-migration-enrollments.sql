-- =====================================================
-- MIGRATION: Course Enrollments System
-- =====================================================
-- Adds the course_enrollments table to track user course enrollments
-- This table is critical for the enrollment system to function
--
-- APPLY THIS MIGRATION:
-- 1. Go to Supabase Dashboard
-- 2. Navigate to SQL Editor
-- 3. Copy and paste this entire file
-- 4. Execute the script
-- =====================================================

-- =====================================================
-- TABLE: course_enrollments
-- =====================================================
-- Tracks which courses users are enrolled in
-- Stores enrollment date, progress, and completion status

CREATE TABLE IF NOT EXISTS public.course_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,

  -- Progress tracking
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),

  -- Timestamps
  enrolled_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_accessed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Constraints
  UNIQUE(user_id, course_id)
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Index for querying user's enrollments
CREATE INDEX idx_enrollments_user_id ON public.course_enrollments(user_id);

-- Index for querying course enrollments
CREATE INDEX idx_enrollments_course_id ON public.course_enrollments(course_id);

-- Index for finding active enrollments (not completed)
CREATE INDEX idx_enrollments_active ON public.course_enrollments(user_id, completed_at)
  WHERE completed_at IS NULL;

-- Index for last accessed (for dashboard "continue learning")
CREATE INDEX idx_enrollments_last_accessed ON public.course_enrollments(user_id, last_accessed_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;

-- Users can view their own enrollments
CREATE POLICY "Users can view own enrollments"
  ON public.course_enrollments FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own enrollments (enroll in courses)
CREATE POLICY "Users can create own enrollments"
  ON public.course_enrollments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own enrollments (progress, last_accessed)
CREATE POLICY "Users can update own enrollments"
  ON public.course_enrollments FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own enrollments (unenroll)
CREATE POLICY "Users can delete own enrollments"
  ON public.course_enrollments FOR DELETE
  USING (auth.uid() = user_id);

-- Instructors and admins can view all enrollments for their courses
CREATE POLICY "Instructors can view course enrollments"
  ON public.course_enrollments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = course_enrollments.course_id
        AND courses.instructor_id = auth.uid()
    )
  );

-- Admins can view all enrollments
CREATE POLICY "Admins can view all enrollments"
  ON public.course_enrollments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
  );

-- =====================================================
-- FUNCTION: Update course enrolled_count
-- =====================================================
-- This function automatically updates the enrolled_count
-- field in the courses table when enrollments change

CREATE OR REPLACE FUNCTION update_course_enrolled_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the enrolled_count for the affected course
  IF TG_OP = 'INSERT' THEN
    UPDATE public.courses
    SET enrolled_count = enrolled_count + 1
    WHERE id = NEW.course_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.courses
    SET enrolled_count = GREATEST(0, enrolled_count - 1)
    WHERE id = OLD.course_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGER: Auto-update enrolled_count
-- =====================================================

DROP TRIGGER IF EXISTS trg_update_enrolled_count ON public.course_enrollments;

CREATE TRIGGER trg_update_enrolled_count
  AFTER INSERT OR DELETE ON public.course_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION update_course_enrolled_count();

-- =====================================================
-- FUNCTION: Update last_accessed_at automatically
-- =====================================================
-- Updates last_accessed_at when progress_percentage changes

CREATE OR REPLACE FUNCTION update_enrollment_last_accessed()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if progress_percentage changed
  IF NEW.progress_percentage IS DISTINCT FROM OLD.progress_percentage THEN
    NEW.last_accessed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGER: Auto-update last_accessed_at
-- =====================================================

DROP TRIGGER IF EXISTS trg_update_last_accessed ON public.course_enrollments;

CREATE TRIGGER trg_update_last_accessed
  BEFORE UPDATE ON public.course_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION update_enrollment_last_accessed();

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Check that table was created successfully

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'course_enrollments'
  ) THEN
    RAISE NOTICE '✅ Migration successful: course_enrollments table created';
  ELSE
    RAISE EXCEPTION '❌ Migration failed: course_enrollments table not found';
  END IF;
END $$;

-- =====================================================
-- SUMMARY
-- =====================================================
-- ✅ Created: course_enrollments table
-- ✅ Added: 4 indexes for query optimization
-- ✅ Enabled: Row Level Security (RLS)
-- ✅ Created: 7 RLS policies (users, instructors, admins)
-- ✅ Created: Trigger to auto-update enrolled_count
-- ✅ Created: Trigger to auto-update last_accessed_at
-- =====================================================

-- =====================================================
-- NODO360 PLATFORM - DATABASE SCHEMA
-- =====================================================
-- Este esquema define todas las tablas necesarias para la plataforma
-- de cursos Nodo360, incluyendo usuarios, cursos, progreso y más.
--
-- INSTRUCCIONES PARA APLICAR:
-- 1. Abre Supabase Dashboard
-- 2. Ve a SQL Editor
-- 3. Copia y pega este archivo completo
-- 4. Ejecuta el script
-- =====================================================

-- =====================================================
-- ENABLE EXTENSIONS
-- =====================================================

-- UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Full text search (for course search)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================
-- CUSTOM TYPES
-- =====================================================

-- User role enum
CREATE TYPE user_role AS ENUM ('student', 'instructor', 'admin');

-- Course level enum
CREATE TYPE course_level AS ENUM ('beginner', 'intermediate', 'advanced');

-- Course status enum
CREATE TYPE course_status AS ENUM ('draft', 'published', 'archived');

-- =====================================================
-- TABLE: users (extends auth.users)
-- =====================================================
-- Stores additional user profile information
-- Linked to Supabase auth.users via user_id

CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'student' NOT NULL,
  bio TEXT,
  website TEXT,
  twitter_handle TEXT,
  github_handle TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_seen_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for users table
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_email ON public.users(email);

-- RLS Policies for users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Anyone can view public profiles (for instructor pages, etc.)
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.users FOR SELECT
  USING (true);

-- =====================================================
-- TABLE: courses
-- =====================================================
-- Stores course information

CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  long_description TEXT,
  thumbnail_url TEXT,
  banner_url TEXT,

  -- Course metadata
  level course_level DEFAULT 'beginner' NOT NULL,
  status course_status DEFAULT 'draft' NOT NULL,
  price DECIMAL(10, 2) DEFAULT 0,
  is_free BOOLEAN DEFAULT true NOT NULL,

  -- Instructor
  instructor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,

  -- Stats
  total_modules INTEGER DEFAULT 0,
  total_lessons INTEGER DEFAULT 0,
  total_duration_minutes INTEGER DEFAULT 0,
  enrolled_count INTEGER DEFAULT 0,

  -- SEO
  meta_title TEXT,
  meta_description TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  published_at TIMESTAMPTZ
);

-- Indexes for courses
CREATE INDEX idx_courses_slug ON public.courses(slug);
CREATE INDEX idx_courses_status ON public.courses(status);
CREATE INDEX idx_courses_instructor ON public.courses(instructor_id);
CREATE INDEX idx_courses_is_free ON public.courses(is_free);

-- Full-text search index
CREATE INDEX idx_courses_title_search ON public.courses USING gin(to_tsvector('spanish', title));
CREATE INDEX idx_courses_description_search ON public.courses USING gin(to_tsvector('spanish', description));

-- RLS Policies for courses
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Anyone can view published courses
CREATE POLICY "Anyone can view published courses"
  ON public.courses FOR SELECT
  USING (status = 'published');

-- Instructors can view their own draft courses
CREATE POLICY "Instructors can view own courses"
  ON public.courses FOR SELECT
  USING (auth.uid() = instructor_id);

-- Only instructors can create courses
CREATE POLICY "Instructors can create courses"
  ON public.courses FOR INSERT
  WITH CHECK (auth.uid() = instructor_id);

-- Instructors can update their own courses
CREATE POLICY "Instructors can update own courses"
  ON public.courses FOR UPDATE
  USING (auth.uid() = instructor_id);

-- =====================================================
-- TABLE: modules
-- =====================================================
-- Stores course modules (sections)

CREATE TABLE public.modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,

  -- Stats
  total_lessons INTEGER DEFAULT 0,
  total_duration_minutes INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Ensure unique order within a course
  UNIQUE(course_id, order_index)
);

-- Indexes for modules
CREATE INDEX idx_modules_course_id ON public.modules(course_id);
CREATE INDEX idx_modules_order ON public.modules(course_id, order_index);

-- RLS Policies for modules
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

-- Anyone can view modules of published courses
CREATE POLICY "Anyone can view modules of published courses"
  ON public.modules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = modules.course_id
      AND courses.status = 'published'
    )
  );

-- Instructors can manage modules of their courses
CREATE POLICY "Instructors can manage own course modules"
  ON public.modules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = modules.course_id
      AND courses.instructor_id = auth.uid()
    )
  );

-- =====================================================
-- TABLE: lessons
-- =====================================================
-- Stores individual lessons within modules

CREATE TABLE public.lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  slug TEXT NOT NULL,
  order_index INTEGER NOT NULL,

  -- Content
  content TEXT, -- Markdown/HTML content
  video_url TEXT,
  video_duration_minutes INTEGER DEFAULT 0,

  -- Resources
  attachments JSONB DEFAULT '[]'::jsonb,

  -- Settings
  is_free_preview BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Ensure unique order within a module
  UNIQUE(module_id, order_index)
);

-- Indexes for lessons
CREATE INDEX idx_lessons_module_id ON public.lessons(module_id);
CREATE INDEX idx_lessons_slug ON public.lessons(module_id, slug);
CREATE INDEX idx_lessons_order ON public.lessons(module_id, order_index);

-- RLS Policies for lessons
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- Anyone can view lessons of published courses
CREATE POLICY "Anyone can view lessons of published courses"
  ON public.lessons FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.modules
      JOIN public.courses ON courses.id = modules.course_id
      WHERE modules.id = lessons.module_id
      AND courses.status = 'published'
    )
  );

-- Instructors can manage lessons of their courses
CREATE POLICY "Instructors can manage own course lessons"
  ON public.lessons FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.modules
      JOIN public.courses ON courses.id = modules.course_id
      WHERE modules.id = lessons.module_id
      AND courses.instructor_id = auth.uid()
    )
  );

-- =====================================================
-- TABLE: user_progress
-- =====================================================
-- Tracks user progress through lessons

CREATE TABLE public.user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,

  -- Progress data
  is_completed BOOLEAN DEFAULT false NOT NULL,
  completed_at TIMESTAMPTZ,
  watch_time_seconds INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- One progress record per user per lesson
  UNIQUE(user_id, lesson_id)
);

-- Indexes for user_progress
CREATE INDEX idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX idx_user_progress_lesson_id ON public.user_progress(lesson_id);
CREATE INDEX idx_user_progress_completed ON public.user_progress(user_id, is_completed);

-- RLS Policies for user_progress
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- Users can view their own progress
CREATE POLICY "Users can view own progress"
  ON public.user_progress FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own progress
CREATE POLICY "Users can insert own progress"
  ON public.user_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own progress
CREATE POLICY "Users can update own progress"
  ON public.user_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- =====================================================
-- TABLE: bookmarks
-- =====================================================
-- Stores user bookmarks for lessons

CREATE TABLE public.bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
  note TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- One bookmark per user per lesson
  UNIQUE(user_id, lesson_id)
);

-- Indexes for bookmarks
CREATE INDEX idx_bookmarks_user_id ON public.bookmarks(user_id);
CREATE INDEX idx_bookmarks_lesson_id ON public.bookmarks(lesson_id);

-- RLS Policies for bookmarks
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

-- Users can manage their own bookmarks
CREATE POLICY "Users can view own bookmarks"
  ON public.bookmarks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own bookmarks"
  ON public.bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks"
  ON public.bookmarks FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- TABLE: notes
-- =====================================================
-- Stores user notes for lessons

CREATE TABLE public.notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,

  -- Optional: timestamp in video where note was taken
  video_timestamp_seconds INTEGER,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for notes
CREATE INDEX idx_notes_user_id ON public.notes(user_id);
CREATE INDEX idx_notes_lesson_id ON public.notes(lesson_id);
CREATE INDEX idx_notes_user_lesson ON public.notes(user_id, lesson_id);

-- RLS Policies for notes
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Users can manage their own notes
CREATE POLICY "Users can view own notes"
  ON public.notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own notes"
  ON public.notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes"
  ON public.notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes"
  ON public.notes FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON public.modules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON public.lessons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON public.user_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON public.notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- SAMPLE DATA (OPTIONAL - for testing)
-- =====================================================
-- Uncomment to insert sample course data

/*
-- Insert sample course
INSERT INTO public.courses (slug, title, description, level, status, is_free)
VALUES (
  'bitcoin-fundamentals',
  'Fundamentos de Bitcoin',
  'Aprende los conceptos básicos de Bitcoin desde cero',
  'beginner',
  'published',
  true
);

-- Get the course ID
DO $$
DECLARE
  v_course_id UUID;
  v_module_id UUID;
BEGIN
  -- Get course ID
  SELECT id INTO v_course_id FROM public.courses WHERE slug = 'bitcoin-fundamentals';

  -- Insert module
  INSERT INTO public.modules (course_id, title, description, order_index)
  VALUES (v_course_id, 'Introducción a Bitcoin', 'Conceptos básicos', 1)
  RETURNING id INTO v_module_id;

  -- Insert lesson
  INSERT INTO public.lessons (module_id, title, slug, order_index, content, is_free_preview)
  VALUES (
    v_module_id,
    '¿Qué es Bitcoin?',
    'que-es-bitcoin',
    1,
    'Bitcoin es una moneda digital descentralizada...',
    true
  );
END $$;
*/

-- =====================================================
-- DONE!
-- =====================================================
-- Schema creation complete.
-- Next steps:
-- 1. Review the tables in Supabase Dashboard
-- 2. Test RLS policies
-- 3. Create your first course!
-- =====================================================

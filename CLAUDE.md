# CLAUDE.md - AI Assistant Guide for Nodo360 Platform

> **Purpose**: This document provides AI assistants with essential context about the Nodo360 learning platform codebase, including architecture, patterns, conventions, and development workflows.

**Last Updated**: 2025-11-17
**Project**: Nodo360 - Bitcoin & Blockchain Learning Platform
**Framework**: Next.js 16 (App Router) + Supabase (PostgreSQL)

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Database Architecture](#database-architecture)
5. [Critical Patterns & Conventions](#critical-patterns--conventions)
6. [Data Access Patterns](#data-access-patterns)
7. [Development Workflow](#development-workflow)
8. [Key Files & Locations](#key-files--locations)
9. [Common Tasks](#common-tasks)
10. [Testing & Quality](#testing--quality)
11. [Troubleshooting](#troubleshooting)

---

## Project Overview

**Nodo360** is a modern learning management system (LMS) focused on Bitcoin and blockchain education. The platform features:

- **Hierarchical Course Structure**: Courses → Modules → Lessons
- **Dual Content System**: Legacy HTML/Markdown + Modern JSON block-based content
- **User Progress Tracking**: Completion, watch time, streaks, XP, achievements
- **Premium Features**: Certificates, advanced resources, mentorship access
- **Community Integration**: Newsletter, Discord/Telegram, community widget
- **Full-Text Search**: PostgreSQL-based search with Spanish language support

### Current State

- ✅ **MVP Ready**: Core course/lesson viewing functional
- ✅ **Database Schema**: Complete with RLS policies
- ✅ **Content System**: Both legacy and modern JSON formats supported
- 🚧 **Auth UI**: Backend ready, frontend pending
- 🚧 **Progress Tracking**: Schema ready, implementation pending
- 🚧 **Payment Integration**: Not yet implemented

---

## Tech Stack

### Core Framework

```json
{
  "next": "16.0.1",           // React framework with App Router
  "react": "19.2.0",          // Latest React (canary)
  "typescript": "^5"          // Type safety
}
```

### Database & Backend

- **Supabase** - PostgreSQL + Auth + Storage + Real-time
  - `@supabase/supabase-js ^2.81.1` - Client library
  - `@supabase/ssr ^0.7.0` - Server-side rendering support
- **PostgreSQL Extensions**: `uuid-ossp`, `pg_trgm` (full-text search)

### Styling & UI

- **Tailwind CSS v4** - Utility-first CSS (latest version)
- **Lucide React** - Icon library
- **Custom Components** - No UI library dependency

### Development Tools

- **ESLint 9** - Code linting
- **tsx** - TypeScript execution for scripts
- **dotenv** - Environment variable management

### Content Processing

- **Cheerio** - HTML parsing for legacy content
- **Custom JSON** - Block-based lesson content system

---

## Project Structure

```
nodo360-plataforma/
├── app/                          # Next.js 16 App Router
│   ├── page.tsx                  # Homepage
│   ├── cursos/                   # Course routes
│   │   ├── page.tsx              # Course listing
│   │   └── [slug]/               # Dynamic course routes
│   │       ├── page.tsx          # Course detail page
│   │       └── [lessonSlug]/     # Dynamic lesson routes
│   │           └── page.tsx      # Lesson viewer
│   ├── dashboard/                # User dashboard (future)
│   ├── comunidad/                # Community page
│   ├── mentoria/                 # Mentorship page
│   ├── proyectos/                # Projects page
│   └── api/                      # API routes
│       ├── newsletter/           # Newsletter subscription
│       └── mentorship/           # Mentorship requests
│
├── components/                   # React components
│   ├── common/                   # Shared (Logo, Newsletter)
│   ├── lesson/                   # Lesson components
│   │   ├── VideoPlayer.tsx
│   │   ├── QuizBlock.tsx
│   │   ├── CodeBlock.tsx
│   │   └── premium/              # Premium features
│   ├── course/                   # Course components
│   ├── search/                   # Search functionality
│   ├── navigation/               # Navigation
│   └── home/                     # Homepage sections
│
├── lib/                          # Business logic & utilities
│   ├── supabase/                 # Supabase clients
│   │   ├── client.ts             # Browser client
│   │   └── server.ts             # Server client
│   ├── db/                       # Database queries
│   │   ├── courses-queries.ts    # ⚠️ CRITICAL: Main queries
│   │   └── queries.ts            # Legacy queries
│   ├── utils/                    # Utilities
│   │   └── logger.ts             # Logging helper
│   ├── lesson-helpers.ts         # Lesson utilities
│   ├── search.ts                 # Search functionality
│   └── filters.ts                # Course filtering
│
├── types/                        # TypeScript type definitions
│   ├── database.ts               # ⚠️ CRITICAL: DB types
│   └── lesson-content.ts         # JSON content types
│
├── supabase/                     # Database schema
│   ├── schema.sql                # ⚠️ CRITICAL: Main schema
│   └── migrations/               # SQL migrations
│
├── scripts/                      # Migration & utility scripts
│   ├── migrate-courses.ts        # Course import
│   ├── migrate-lessons-to-json.ts
│   └── fix-slugs.ts
│
├── sql/                          # Additional SQL files
├── public/                       # Static assets
├── data/                         # Example JSON data
├── docs/                         # Documentation
└── hooks/                        # Custom React hooks
```

### Key Directories Explained

| Directory | Purpose | Examples |
|-----------|---------|----------|
| `app/` | Next.js App Router pages & routes | `app/cursos/[slug]/page.tsx` |
| `components/` | React components organized by feature | `components/lesson/VideoPlayer.tsx` |
| `lib/` | Business logic, DB queries, utilities | `lib/db/courses-queries.ts` |
| `types/` | TypeScript type definitions | `types/database.ts` |
| `supabase/` | Database schema & migrations | `supabase/schema.sql` |
| `scripts/` | Migration & data import scripts | `scripts/migrate-courses.ts` |

---

## Database Architecture

### Core Tables Hierarchy

```
courses (curso completo)
  ↓ 1:N
modules (secciones del curso)
  ↓ 1:N
lessons (lecciones individuales)
  ↓ 1:N
user_progress (progreso del usuario)
```

### Essential Tables

#### **courses** - Course information
```sql
id              UUID PRIMARY KEY
slug            TEXT UNIQUE          -- URL identifier
title           TEXT NOT NULL
description     TEXT
level           ENUM (beginner, intermediate, advanced)
category        ENUM (bitcoin, blockchain, defi, nfts, development, trading)
status          ENUM (draft, published, archived)
is_free         BOOLEAN
is_premium      BOOLEAN
instructor_id   UUID -> users(id)
total_modules   INTEGER
total_lessons   INTEGER
```

#### **modules** - Course sections
```sql
id              UUID PRIMARY KEY
course_id       UUID -> courses(id) CASCADE DELETE
title           TEXT NOT NULL
order_index     INTEGER             -- Ordering within course
total_lessons   INTEGER
UNIQUE (course_id, order_index)     -- Prevent duplicates
```

#### **lessons** - Individual lessons
```sql
id                  UUID PRIMARY KEY
module_id           UUID -> modules(id) CASCADE DELETE
title               TEXT NOT NULL
slug                TEXT NOT NULL
order_index         INTEGER
content             TEXT                -- Legacy HTML/Markdown
content_json        JSONB               -- Modern block-based format
video_url           TEXT
is_free_preview     BOOLEAN
UNIQUE (module_id, order_index)
```

#### **user_progress** - Progress tracking
```sql
id                  UUID PRIMARY KEY
user_id             UUID -> users(id)
lesson_id           UUID -> lessons(id)
is_completed        BOOLEAN
completed_at        TIMESTAMP
watch_time_seconds  INTEGER
UNIQUE (user_id, lesson_id)
```

### Extended Tables (Schema Ready, Implementation Pending)

- **course_enrollments** - User course enrollments
- **lesson_progress** - Detailed lesson progress
- **certificates** - Course completion certificates
- **user_achievements** - Gamification badges
- **user_activity** - Activity timeline
- **user_profiles** - Extended profiles with XP, streaks, level
- **bookmarks** - User lesson bookmarks
- **notes** - User notes with video timestamps

### Security (RLS)

- ✅ **All tables have RLS enabled**
- ✅ **21+ security policies configured**
- ✅ **Users can only access their own data**
- ✅ **Public courses/lessons visible to all**
- ✅ **Instructors can manage their own courses**

### Indexes & Performance

- **B-tree indexes**: Foreign keys, slugs
- **GIN indexes**: Full-text search (Spanish)
- **Composite indexes**: Common query patterns
- **Triggers**: Auto-update timestamps, calculate progress

---

## Critical Patterns & Conventions

### 🚨 MOST IMPORTANT: Data Structure Consistency

**CRITICAL PATTERN**: All queries **MUST** return `lesson.module.course` (SINGULAR)

```typescript
// ✅ CORRECT - Consistent structure
interface LessonWithRelations extends Lesson {
  module: Module & {
    course: Course  // SINGULAR - one course
  }
}

// ❌ WRONG - Supabase default (causes bugs)
interface LessonIncorrect extends Lesson {
  modules: {  // PLURAL - confusing!
    courses: Course[]
  }
}
```

**Why This Matters**:
- Every lesson belongs to exactly ONE module
- Every module belongs to exactly ONE course
- Using singular names prevents confusion
- All components expect this structure

**Enforced In**:
- `lib/db/courses-queries.ts` - All query functions
- `types/database.ts` - Type definitions
- Components throughout the app

### TypeScript Conventions

#### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| **Components** | PascalCase | `VideoPlayer.tsx` |
| **Utilities** | kebab-case | `lesson-helpers.ts` |
| **Routes** | Next.js convention | `[slug]/page.tsx` |
| **Variables/Functions** | camelCase | `getCourseBySlug` |
| **Types/Interfaces** | PascalCase | `LessonWithRelations` |
| **Constants** | UPPER_SNAKE_CASE | `MAX_RETRIES` |
| **Database Columns** | snake_case | `course_id` |

#### Type Safety Patterns

```typescript
// Always define props interfaces
interface VideoPlayerProps {
  videoUrl: string
  title: string
  onComplete?: () => void
}

export function VideoPlayer({ videoUrl, title, onComplete }: VideoPlayerProps) {
  // ...
}

// Use return type annotations for functions
export async function getCourseBySlug(
  slug: string
): Promise<CourseWithModules | null> {
  // ...
}

// Prefer type imports
import type { Course, Module, Lesson } from '@/types/database'
```

### React Patterns

#### Server Components (Default)

```typescript
// Server Component - Direct async/await
export default async function CoursePage({ params }: PageProps) {
  const course = await getCourseBySlug(params.slug) // Direct DB query

  if (!course) {
    notFound()
  }

  return <CourseView course={course} />
}
```

#### Client Components (When Needed)

```typescript
'use client'  // ⚠️ Must be at top of file

import { useState, useEffect } from 'react'

export function InteractiveQuiz({ questions }: QuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  // ... client-side logic
}
```

**Use Client Components For**:
- State management (`useState`, `useReducer`)
- Effects (`useEffect`, `useLayoutEffect`)
- Event handlers (onClick, onChange)
- Browser APIs (localStorage, window)
- Third-party libraries requiring window/document

**Use Server Components For**:
- Data fetching (direct DB queries)
- Static content
- SEO-critical content
- Reducing JavaScript bundle size

### File Organization

#### Import Order (Enforced by ESLint)

```typescript
// 1. External dependencies
import Link from 'next/link'
import { notFound } from 'next/navigation'

// 2. Internal absolute imports
import { getCourseBySlug } from '@/lib/db/courses-queries'
import { LessonList } from '@/components/course'

// 3. Relative imports
import { formatDuration } from './utils'

// 4. Type imports (separate)
import type { Metadata } from 'next'
import type { Course } from '@/types/database'

// 5. Styles (last)
import './styles.css'
```

#### Component Structure

```typescript
// 1. Imports
import { ... }

// 2. Types/Interfaces
interface ComponentProps {
  ...
}

// 3. Component Definition
export function Component({ props }: ComponentProps) {
  // ...
}

// 4. Helper Functions (if small and local)
function helperFunction() {
  // ...
}

// 5. Exports
export { Component }
```

### Error Handling Pattern

```typescript
export async function getCourseBySlug(slug: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('slug', slug)
    .single()

  // Handle specific errors
  if (error) {
    if (error.code === 'PGRST116') {
      console.log('⚠️ [getCourseBySlug] Course not found:', slug)
      return null  // Not found is expected
    }
    console.error('❌ [getCourseBySlug] Error:', error)
    logger.error('[getCourseBySlug] Error:', error)
    throw error  // Re-throw unexpected errors
  }

  return data
}
```

### Logging Strategy

```typescript
import { logger } from '@/lib/utils/logger'

// Development only - removed in production
console.log('🔍 [FunctionName] Action:', data)

// Always shown - for errors
logger.error('[FunctionName] Error:', error)
console.error('❌ [FunctionName] Error:', error)

// Always shown - for warnings
logger.warn('[FunctionName] Warning:', warning)

// Development only - with labels
logger.debug('[FunctionName] Debug:', data)
```

**Log Emoji Conventions**:
- 🔍 - Searching/Fetching
- ✅ - Success
- ❌ - Error
- ⚠️ - Warning
- ℹ️ - Info
- 🚀 - Starting/Initializing

### Comments & Documentation

```typescript
/**
 * JSDoc for exported functions
 *
 * Get a course by its slug with nested modules and lessons
 * @param slug - The course slug (e.g., "bitcoin-desde-cero")
 * @returns Course with modules and lessons, or null if not found
 */
export async function getCourseBySlug(slug: string): Promise<CourseWithModules | null> {
  // Inline comments explain WHY, not WHAT
  // Use console.log for debugging (removed in production)
  console.log('🔍 [getCourseBySlug] Searching for:', { slug })

  // ...
}
```

**Comment Guidelines**:
- ✅ Explain **WHY** (rationale, business logic)
- ❌ Don't explain **WHAT** (code is self-documenting)
- ✅ Document critical patterns (like lesson.module.course)
- ✅ Use TODOs with context: `// TODO: Implement auth check - needed for premium courses`

---

## Data Access Patterns

### Supabase Client Architecture

**Two-Client Pattern** (CRITICAL):

```typescript
// lib/supabase/client.ts - Browser/Client Components
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// lib/supabase/server.ts - Server Components & API Routes
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

**When to Use Which**:
- ✅ **Server Client**: Server Components, API routes, Server Actions
- ✅ **Browser Client**: Client Components, browser-side interactions
- ❌ **Never mix**: Don't use browser client in server components

### Core Query Functions

**Location**: `lib/db/courses-queries.ts`

```typescript
// Get all published courses with instructor info
getAllCourses(): Promise<CourseWithInstructor[]>

// Get single course with nested modules and lessons
getCourseBySlug(slug: string): Promise<CourseWithModules | null>

// Get lesson with CONSISTENT structure: lesson.module.course
getLessonBySlug(courseSlug: string, lessonSlug: string): Promise<LessonWithRelations | null>

// Get all lessons for a course
getAllLessonsForCourse(courseSlug: string): Promise<LessonWithRelations[]>

// Navigation helpers
getNextLesson(lessonId: string): Promise<Lesson | null>
getPreviousLesson(lessonId: string): Promise<Lesson | null>
```

### Query Strategy (CRITICAL)

**Why Separate Queries Instead of JOINs?**

```typescript
// ❌ BAD - Complex JOIN causes duplicate lessons across courses
const { data } = await supabase
  .from('lessons')
  .select(`
    *,
    modules (
      *,
      courses (*)
    )
  `)
  .eq('slug', lessonSlug)

// ✅ GOOD - Separate queries with explicit filtering
// Step 1: Get course
const { data: course } = await supabase
  .from('courses')
  .select('id, title, slug')
  .eq('slug', courseSlug)
  .single()

// Step 2: Get module IDs for this course
const { data: modules } = await supabase
  .from('modules')
  .select('id')
  .eq('course_id', course.id)

// Step 3: Get lesson ONLY from these modules
const { data: lesson } = await supabase
  .from('lessons')
  .select('*')
  .eq('slug', lessonSlug)
  .in('module_id', moduleIds)  // ⚠️ CRITICAL: Prevents cross-course duplicates
  .single()

// Step 4: Construct consistent structure
return {
  ...lesson,
  module: {
    ...module,
    course: course  // SINGULAR
  }
}
```

**Benefits**:
- ✅ Prevents duplicate lessons across courses
- ✅ Enforces consistent data structure
- ✅ Better control over query execution
- ✅ Easier to debug

### Parallel Data Fetching

```typescript
// ✅ GOOD - Parallel independent queries
export default async function Page() {
  const [courses, stats] = await Promise.all([
    getAllCourses(),
    getUserStats()
  ])

  return <Dashboard courses={courses} stats={stats} />
}

// ❌ BAD - Sequential queries (slower)
export default async function Page() {
  const courses = await getAllCourses()
  const stats = await getUserStats()  // Waits for courses

  return <Dashboard courses={courses} stats={stats} />
}
```

---

## Development Workflow

### Initial Setup

```bash
# 1. Clone repository
git clone <repo-url>
cd nodo360-plataforma

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# 4. Run development server
npm run dev
# Opens at http://localhost:3000
```

### Environment Variables

```bash
# .env (REQUIRED)

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**Getting Supabase Credentials**:
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to Settings → API
4. Copy `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
5. Copy `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### NPM Scripts

```bash
# Development
npm run dev              # Start dev server (localhost:3000)

# Production
npm run build            # Build for production
npm start                # Start production server

# Code Quality
npm run lint             # Run ESLint

# Database
npm run migrate-courses  # Import courses from data files
```

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes, commit frequently
git add .
git commit -m "feat: add user dashboard"

# Push to remote
git push -u origin feature/your-feature-name

# Create PR via GitHub
```

**Commit Message Conventions**:
- `feat:` - New feature
- `fix:` - Bug fix
- `refactor:` - Code refactoring
- `docs:` - Documentation
- `style:` - Formatting, styling
- `perf:` - Performance improvements
- `test:` - Adding tests
- `chore:` - Maintenance tasks

### Database Migrations

```bash
# Run migration script
npm run migrate-courses

# Or directly with tsx
tsx scripts/migrate-courses.ts
```

**Migration Scripts**:
- `scripts/migrate-courses.ts` - Import courses
- `scripts/migrate-lessons-to-json.ts` - Convert HTML to JSON
- `scripts/fix-slugs.ts` - Fix slug consistency
- `scripts/verify-migration.ts` - Verify data integrity

### Dynamic Rendering (CRITICAL)

**All course/lesson pages use dynamic rendering**:

```typescript
// app/cursos/[slug]/page.tsx
export const dynamic = 'force-dynamic'     // Generate on-demand
export const dynamicParams = true          // Allow non-pregenerated slugs

export default async function CoursePage({ params }: PageProps) {
  const resolvedParams = await params      // ⚠️ Next.js 16 requirement
  const course = await getCourseBySlug(resolvedParams.slug)
  // ...
}
```

**Why**:
- Supabase uses cookies for auth
- Dynamic content based on user state
- SEO still works (server-side rendered)

---

## Key Files & Locations

### Critical Files (Must Understand)

| File | Purpose | Why Critical |
|------|---------|--------------|
| `lib/db/courses-queries.ts` | **All database queries** | Single source of truth for data fetching |
| `types/database.ts` | **Type definitions** | Ensures type safety across app |
| `supabase/schema.sql` | **Database schema** | Defines data structure |
| `lib/supabase/server.ts` | **Server Supabase client** | Required for auth in Server Components |
| `app/cursos/[slug]/[lessonSlug]/page.tsx` | **Lesson viewer** | Core user experience |

### Configuration Files

| File | Purpose |
|------|---------|
| `next.config.ts` | Next.js configuration (images, headers, compiler) |
| `tsconfig.json` | TypeScript configuration |
| `tailwind.config.js` | Tailwind CSS configuration (in globals.css) |
| `eslint.config.mjs` | ESLint rules |
| `.env` | Environment variables (not in git) |
| `.env.example` | Environment template |

### Component Organization

```
components/
├── common/              # Shared across app
│   ├── Logo.tsx
│   └── NewsletterForm.tsx
│
├── lesson/              # Lesson-specific
│   ├── VideoPlayer.tsx
│   ├── QuizBlock.tsx
│   ├── CodeBlock.tsx
│   ├── CalloutBlock.tsx
│   └── premium/         # Premium features
│       ├── DiscussionSection.tsx
│       └── ResourcesSection.tsx
│
├── course/              # Course-specific
│   └── LessonList.tsx
│
└── home/                # Homepage sections
    ├── HeroSection.tsx
    ├── CourseGrid.tsx
    └── CommunitySection.tsx
```

### Route Structure

```
app/
├── page.tsx                              # Homepage (/)
├── cursos/
│   ├── page.tsx                          # Course listing (/cursos)
│   └── [slug]/
│       ├── page.tsx                      # Course detail (/cursos/bitcoin-desde-cero)
│       └── [lessonSlug]/
│           └── page.tsx                  # Lesson viewer (/cursos/bitcoin-desde-cero/leccion-1-1)
│
├── dashboard/page.tsx                    # User dashboard (future)
├── comunidad/page.tsx                    # Community
├── mentoria/page.tsx                     # Mentorship
│
└── api/
    ├── newsletter/route.ts               # POST /api/newsletter
    └── mentorship/route.ts               # POST /api/mentorship
```

---

## Common Tasks

### Adding a New Page

```bash
# 1. Create page file
# app/nueva-pagina/page.tsx

# 2. Use Server Component pattern
export default async function NuevaPaginaPage() {
  return (
    <div>
      <h1>Nueva Página</h1>
    </div>
  )
}

# 3. Add metadata
export const metadata: Metadata = {
  title: 'Nueva Página | Nodo360',
  description: 'Descripción de la página'
}
```

### Adding a New Component

```typescript
// components/nueva-seccion/NuevoComponente.tsx

interface NuevoComponenteProps {
  title: string
  description?: string
}

export function NuevoComponente({ title, description }: NuevoComponenteProps) {
  return (
    <div className="bg-white/5 rounded-lg p-6">
      <h2 className="text-2xl font-bold text-white">{title}</h2>
      {description && (
        <p className="text-white/70 mt-2">{description}</p>
      )}
    </div>
  )
}
```

### Adding a Database Query

```typescript
// lib/db/courses-queries.ts

/**
 * Get featured courses
 * @returns List of featured courses
 */
export async function getFeaturedCourses(): Promise<CourseWithInstructor[]> {
  console.log('🔍 [getFeaturedCourses] Fetching featured courses...')

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('courses')
    .select(`
      *,
      instructor:instructor_id (
        id,
        full_name,
        avatar_url
      )
    `)
    .eq('status', 'published')
    .eq('is_featured', true)  // Add this column to schema first
    .order('created_at', { ascending: false })
    .limit(6)

  if (error) {
    console.error('❌ [getFeaturedCourses] Error:', error)
    throw error
  }

  console.log(`✅ [getFeaturedCourses] Found ${data?.length || 0} courses`)
  return data || []
}
```

### Adding a New TypeScript Type

```typescript
// types/database.ts

/**
 * Course with enrolled users count
 */
export interface CourseWithStats extends Course {
  enrolled_users_count: number
  completion_rate: number
  average_rating: number | null
}

// Don't forget to export Insert/Update types if needed
export type InsertCourseStats = Omit<CourseWithStats, 'id' | 'created_at'>
```

### Adding an API Route

```typescript
// app/api/nueva-ruta/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types/database'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    if (!body.required_field) {
      return NextResponse.json(
        { error: 'Missing required field' } as ApiResponse,
        { status: 400 }
      )
    }

    // Process request
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('table_name')
      .insert(body)
      .select()
      .single()

    if (error) {
      console.error('❌ [API Nueva Ruta] Error:', error)
      return NextResponse.json(
        { error: 'Internal server error' } as ApiResponse,
        { status: 500 }
      )
    }

    return NextResponse.json(
      { data, message: 'Success' } as ApiResponse,
      { status: 201 }
    )
  } catch (error) {
    console.error('❌ [API Nueva Ruta] Exception:', error)
    return NextResponse.json(
      { error: 'Internal server error' } as ApiResponse,
      { status: 500 }
    )
  }
}
```

### Modifying Database Schema

```sql
-- supabase/migrations/XXXX_new_migration.sql

-- Add new column to existing table
ALTER TABLE courses
ADD COLUMN is_featured BOOLEAN DEFAULT false;

-- Create index for performance
CREATE INDEX idx_courses_is_featured
ON courses(is_featured)
WHERE status = 'published';

-- Add RLS policy if needed
CREATE POLICY "Featured courses are viewable by everyone"
ON courses FOR SELECT
USING (is_featured = true AND status = 'published');
```

**Run migration**:
```bash
# Option 1: Supabase CLI
supabase db push

# Option 2: Run in Supabase Dashboard SQL Editor
# Copy/paste migration SQL
```

---

## Testing & Quality

### Current State

- ❌ **No formal test suite yet**
- ✅ **TypeScript type checking** (runs on build)
- ✅ **ESLint** (code linting)
- ✅ **Manual testing** (development server)

### Recommended Testing Setup (Not Implemented)

```bash
# Unit Tests
npm install --save-dev jest @testing-library/react @testing-library/jest-dom

# E2E Tests
npm install --save-dev @playwright/test

# API Tests
npm install --save-dev supertest
```

### Type Checking

```bash
# Run TypeScript compiler without emitting files
npx tsc --noEmit

# Should show 0 errors before committing
```

### Linting

```bash
# Run ESLint
npm run lint

# Auto-fix issues
npm run lint -- --fix
```

### Manual Testing Checklist

Before deploying:

- [ ] Homepage loads correctly
- [ ] Course listing shows all courses
- [ ] Course detail page displays modules/lessons
- [ ] Lesson viewer plays video
- [ ] Lesson navigation (prev/next) works
- [ ] Search functionality works
- [ ] Newsletter signup works
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] No console errors in browser
- [ ] Build completes successfully (`npm run build`)

---

## Troubleshooting

### Common Issues

#### 1. "Supabase client error" / "Invalid Supabase URL"

**Cause**: Missing or invalid environment variables

**Fix**:
```bash
# Check .env file exists
ls -la .env

# Verify variables are set
cat .env

# Should see:
# NEXT_PUBLIC_SUPABASE_URL=https://...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# If missing, copy from .env.example
cp .env.example .env
# Then add your Supabase credentials
```

#### 2. "Course not found" / 404 errors on course pages

**Causes**:
- Course slug doesn't exist in database
- Course status is not 'published'
- Dynamic rendering not enabled

**Fix**:
```typescript
// Verify in Supabase dashboard:
// 1. courses table has data
// 2. course.status = 'published'
// 3. course.slug matches URL

// Ensure dynamic rendering is enabled
// app/cursos/[slug]/page.tsx
export const dynamic = 'force-dynamic'
export const dynamicParams = true
```

#### 3. Lesson shows wrong course data / Duplicate lessons

**Cause**: Query not filtering by course modules

**Fix**: Use queries from `lib/db/courses-queries.ts` which include module filtering:

```typescript
// ✅ CORRECT - Uses module filtering
const lesson = await getLessonBySlug(courseSlug, lessonSlug)

// ❌ WRONG - Might return lesson from different course
const { data } = await supabase
  .from('lessons')
  .select('*')
  .eq('slug', lessonSlug)
  .single()
```

#### 4. TypeScript errors: "Type X is not assignable to type Y"

**Cause**: Data structure doesn't match type definition

**Fix**:
```typescript
// Check that query returns expected structure
const lesson = await getLessonBySlug(courseSlug, lessonSlug)

// Should have: lesson.module.course (singular)
console.log(lesson?.module?.course?.title)

// NOT: lesson.modules.courses (plural)
```

#### 5. "cookies() can only be called in Server Components"

**Cause**: Using server Supabase client in Client Component

**Fix**:
```typescript
// ❌ WRONG - Server client in Client Component
'use client'
import { createClient } from '@/lib/supabase/server'

// ✅ CORRECT - Browser client in Client Component
'use client'
import { createClient } from '@/lib/supabase/client'

// ✅ CORRECT - Server client in Server Component
// (no 'use client' directive)
import { createClient } from '@/lib/supabase/server'
```

#### 6. Build fails with "Dynamic server usage"

**Cause**: Server Components using dynamic APIs during static build

**Fix**: Force dynamic rendering
```typescript
// Add to page.tsx
export const dynamic = 'force-dynamic'
```

#### 7. Slow page loads / Multiple database queries

**Causes**:
- Sequential queries instead of parallel
- N+1 query problem
- Missing indexes

**Fix**:
```typescript
// ✅ GOOD - Parallel queries
const [courses, instructors] = await Promise.all([
  getAllCourses(),
  getAllInstructors()
])

// ❌ BAD - Sequential
const courses = await getAllCourses()
const instructors = await getAllInstructors()  // Waits for courses
```

### Debug Logging

```typescript
// Enable verbose logging
import { logger } from '@/lib/utils/logger'

// In development, all logs show
console.log('🔍 Debug:', data)        // Development only
logger.error('[Context] Error:', err) // Always shown
logger.warn('[Context] Warning:', w)  // Always shown
logger.debug('[Context] Debug:', d)   // Development only

// Check logs in:
// - Browser console (client-side)
// - Terminal running `npm run dev` (server-side)
```

### Performance Issues

```typescript
// 1. Use React DevTools Profiler
// Install: React DevTools browser extension

// 2. Check database query performance
// In Supabase Dashboard → Database → Query Performance

// 3. Enable Next.js build analyzer
npm install --save-dev @next/bundle-analyzer

// next.config.ts
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true'
})

module.exports = withBundleAnalyzer({
  // ... existing config
})

// Run analysis
ANALYZE=true npm run build
```

---

## Additional Resources

### Documentation

- **Next.js 16 Docs**: https://nextjs.org/docs
- **Supabase Docs**: https://supabase.com/docs
- **Tailwind CSS v4**: https://tailwindcss.com/docs
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/

### Internal Documentation

- `SCHEMA_APPLICATION.md` - Database schema details
- `LOGO-IMPLEMENTATION-REPORT.md` - Logo implementation
- `docs/` - Additional documentation
- `supabase/schema.sql` - Full database schema with comments

### Recent Changes (Git History)

```bash
# View recent commits
git log --oneline --graph -20

# Recent focus areas:
# - Refactoring course data structure for consistency
# - Fixing lesson query JOINs to prevent duplicates
# - Implementing consistent lesson.module.course pattern
# - Performance optimizations (parallel queries, memoization)
```

### Support

For questions or issues:
1. Check this CLAUDE.md first
2. Review existing code in `lib/db/courses-queries.ts`
3. Check Supabase Dashboard for data/schema issues
4. Review Next.js documentation for framework questions

---

## Summary: Key Takeaways for AI Assistants

### 🚨 Critical Patterns to Follow

1. **Data Structure**: ALWAYS use `lesson.module.course` (singular)
2. **Client Selection**: Use correct Supabase client (server vs. browser)
3. **Query Strategy**: Use separate queries from `lib/db/courses-queries.ts`
4. **Dynamic Rendering**: Enable for course/lesson pages
5. **Type Safety**: Use types from `types/database.ts`

### 🎯 Best Practices

- ✅ Server Components by default (better performance)
- ✅ Parallel queries when possible
- ✅ Error handling with specific error codes
- ✅ Consistent logging with emojis
- ✅ JSDoc for exported functions
- ✅ TypeScript strict mode

### 🚫 Common Mistakes to Avoid

- ❌ Using Supabase JOINs without module filtering
- ❌ Mixing server/client Supabase clients
- ❌ Sequential queries (use Promise.all)
- ❌ Ignoring TypeScript errors
- ❌ Creating files without reading this guide first

### 📚 Essential Files to Know

1. `lib/db/courses-queries.ts` - All queries
2. `types/database.ts` - All types
3. `lib/supabase/server.ts` - Server client
4. `supabase/schema.sql` - Database schema
5. This file (`CLAUDE.md`) - Your guide

---

**Last Updated**: 2025-11-17
**Maintainer**: Development Team
**Version**: 1.0.0

For updates to this guide, please commit changes with: `docs: update CLAUDE.md with [description]`

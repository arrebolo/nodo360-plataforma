# CLAUDE.md - Nodo360 Platform Documentation

> **Last Updated**: 2025-11-17
> **Project**: nodo360-plataforma
> **Purpose**: Comprehensive guide for AI assistants working on the Nodo360 educational platform

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture & Tech Stack](#architecture--tech-stack)
3. [Codebase Structure](#codebase-structure)
4. [Database Schema & Types](#database-schema--types)
5. [Key Conventions & Patterns](#key-conventions--patterns)
6. [Development Workflow](#development-workflow)
7. [Critical Rules for AI Assistants](#critical-rules-for-ai-assistants)
8. [Common Tasks & Examples](#common-tasks--examples)
9. [Troubleshooting](#troubleshooting)

---

## Project Overview

**Nodo360** is a Next.js-based educational platform focused on Bitcoin, blockchain, and cryptocurrency education. The platform provides:

- **Course Management**: Structured courses with modules and lessons
- **Video Content**: Integration with video platforms for educational content
- **User Progress Tracking**: Track lesson completion and watch time
- **Premium Content**: Support for both free and premium courses/lessons
- **Community Features**: Newsletter, mentorship requests, and user engagement

### Key Features

- Server-side rendering with Next.js 16
- Type-safe database queries with Supabase
- Responsive UI with Tailwind CSS v4
- User authentication and authorization
- Progress tracking and bookmarking
- Search functionality
- SEO optimization with structured data

---

## Architecture & Tech Stack

### Frontend

- **Framework**: Next.js 16 (App Router)
- **React**: v19.2.0
- **TypeScript**: v5
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React

### Backend

- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **API**: Next.js API Routes
- **ORM**: Supabase Client (@supabase/supabase-js)

### Configuration

- **Path Aliases**: `@/*` maps to project root
- **TypeScript Config**: Strict mode enabled
- **ESLint**: Next.js recommended config

### Project Structure Pattern

```
Next.js App Router + Supabase
├── Server Components (default)
│   ├── Fetch data from Supabase
│   └── Render on server
└── Client Components ('use client')
    ├── Interactive UI
    └── Client-side state
```

---

## Codebase Structure

```
/nodo360-plataforma
├── app/                          # Next.js App Router pages
│   ├── page.tsx                  # Home page
│   ├── layout.tsx                # Root layout
│   ├── cursos/                   # Courses section
│   │   ├── page.tsx              # Course listing
│   │   └── [slug]/               # Dynamic course pages
│   │       ├── page.tsx          # Course detail page
│   │       └── [lessonSlug]/     # Dynamic lesson pages
│   │           └── page.tsx      # Lesson player page
│   ├── dashboard/                # User dashboard
│   ├── comunidad/                # Community page
│   ├── mentoria/                 # Mentorship page
│   ├── proyectos/                # Projects page
│   └── api/                      # API routes
│       ├── mentorship/           # Mentorship API
│       └── newsletter/           # Newsletter API
│
├── components/                   # React components
│   ├── common/                   # Shared components
│   ├── navigation/               # Navigation components
│   ├── course/                   # Course-related components
│   ├── lesson/                   # Lesson-related components
│   │   └── premium/              # Premium lesson components
│   ├── home/                     # Home page components
│   └── search/                   # Search components
│
├── lib/                          # Utility libraries
│   ├── supabase/                 # Supabase clients and helpers
│   │   ├── client.ts             # Client-side Supabase client
│   │   ├── server.ts             # Server-side Supabase client
│   │   ├── types.ts              # Supabase generated types
│   │   ├── helpers.ts            # Supabase helper functions
│   │   └── index.ts              # Exports
│   ├── db/                       # Database queries
│   │   ├── courses-queries.ts    # Course/lesson queries
│   │   └── queries.ts            # Other queries
│   ├── utils/                    # Utility functions
│   │   └── logger.ts             # Logging utility
│   ├── analytics.ts              # Analytics tracking
│   ├── brand-config.ts           # Brand configuration
│   ├── community-config.ts       # Community settings
│   ├── filter-utils.ts           # Course filtering
│   ├── lesson-helpers.ts         # Lesson utility functions
│   ├── progress-manager.ts       # Progress tracking
│   ├── search-utils.ts           # Search utilities
│   └── structured-data.ts        # SEO structured data
│
├── types/                        # TypeScript type definitions
│   ├── database.ts               # Database types (PRIMARY)
│   └── lesson-content.ts         # Lesson content types
│
├── supabase/                     # Supabase configuration
│   └── schema.sql                # Database schema (504 lines)
│
├── hooks/                        # React hooks
│
├── data/                         # Static data files
│
├── backup/                       # Backup files
│   └── cursos-old/               # Legacy course code
│
├── src/                          # Additional source code
│   ├── core/                     # Core functionality
│   └── lib/                      # Additional libraries
│       └── nodo360-resources/    # Resource management
│
├── scripts/                      # Build and migration scripts
│   └── migrate-courses.ts        # Course migration script
│
├── .claude/                      # Claude Code configuration
│
├── next.config.ts                # Next.js configuration
├── tsconfig.json                 # TypeScript configuration
├── tailwind.config.js            # Tailwind CSS configuration
├── package.json                  # Dependencies and scripts
│
└── Documentation
    ├── CLAUDE.md                 # This file
    ├── README.md                 # Project README
    ├── SCHEMA_APPLICATION.md     # Schema setup guide
    └── LOGO-IMPLEMENTATION-REPORT.md
```

---

## Database Schema & Types

### Database Tables

The platform uses **7 core tables**:

1. **`users`** - User profiles (extends auth.users)
2. **`courses`** - Course information
3. **`modules`** - Course modules/sections
4. **`lessons`** - Individual lessons
5. **`user_progress`** - Lesson completion tracking
6. **`bookmarks`** - User bookmarks
7. **`notes`** - User notes with timestamps

### Key Relationships

```
users (1) ──┬── (many) user_progress
            ├── (many) bookmarks
            └── (many) notes

courses (1) ──┬── (many) modules
              └── (1) instructor (users)

modules (1) ─── (many) lessons

lessons (1) ──┬── (many) user_progress
              ├── (many) bookmarks
              └── (many) notes
```

### Type System

All database types are defined in **`types/database.ts`**. This is the **single source of truth** for types.

#### Core Types

```typescript
// Basic entity types
type Course
type Module
type Lesson
type User
type UserProgress
type Bookmark
type Note

// Enums
type UserRole = 'student' | 'instructor' | 'admin'
type CourseLevel = 'beginner' | 'intermediate' | 'advanced'
type CourseStatus = 'draft' | 'published' | 'archived'
type CourseCategory = 'bitcoin' | 'blockchain' | 'defi' | 'nfts' | 'development' | 'trading' | 'other'
```

#### Joined Types

```typescript
// With relationships
type CourseWithInstructor       // Course + instructor details
type CourseWithModules          // Course + modules + lessons (full tree)
type LessonWithRelations        // Lesson + module + course (CRITICAL - see below)
type LessonWithDetails          // Lesson + partial module/course
```

#### Insert/Update Types

```typescript
type InsertCourse   // Omits: id, created_at, updated_at, published_at
type InsertModule   // Omits: id, created_at, updated_at
type InsertLesson   // Omits: id, created_at, updated_at
type UpdateCourse   // Partial<Course> & { id: string }
// etc.
```

### CRITICAL: Data Structure Convention

**ALWAYS use singular relationship names:**

```typescript
// ✅ CORRECT - Use this structure ALWAYS
lesson.module.course  // Singular

// ❌ WRONG - Never use this
lesson.modules.courses  // Plural
```

This convention is enforced in `lib/db/courses-queries.ts` and must be maintained across the entire codebase.

---

## Key Conventions & Patterns

### 1. Data Fetching Pattern

**Server Components (Preferred)**

```typescript
// app/cursos/[slug]/page.tsx
import { getCourseBySlug } from '@/lib/db/courses-queries'

export default async function CoursePage({ params }: { params: { slug: string } }) {
  const course = await getCourseBySlug(params.slug)

  if (!course) {
    notFound()
  }

  return <CourseDetail course={course} />
}
```

**Client Components (When Needed)**

```typescript
'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export function ClientComponent() {
  const [data, setData] = useState(null)
  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase.from('courses').select('*')
      setData(data)
    }
    fetchData()
  }, [])

  return <div>{/* ... */}</div>
}
```

### 2. Database Query Pattern

**Location**: All queries in `lib/db/courses-queries.ts`

**Pattern**: Separate queries to ensure data structure consistency

```typescript
// GOOD: Separate queries, manual joins
export async function getLessonBySlug(
  courseSlug: string,
  lessonSlug: string
): Promise<LessonWithRelations | null> {
  // STEP 1: Get course
  const { data: course } = await supabase
    .from('courses')
    .select('id, title, slug, description, is_premium')
    .eq('slug', courseSlug)
    .single()

  // STEP 2: Get modules
  const { data: modules } = await supabase
    .from('modules')
    .select('*')
    .eq('course_id', course.id)

  // STEP 3: Get lesson (filtered by module IDs)
  const moduleIds = modules.map(m => m.id)
  const { data: lesson } = await supabase
    .from('lessons')
    .select('*')
    .eq('slug', lessonSlug)
    .in('module_id', moduleIds)
    .single()

  // STEP 4: Get full module
  const { data: module } = await supabase
    .from('modules')
    .select('*')
    .eq('id', lesson.module_id)
    .single()

  // STEP 5: Return with consistent structure
  return {
    ...lesson,
    module: {
      ...module,
      course: course  // lesson.module.course (singular)
    }
  }
}
```

**Why this pattern?**
- Ensures `lesson.module.course` (singular) structure
- Filters lessons by course modules to prevent cross-course duplicates
- Provides full control over returned data shape

### 3. Logging Convention

```typescript
import { logger } from '@/lib/utils/logger'

console.log('🔍 [functionName] Starting operation:', { param1, param2 })
console.log('✅ [functionName] Success:', result)
console.error('❌ [functionName] Error:', error)
logger.error('[functionName] Error:', error)
```

**Emoji Convention**:
- 🔍 - Starting operation
- ✅ - Success
- ❌ - Error
- ℹ️ - Info
- ⚠️ - Warning

### 4. File Naming Convention

- **Pages**: `page.tsx` (Next.js convention)
- **Layouts**: `layout.tsx` (Next.js convention)
- **Components**: `ComponentName.tsx` (PascalCase)
- **Utilities**: `kebab-case.ts`
- **Types**: `database.ts`, `lesson-content.ts`
- **Queries**: `*-queries.ts`

### 5. Import Alias Pattern

Always use the `@/` alias for imports:

```typescript
// ✅ CORRECT
import { Course } from '@/types/database'
import { getCourseBySlug } from '@/lib/db/courses-queries'
import { createClient } from '@/lib/supabase/server'

// ❌ WRONG
import { Course } from '../../../types/database'
```

### 6. Component Structure Pattern

```typescript
// 1. Imports
import { type ComponentProps } from 'react'
import { type Course } from '@/types/database'

// 2. Type definitions
interface CourseCardProps {
  course: Course
  onClick?: () => void
}

// 3. Component
export function CourseCard({ course, onClick }: CourseCardProps) {
  return (
    <div>
      {/* Component JSX */}
    </div>
  )
}

// 4. Exports (if needed)
export type { CourseCardProps }
```

### 7. Error Handling Pattern

```typescript
// In Server Components
async function getData() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('courses')
    .select('*')

  if (error) {
    console.error('❌ [getData] Error:', error)
    logger.error('[getData] Error:', error)
    throw error  // Let Next.js error boundary handle it
  }

  return data
}

// In API Routes
export async function GET(request: Request) {
  try {
    const data = await getData()
    return Response.json({ data })
  } catch (error) {
    console.error('❌ [API] Error:', error)
    return Response.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    )
  }
}
```

---

## Development Workflow

### Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Run migration script
npm run migrate-courses
```

### Environment Setup

Required environment variables in `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Git Workflow

**Branch Naming**:
- Feature branches: `claude/claude-md-{session-id}`
- All development on feature branches
- Never push directly to main

**Commit Convention**:
```bash
# Examples
feat: add user dashboard
fix: resolve lesson navigation bug
refactor: simplify course query structure
docs: update CLAUDE.md
```

### Database Changes

1. **Schema changes**: Update `supabase/schema.sql`
2. **Type changes**: Update `types/database.ts`
3. **Query changes**: Update `lib/db/courses-queries.ts`
4. **Test**: Verify data structure consistency

---

## Critical Rules for AI Assistants

### ⚠️ ALWAYS

1. **Use singular relationship names**: `lesson.module.course` (never plural)
2. **Read files before editing**: Always use Read tool before Edit/Write
3. **Follow type definitions**: Use types from `types/database.ts`
4. **Use path aliases**: Import with `@/` prefix
5. **Log operations**: Use emoji logging convention
6. **Check data structure**: Verify `lesson.module.course` structure in queries
7. **Preserve TypeScript strict mode**: Maintain type safety
8. **Use server components**: Prefer server components for data fetching
9. **Handle errors properly**: Log and throw/return appropriate errors
10. **Test data flow**: Verify end-to-end data structure consistency

### ⚠️ NEVER

1. **Never use plural relationships**: `lessons.modules.courses` is WRONG
2. **Never skip file reads**: Always read before editing
3. **Never ignore types**: All database operations must be typed
4. **Never commit without testing**: Verify changes don't break structure
5. **Never mix data structures**: Maintain consistency across codebase
6. **Never use relative imports**: Use `@/` alias instead
7. **Never disable TypeScript checks**: Keep strict mode enabled
8. **Never bypass Supabase clients**: Use provided client utilities
9. **Never hardcode data**: Use database queries or configuration files
10. **Never skip logging**: Always log operations for debugging

### 🎯 Data Structure Rule (MOST CRITICAL)

```typescript
// ✅ ALWAYS use this structure
interface LessonWithRelations {
  ...lessonFields,
  module: {
    ...moduleFields,
    course: {
      ...courseFields
    }
  }
}

// Access pattern: lesson.module.course
const courseTitle = lesson.module.course.title  // ✅ CORRECT

// ❌ NEVER use this
const courseTitle = lesson.modules.courses.title  // ❌ WRONG - Will break everything
```

**Why this matters:**
- Recent refactoring established this as the standard
- All components expect this structure
- Mixing structures causes runtime errors
- Queries are built to ensure this structure

### 🔍 Before Making Changes

**Checklist**:
- [ ] Read the file you're about to modify
- [ ] Check `types/database.ts` for correct types
- [ ] Review `lib/db/courses-queries.ts` for query patterns
- [ ] Verify data structure matches `lesson.module.course` pattern
- [ ] Test that changes don't break existing components
- [ ] Add appropriate logging with emojis
- [ ] Update types if schema changes

---

## Common Tasks & Examples

### Task 1: Create a New Database Query

**File**: `lib/db/courses-queries.ts`

```typescript
/**
 * Get featured courses
 * @returns List of featured courses with instructor info
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
    .eq('is_featured', true)  // Assuming this field exists
    .order('created_at', { ascending: false })
    .limit(6)

  if (error) {
    console.error('❌ [getFeaturedCourses] Error:', error)
    logger.error('[getFeaturedCourses] Error:', error)
    throw error
  }

  console.log(`✅ [getFeaturedCourses] ${data?.length || 0} courses found`)
  return data || []
}
```

### Task 2: Create a New Page

**File**: `app/featured/page.tsx`

```typescript
import { getFeaturedCourses } from '@/lib/db/courses-queries'
import { CourseCard } from '@/components/course/CourseCard'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Featured Courses - Nodo360',
  description: 'Our most popular Bitcoin and blockchain courses',
}

export default async function FeaturedPage() {
  const courses = await getFeaturedCourses()

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Featured Courses</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    </div>
  )
}
```

### Task 3: Add a New Type

**File**: `types/database.ts`

```typescript
// Add to the file
export interface Review {
  id: string
  user_id: string
  course_id: string
  rating: number
  comment: string | null
  created_at: string
  updated_at: string
}

export interface ReviewWithUser extends Review {
  user: Pick<User, 'id' | 'full_name' | 'avatar_url'>
}

export type InsertReview = Omit<Review, 'id' | 'created_at' | 'updated_at'>
```

**File**: `supabase/schema.sql`

```sql
-- Add to schema.sql
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  UNIQUE(user_id, course_id)
);

CREATE INDEX idx_reviews_course_id ON public.reviews(course_id);
CREATE INDEX idx_reviews_user_id ON public.reviews(user_id);
```

### Task 4: Create an API Endpoint

**File**: `app/api/reviews/route.ts`

```typescript
import { createClient } from '@/lib/supabase/server'
import { type InsertReview, type ApiResponse } from '@/types/database'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return Response.json(
        { error: 'Unauthorized' } as ApiResponse,
        { status: 401 }
      )
    }

    // Parse request
    const body: InsertReview = await request.json()

    // Insert review
    const { data, error } = await supabase
      .from('reviews')
      .insert({
        ...body,
        user_id: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('❌ [POST /api/reviews] Error:', error)
      return Response.json(
        { error: 'Failed to create review' } as ApiResponse,
        { status: 500 }
      )
    }

    console.log('✅ [POST /api/reviews] Review created:', data.id)
    return Response.json({ data } as ApiResponse)

  } catch (error) {
    console.error('❌ [POST /api/reviews] Unexpected error:', error)
    return Response.json(
      { error: 'Internal server error' } as ApiResponse,
      { status: 500 }
    )
  }
}
```

### Task 5: Update a Component to Use New Query

**File**: `components/course/CourseReviews.tsx`

```typescript
import { createClient } from '@/lib/supabase/server'
import type { ReviewWithUser } from '@/types/database'

interface CourseReviewsProps {
  courseId: string
}

export async function CourseReviews({ courseId }: CourseReviewsProps) {
  const supabase = await createClient()

  const { data: reviews, error } = await supabase
    .from('reviews')
    .select(`
      *,
      user:user_id (
        id,
        full_name,
        avatar_url
      )
    `)
    .eq('course_id', courseId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('❌ [CourseReviews] Error:', error)
    return <div>Failed to load reviews</div>
  }

  const typedReviews = reviews as ReviewWithUser[]

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Reviews</h2>

      {typedReviews.map((review) => (
        <div key={review.id} className="border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold">{review.user.full_name}</span>
            <span className="text-yellow-500">{'★'.repeat(review.rating)}</span>
          </div>
          <p className="text-gray-700">{review.comment}</p>
        </div>
      ))}
    </div>
  )
}
```

---

## Troubleshooting

### Problem: Wrong data structure returned

**Symptom**: Getting `lesson.modules.courses` instead of `lesson.module.course`

**Solution**:
1. Check the query in `lib/db/courses-queries.ts`
2. Verify using separate queries pattern (not nested Supabase joins)
3. Manually construct the return object with correct structure
4. Example:
   ```typescript
   return {
     ...lesson,
     module: {           // singular
       ...module,
       course: course    // singular
     }
   }
   ```

### Problem: TypeScript errors on database queries

**Solution**:
1. Check types in `types/database.ts`
2. Verify Supabase query matches expected type
3. Use type assertion if necessary: `data as CourseWithModules`
4. Make sure to import types from `@/types/database`

### Problem: Lessons from wrong course appearing

**Solution**:
1. In `getLessonBySlug`, filter lessons by course's module IDs
2. Never query lessons directly by slug without course context
3. Use the pattern in `courses-queries.ts`:
   ```typescript
   const moduleIds = modules.map(m => m.id)
   const { data: lesson } = await supabase
     .from('lessons')
     .eq('slug', lessonSlug)
     .in('module_id', moduleIds)  // Filter by course modules
   ```

### Problem: Supabase client errors

**Solution**:
1. Server components: `import { createClient } from '@/lib/supabase/server'`
2. Client components: `import { createClient } from '@/lib/supabase/client'`
3. Check environment variables in `.env.local`
4. Verify Supabase project is active

### Problem: Build errors

**Solution**:
1. Run `npm run build` to see detailed errors
2. Check for:
   - Missing return types on async functions
   - Type mismatches in props
   - Unused variables (remove or prefix with `_`)
   - Missing await on async calls
3. Fix TypeScript errors before committing

### Problem: Missing data in queries

**Solution**:
1. Check console logs for query steps
2. Verify database has the expected data
3. Check RLS (Row Level Security) policies in Supabase
4. Verify user is authenticated for protected routes
5. Check query filters (eq, in, etc.)

---

## Additional Resources

### Documentation Files

- **`README.md`**: Project overview and setup instructions
- **`SCHEMA_APPLICATION.md`**: Detailed guide for applying database schema
- **`LOGO-IMPLEMENTATION-REPORT.md`**: Logo implementation details
- **`supabase/schema.sql`**: Complete database schema (504 lines)

### Key Files to Reference

- **`types/database.ts`**: All type definitions (550 lines)
- **`lib/db/courses-queries.ts`**: Query patterns (478 lines)
- **`lib/supabase/server.ts`**: Server Supabase client
- **`lib/supabase/client.ts`**: Client Supabase client
- **`next.config.ts`**: Next.js configuration
- **`tsconfig.json`**: TypeScript configuration

### External Documentation

- **Next.js**: https://nextjs.org/docs
- **Supabase**: https://supabase.com/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **TypeScript**: https://www.typescriptlang.org/docs

---

## Quick Reference

### Most Used Commands

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run lint             # Run ESLint
```

### Most Used Imports

```typescript
// Types
import type { Course, CourseWithModules, LessonWithRelations } from '@/types/database'

// Queries
import { getCourseBySlug, getLessonBySlug, getAllCourses } from '@/lib/db/courses-queries'

// Supabase
import { createClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/client'

// Next.js
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
```

### Most Important Types

```typescript
LessonWithRelations  // lesson.module.course structure
CourseWithModules    // Full course tree
CourseWithInstructor // Course with instructor info
```

---

## Final Notes

This is a living document. Update it whenever:
- Database schema changes
- New patterns are established
- New conventions are adopted
- Critical bugs are discovered and fixed
- New features require new workflows

**Remember**: The goal is to maintain consistency, type safety, and the `lesson.module.course` data structure across the entire codebase.

When in doubt:
1. Check this file
2. Review `types/database.ts`
3. Follow patterns in `lib/db/courses-queries.ts`
4. Test thoroughly before committing

---

**Happy coding!** 🚀

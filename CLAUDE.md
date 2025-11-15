# CLAUDE.md - Nodo360 Platform

> Comprehensive guide for AI assistants working on the Nodo360 educational platform

**Last Updated:** November 15, 2025
**Project:** Nodo360 - Bitcoin, Blockchain & Web3 Educational Platform
**Status:** Active Development (MVP Ready)

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Codebase Structure](#codebase-structure)
4. [Development Workflows](#development-workflows)
5. [Key Patterns & Conventions](#key-patterns--conventions)
6. [Database & Backend](#database--backend)
7. [Component Architecture](#component-architecture)
8. [Common Tasks](#common-tasks)
9. [AI Assistant Guidelines](#ai-assistant-guidelines)
10. [Important Files Reference](#important-files-reference)

---

## 🎯 Project Overview

### What is Nodo360?

Nodo360 is a professional educational platform for learning Bitcoin, Blockchain, and Web3 technologies in Spanish. The platform provides:

- **Course Catalog** - Browse and filter courses by level, category, and type
- **Interactive Lessons** - Video-based lessons with rich content and progress tracking
- **User Dashboard** - Track progress, bookmarks, and achievements
- **Community Features** - Discord/Telegram integration for community engagement
- **Lead Capture** - Newsletter subscriptions and mentorship requests

### Project Goals

- Provide high-quality educational content on Bitcoin/Blockchain
- Track student progress and engagement
- Offer both free and premium courses
- Build an active community around Web3 education
- Scale to thousands of students

### Current Status

- ✅ MVP Ready - Core features implemented
- ✅ Database schema deployed to Supabase
- ✅ Course and lesson system functional
- 🚧 Dashboard system (partial)
- ⏳ Authentication system (planned)
- ⏳ Payment integration (planned)

---

## 🛠 Tech Stack

### Frontend

- **Framework:** Next.js 16.0.1 (App Router)
- **React:** 19.2.0
- **TypeScript:** 5.x (Strict mode enabled)
- **Styling:** Tailwind CSS 4.0
- **Icons:** Lucide React
- **Language:** Spanish (es)

### Backend & Database

- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (planned)
- **Storage:** Supabase Storage (for course assets)
- **ORM:** Supabase Client with TypeScript

### Tools & Scripts

- **Package Manager:** npm
- **Linting:** ESLint with Next.js config
- **Scripts Runner:** tsx (for TypeScript scripts)
- **Content Migration:** Custom scripts in `/scripts`

### Deployment

- **Hosting:** Vercel (recommended for Next.js)
- **Database:** Supabase Cloud
- **CDN:** Vercel Edge Network

---

## 📁 Codebase Structure

```
nodo360-plataforma/
│
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (metadata, fonts)
│   ├── page.tsx                  # Homepage
│   ├── globals.css               # Tailwind + custom CSS
│   │
│   ├── cursos/                   # Courses section
│   │   ├── page.tsx              # Courses listing page
│   │   ├── [slug]/               # Dynamic course routes
│   │   │   ├── page.tsx          # Course detail page
│   │   │   └── [lessonSlug]/     # Lesson pages
│   │   │       └── page.tsx
│   │
│   ├── dashboard/                # User dashboard
│   ├── comunidad/                # Community page
│   ├── mentoria/                 # Mentorship requests
│   ├── proyectos/                # Projects showcase
│   ├── sobre-nosotros/           # About page
│   │
│   ├── api/                      # API routes
│   │   ├── newsletter/           # Newsletter subscriptions
│   │   └── mentorship/           # Mentorship requests
│   │
│   ├── sitemap.ts                # Dynamic sitemap generation
│   └── robots.ts                 # Robots.txt generation
│
├── components/                   # React components
│   ├── common/                   # Shared components
│   │   ├── Logo.tsx
│   │   ├── NewsletterForm.tsx
│   │   └── index.ts
│   │
│   ├── course/                   # Course-related components
│   ├── lesson/                   # Lesson components
│   │   └── premium/              # Premium lesson components
│   ├── home/                     # Homepage components
│   ├── navigation/               # Navigation components
│   └── search/                   # Search components
│
├── lib/                          # Utility libraries
│   ├── supabase/                 # Supabase client & config
│   │   ├── client.ts             # Browser client
│   │   ├── server.ts             # Server client (SSR)
│   │   ├── types.ts              # Supabase schema types
│   │   ├── helpers.ts            # Helper functions
│   │   └── index.ts
│   │
│   ├── db/                       # Database queries
│   │   └── queries.ts            # Reusable query functions
│   │
│   ├── brand-config.ts           # Brand assets & colors
│   ├── community-config.ts       # Community links
│   ├── analytics.ts              # Analytics helpers
│   ├── structured-data.ts        # SEO structured data
│   ├── filter-utils.ts           # Course filtering
│   ├── search-utils.ts           # Search functionality
│   ├── lesson-helpers.ts         # Lesson content helpers
│   └── progress-manager.ts       # Progress tracking
│
├── types/                        # TypeScript type definitions
│   ├── database.ts               # All DB table types
│   └── lesson-content.ts         # Lesson content structure
│
├── hooks/                        # Custom React hooks
│
├── scripts/                      # Migration & utility scripts
│   ├── migrate-courses.ts        # Course migration script
│   ├── migrate-lessons-to-json.ts
│   ├── create-lesson.ts
│   └── [other migration scripts]
│
├── public/                       # Static assets
│   ├── imagenes/                 # Brand images
│   └── assets/                   # Course assets
│
├── sql/                          # SQL schema files
│   └── schema.sql                # Database schema
│
├── docs/                         # Project documentation
│   ├── DEPLOYMENT-GUIDE.md
│   ├── DASHBOARD-SYSTEM.md
│   ├── LESSON-SYSTEM.md
│   ├── LEADS-SYSTEM.md
│   └── [other guides]
│
├── supabase/                     # Supabase configuration
│
├── templates/                    # Content templates
│
├── next.config.ts                # Next.js configuration
├── tsconfig.json                 # TypeScript configuration
├── tailwind.config.js            # Tailwind configuration
├── eslint.config.mjs             # ESLint configuration
└── package.json                  # Dependencies & scripts
```

### Directory Purposes

| Directory | Purpose | Notes |
|-----------|---------|-------|
| `/app` | Next.js pages and routes | Uses App Router (not Pages Router) |
| `/components` | Reusable React components | Organized by feature |
| `/lib` | Business logic & utilities | Keep pure functions here |
| `/types` | TypeScript type definitions | Single source of truth for types |
| `/scripts` | Data migration scripts | Run with `tsx` command |
| `/docs` | Project documentation | Comprehensive guides for features |
| `/public` | Static files | Directly accessible via URL |

---

## 🔄 Development Workflows

### Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev
# Server runs on http://localhost:3000

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

### Environment Variables

Required variables in `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Optional
NEXT_PUBLIC_GA_ID=your_google_analytics_id
```

### Running Migration Scripts

```bash
# Migrate courses to database
npm run migrate-courses

# Or run any TypeScript script directly
npx tsx scripts/[script-name].ts
```

### Common Development Tasks

1. **Adding a new page:**
   - Create file in `/app/[route]/page.tsx`
   - Export default async function
   - Add metadata export for SEO

2. **Creating a component:**
   - Add to appropriate `/components/[category]` folder
   - Export from `index.ts` if shared
   - Use TypeScript for props

3. **Adding database query:**
   - Add function to `/lib/db/queries.ts`
   - Use Supabase client from `/lib/supabase/server.ts`
   - Add proper TypeScript types

4. **Updating database schema:**
   - Modify `/sql/schema.sql`
   - Apply changes in Supabase dashboard
   - Update `/types/database.ts` to match

---

## 🎨 Key Patterns & Conventions

### Code Style

#### TypeScript

- **Strict mode:** Always enabled
- **No implicit any:** All types must be explicit
- **Naming conventions:**
  - `PascalCase` for components, types, interfaces
  - `camelCase` for functions, variables
  - `UPPER_SNAKE_CASE` for constants
  - `kebab-case` for file names

#### React Components

```typescript
// Server Component (default in App Router)
export default async function CoursePage({ params }: { params: { slug: string } }) {
  const course = await getCourseBySlug(params.slug)

  return (
    <div>
      {/* ... */}
    </div>
  )
}

// Client Component (when needed)
'use client'

import { useState } from 'react'

export default function InteractiveComponent() {
  const [state, setState] = useState()
  // ...
}
```

#### Async/Await Pattern

```typescript
// Good: Use async/await
const course = await getCourseBySlug(slug)

// Avoid: Promise chains
getCourseBySlug(slug).then(course => {
  // ...
})
```

### File Naming

| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase.tsx | `NewsletterForm.tsx` |
| Pages | lowercase, page.tsx | `app/cursos/page.tsx` |
| Utilities | kebab-case.ts | `brand-config.ts` |
| Types | kebab-case.ts | `lesson-content.ts` |
| Scripts | kebab-case.ts | `migrate-courses.ts` |

### Import Organization

```typescript
// 1. External imports
import { useState } from 'react'
import Link from 'next/link'

// 2. Internal imports (lib, types)
import { getCourseBySlug } from '@/lib/db/queries'
import type { Course } from '@/types/database'

// 3. Components
import { Logo } from '@/components/common'

// 4. Styles (if any)
import './styles.css'
```

### Component Structure

```typescript
// 1. Imports
import type { ComponentProps } from './types'

// 2. Type definitions
interface Props {
  title: string
  onClick?: () => void
}

// 3. Component
export default function Component({ title, onClick }: Props) {
  // 4. Hooks
  const [state, setState] = useState()

  // 5. Event handlers
  const handleClick = () => {
    // ...
  }

  // 6. Render
  return (
    <div>
      {/* ... */}
    </div>
  )
}

// 7. Sub-components (if small and not reusable)
function SubComponent() {
  return <div />
}
```

### Dynamic Routes in Next.js

```typescript
// app/cursos/[slug]/page.tsx

// 1. Mark as dynamic if needed
export const dynamic = 'force-dynamic'

// 2. Generate metadata
export async function generateMetadata({ params }: Props) {
  const resolvedParams = await params
  // ...
}

// 3. Main component
export default async function Page({ params }: Props) {
  const resolvedParams = await params
  // ...
}

// 4. Static params generation (commented out for dynamic pages)
// export async function generateStaticParams() {
//   const courses = await getAllCourses()
//   return courses.map(c => ({ slug: c.slug }))
// }
```

---

## 🗄 Database & Backend

### Database Schema

The platform uses Supabase (PostgreSQL) with the following main tables:

#### Core Tables

**users** - User profiles
- `id` (uuid, PK)
- `email` (text)
- `full_name` (text)
- `avatar_url` (text)
- `role` (enum: student, instructor, admin)
- Timestamps

**courses** - Course information
- `id` (uuid, PK)
- `slug` (text, unique)
- `title`, `description`, `long_description`
- `thumbnail_url`, `banner_url`
- `level` (enum: beginner, intermediate, advanced)
- `category` (enum: bitcoin, blockchain, defi, nfts, development, trading, other)
- `status` (enum: draft, published, archived)
- `is_free`, `is_premium` (boolean)
- `price` (numeric)
- `instructor_id` (FK → users)
- `total_modules`, `total_lessons`, `total_duration_minutes`
- Metadata: `meta_title`, `meta_description`, `tags`
- Timestamps

**modules** - Course sections
- `id` (uuid, PK)
- `course_id` (FK → courses)
- `title`, `description`
- `slug` (text)
- `order_index` (integer)
- `total_lessons`, `total_duration_minutes`
- Timestamps

**lessons** - Individual lessons
- `id` (uuid, PK)
- `module_id` (FK → modules)
- `title`, `description`
- `slug` (text)
- `order_index` (integer)
- `content` (text) - HTML content
- `content_json` (jsonb) - Structured content
- `video_url` (text)
- `video_duration_minutes` (integer)
- `attachments` (jsonb array)
- `is_free_preview` (boolean)
- Timestamps

#### Progress & Engagement Tables

**user_progress** - Lesson completion tracking
- `id` (uuid, PK)
- `user_id` (FK → users)
- `lesson_id` (FK → lessons)
- `is_completed` (boolean)
- `completed_at` (timestamp)
- `watch_time_seconds` (integer)
- Timestamps

**bookmarks** - Saved lessons
- `id` (uuid, PK)
- `user_id` (FK → users)
- `lesson_id` (FK → lessons)
- `note` (text)
- `created_at` (timestamp)

**notes** - User notes on lessons
- `id` (uuid, PK)
- `user_id` (FK → users)
- `lesson_id` (FK → lessons)
- `content` (text)
- `video_timestamp_seconds` (integer)
- Timestamps

#### Lead Capture Tables

**mentorship_requests** - 1-on-1 mentorship requests
- `id` (uuid, PK)
- `full_name`, `email`, `goal`, `message`
- `status` (enum: pending, contacted, scheduled, completed)
- Timestamps

**newsletter_subscribers** - Email subscriptions
- `id` (uuid, PK)
- `email`, `name`
- `subscribed_at` (timestamp)
- `is_active` (boolean)

### Supabase Client Usage

#### Server Components (Recommended)

```typescript
import { createClient } from '@/lib/supabase/server'

export default async function Page() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('status', 'published')

  if (error) throw error

  return <div>{/* render data */}</div>
}
```

#### Client Components

```typescript
'use client'

import { supabase } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export default function ClientComponent() {
  const [data, setData] = useState([])

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase
        .from('courses')
        .select('*')
      setData(data || [])
    }
    fetchData()
  }, [])

  return <div>{/* render */}</div>
}
```

### Pre-built Query Functions

Location: `/lib/db/queries.ts`

**Course Queries:**
- `getAllCourses()` - Get all published courses with instructor
- `getCourseBySlug(slug)` - Get course with modules and lessons
- `getUserEnrolledCourses(userId)` - Get user's enrolled courses

**Lesson Queries:**
- `getLessonBySlug(courseSlug, lessonSlug)` - Get lesson with course data
- `getAllLessonsForCourse(courseSlug)` - Get all lessons in a course
- `getNextLesson(lessonId)` - Get next lesson in sequence
- `getPreviousLesson(lessonId)` - Get previous lesson

**Progress Queries:**
- `isLessonCompleted(userId, lessonId)` - Check if lesson is done
- `markLessonCompleted(userId, lessonId)` - Mark lesson complete

**Bookmark Queries:**
- `isLessonBookmarked(userId, lessonId)` - Check if bookmarked
- `getUserBookmarks(userId)` - Get all user bookmarks

**Note Queries:**
- `getLessonNotes(userId, lessonId)` - Get notes for a lesson
- `getUserNotes(userId)` - Get all user notes

### TypeScript Types

All database types are defined in `/types/database.ts`:

```typescript
import type {
  Course,
  CourseWithModules,
  Lesson,
  Module,
  UserProgress
} from '@/types/database'
```

Types are organized as:
- **Base types:** Direct table representations
- **Joined types:** Extended with related data (e.g., `CourseWithInstructor`)
- **Insert types:** Omit auto-generated fields
- **Update types:** All fields optional except ID
- **API types:** Response and paginated structures

---

## 🧩 Component Architecture

### Component Organization

Components are organized by **feature/domain**:

```
components/
├── common/         # Shared across entire app
├── course/         # Course-specific components
├── lesson/         # Lesson-specific components
├── home/           # Homepage components
├── navigation/     # Headers, footers, menus
└── search/         # Search functionality
```

### Component Categories

#### 1. Common Components

**Logo.tsx** - Brand logo with configurable sizes
```typescript
import { Logo } from '@/components/common'

<Logo size="md" className="..." />
```

**NewsletterForm.tsx** - Email capture form
- Validates email
- POSTs to `/api/newsletter`
- Shows success/error states

#### 2. Course Components

Located in `/components/course/`:
- Course cards
- Course filters
- Course grid/list views
- Lesson lists

#### 3. Lesson Components

Located in `/components/lesson/`:
- Lesson content renderer
- Video player
- Lesson navigation
- Progress indicators
- `/premium/` - Premium-only features

#### 4. Layout Components

**app/layout.tsx** - Root layout
- Sets up fonts (Inter)
- Global metadata
- Dark theme (black background)
- No header/footer in current MVP

### Component Patterns

#### Server Components (Default)

```typescript
// No 'use client' directive
// Can fetch data directly
// Cannot use hooks or browser APIs

export default async function CourseList() {
  const courses = await getAllCourses()

  return (
    <div>
      {courses.map(course => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  )
}
```

#### Client Components

```typescript
'use client'

import { useState } from 'react'

export default function SearchBar() {
  const [query, setQuery] = useState('')

  return (
    <input
      value={query}
      onChange={(e) => setQuery(e.target.value)}
    />
  )
}
```

#### Mixing Server + Client

```typescript
// page.tsx (Server Component)
export default async function Page() {
  const courses = await getAllCourses()

  return (
    <div>
      {/* Server Component */}
      <CourseHeader />

      {/* Client Component - receives data as props */}
      <InteractiveFilters courses={courses} />
    </div>
  )
}
```

---

## 🔧 Common Tasks

### Adding a New Course

1. Use the Supabase dashboard or migration script
2. Insert into `courses` table with required fields
3. Add modules via `modules` table
4. Add lessons via `lessons` table
5. Ensure `order_index` is set correctly
6. Set `status` to 'published' when ready

### Creating a New Lesson

Option 1: Use script
```bash
npx tsx scripts/create-lesson.ts
```

Option 2: Manual SQL
```sql
INSERT INTO lessons (
  module_id,
  title,
  slug,
  order_index,
  content,
  is_free_preview
) VALUES (
  'module-uuid',
  'Lesson Title',
  'lesson-slug',
  1,
  '<p>Content here</p>',
  false
);
```

### Adding a New Page

```typescript
// app/nueva-pagina/page.tsx

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Título de la Página | Nodo360',
  description: 'Descripción para SEO',
}

export default function NuevaPagina() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold">Título</h1>
        {/* Content */}
      </div>
    </main>
  )
}
```

### Creating an API Route

```typescript
// app/api/example/route.ts

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types/database'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('courses')
      .select('*')

    if (error) throw error

    return NextResponse.json({
      data,
      message: 'Success'
    } as ApiResponse)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal error' } as ApiResponse,
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    // Validate and process

    return NextResponse.json({ message: 'Created' })
  } catch (error) {
    return NextResponse.json(
      { error: 'Bad request' },
      { status: 400 }
    )
  }
}
```

### Running Database Migrations

```bash
# Check current schema
npx tsx scripts/check-schema.ts

# Migrate courses from old format
npm run migrate-courses

# Migrate lessons to JSON format
npx tsx scripts/migrate-lessons-to-json.ts

# Verify migration
npx tsx scripts/verify-migration.ts
```

### Updating Styles

Global styles are in `app/globals.css` using Tailwind v4 with `@theme inline`:

```css
@theme inline {
  --color-nodo-black: #000000;
  --color-nodo-red: #dc2626;
  /* Add custom variables */
}
```

Brand colors are centralized in `/lib/brand-config.ts`:
```typescript
export const brandConfig = {
  colors: {
    primary: '#ff6b35',
    secondary: '#1a1f2e',
    premium: '#FFD700',
  }
}
```

---

## 🤖 AI Assistant Guidelines

### General Principles

1. **Read before writing:** Always read existing files before modifying
2. **Follow patterns:** Match existing code style and patterns
3. **TypeScript first:** All new code must be TypeScript with proper types
4. **Server-first:** Prefer Server Components unless interactivity is needed
5. **Spanish content:** All user-facing content should be in Spanish
6. **SEO-conscious:** Add metadata to all new pages

### When Reviewing Code

Check for:
- [ ] TypeScript types are explicit (no `any`)
- [ ] Spanish language for user-facing text
- [ ] Proper error handling
- [ ] Loading states for async operations
- [ ] Responsive design (mobile-first)
- [ ] Accessibility (semantic HTML, ARIA when needed)
- [ ] SEO (metadata, structured data)

### When Adding Features

1. Check `/docs` for existing documentation
2. Review similar existing features
3. Add types to `/types` if needed
4. Update database schema if needed (document in `/sql`)
5. Create reusable functions in `/lib`
6. Follow component organization patterns
7. Add to sitemap if it's a new page

### When Fixing Bugs

1. Understand the root cause before fixing
2. Check if similar issues exist elsewhere
3. Consider edge cases
4. Add error handling if missing
5. Test the fix mentally or describe test scenario

### Code Quality Standards

**Good:**
```typescript
// Explicit types, proper error handling
async function getCourse(slug: string): Promise<Course | null> {
  try {
    const course = await getCourseBySlug(slug)
    if (!course) {
      return null
    }
    return course
  } catch (error) {
    console.error('Error fetching course:', error)
    throw new Error('Failed to fetch course')
  }
}
```

**Avoid:**
```typescript
// Implicit any, no error handling
async function getCourse(slug) {
  const course = await getCourseBySlug(slug)
  return course
}
```

### Security Considerations

- **Never commit:** API keys, secrets, credentials
- **Validate input:** All user input must be validated
- **Sanitize output:** Prevent XSS when rendering user content
- **Use Supabase RLS:** Row Level Security for data access
- **Environment variables:** Use for all sensitive config

### Performance Best Practices

- Use Server Components by default (faster initial load)
- Lazy load images with Next.js Image component
- Implement pagination for large lists
- Cache database queries when appropriate
- Minimize client-side JavaScript
- Optimize images (WebP, AVIF formats)

### Common Pitfalls to Avoid

❌ **Don't:**
- Use `any` type
- Fetch data in Client Components unless necessary
- Hardcode content that should be in database
- Create deeply nested components
- Ignore TypeScript errors
- Mix Spanish and English in user-facing text
- Forget to handle loading/error states

✅ **Do:**
- Use proper TypeScript types
- Fetch in Server Components
- Store content in database
- Keep components focused and simple
- Fix all TypeScript errors
- Use Spanish consistently
- Always handle edge cases

---

## 📚 Important Files Reference

### Configuration Files

| File | Purpose | Notes |
|------|---------|-------|
| `next.config.ts` | Next.js configuration | Image optimization, headers, redirects |
| `tsconfig.json` | TypeScript configuration | Strict mode enabled, path aliases |
| `tailwind.config.js` | Tailwind CSS configuration | Tailwind v4 with @theme inline |
| `eslint.config.mjs` | ESLint configuration | Next.js rules |
| `package.json` | Dependencies & scripts | npm scripts defined here |
| `.env.local` | Environment variables | **Never commit this file** |

### Key Source Files

| File | Purpose | Import Path |
|------|---------|------------|
| `lib/supabase/server.ts` | Server-side Supabase client | `@/lib/supabase/server` |
| `lib/supabase/client.ts` | Client-side Supabase client | `@/lib/supabase/client` |
| `lib/db/queries.ts` | Database query functions | `@/lib/db/queries` |
| `types/database.ts` | All database types | `@/types/database` |
| `lib/brand-config.ts` | Brand colors & assets | `@/lib/brand-config` |
| `lib/community-config.ts` | Social links | `@/lib/community-config` |
| `app/layout.tsx` | Root layout & metadata | N/A (used by Next.js) |
| `app/globals.css` | Global styles | Imported in layout |

### Documentation Files

| File | Content | Read When |
|------|---------|-----------|
| `README.md` | Project overview | Getting started |
| `CLAUDE.md` | This file | Understanding codebase |
| `docs/DEPLOYMENT-GUIDE.md` | Production deployment | Deploying to production |
| `docs/DASHBOARD-SYSTEM.md` | Dashboard features | Working on dashboard |
| `docs/LESSON-SYSTEM.md` | Lesson architecture | Working on lessons |
| `docs/LEADS-SYSTEM.md` | Lead capture system | Working on forms |
| `SCHEMA_APPLICATION.md` | Database schema changes | Database modifications |

### Script Files

| Script | Purpose | Command |
|--------|---------|---------|
| `migrate-courses.ts` | Import courses to DB | `npm run migrate-courses` |
| `create-lesson.ts` | Create new lesson | `npx tsx scripts/create-lesson.ts` |
| `check-schema.ts` | Verify DB schema | `npx tsx scripts/check-schema.ts` |
| `verify-migration.ts` | Check migration results | `npx tsx scripts/verify-migration.ts` |

---

## 🎯 Quick Reference

### Path Aliases

TypeScript path alias `@/*` maps to project root:

```typescript
// Instead of: ../../../../lib/db/queries
import { getCourseBySlug } from '@/lib/db/queries'

// Instead of: ../../components/common
import { Logo } from '@/components/common'

// Instead of: ../../../types/database
import type { Course } from '@/types/database'
```

### Brand Assets

```typescript
import { brandConfig } from '@/lib/brand-config'

// Logo
brandConfig.logo.url          // '/imagenes/logo-nodo360.png.png'
brandConfig.logo.sizes.md     // { width: 250, height: 250 }

// Colors
brandConfig.colors.primary    // '#ff6b35'
brandConfig.colors.premium    // '#FFD700'

// Social
brandConfig.social.discord    // Discord invite link
brandConfig.social.telegram   // Telegram channel
```

### Common Components

```typescript
import { Logo, NewsletterForm } from '@/components/common'

<Logo size="md" />
<NewsletterForm />
```

### Database Queries

```typescript
import {
  getAllCourses,
  getCourseBySlug,
  getLessonBySlug,
  markLessonCompleted
} from '@/lib/db/queries'

// Usage in Server Component
const courses = await getAllCourses()
const course = await getCourseBySlug('bitcoin-fundamentals')
const lesson = await getLessonBySlug('bitcoin-fundamentals', 'intro')
await markLessonCompleted(userId, lessonId)
```

### Metadata Pattern

```typescript
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Título | Nodo360',
  description: 'Descripción para SEO',
  openGraph: {
    title: 'Título para redes sociales',
    description: 'Descripción para redes sociales',
    images: ['/imagenes/og-image.png'],
  },
}
```

---

## 🚀 Development Checklist

When working on this project, remember to:

- [ ] Use TypeScript with explicit types
- [ ] Follow existing file/folder structure
- [ ] Prefer Server Components over Client Components
- [ ] Add proper error handling
- [ ] Include loading states for async operations
- [ ] Write user-facing content in Spanish
- [ ] Add metadata to new pages
- [ ] Test responsive design (mobile/tablet/desktop)
- [ ] Consider accessibility (semantic HTML, ARIA)
- [ ] Update documentation if adding major features
- [ ] Run `npm run lint` before committing
- [ ] Never commit sensitive data or API keys

---

## 📞 Additional Resources

### External Documentation

- [Next.js 14 App Router Docs](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS v4 Docs](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React 19 Docs](https://react.dev/)

### Internal Documentation

- See `/docs` folder for detailed feature guides
- See `/lib/README.md` for backend integration guide
- See `/scripts/MIGRATION_GUIDE.md` for data migration help

---

## 📝 Notes for AI Assistants

### Context Awareness

You are working on a **Spanish-language educational platform** focused on Bitcoin and blockchain education. Keep this context in mind when:

- Suggesting content or copy (use Spanish)
- Designing features (consider Spanish-speaking audience)
- Making UX decisions (align with educational goals)

### Project Maturity

This is an **MVP-stage project**:
- Core features are implemented but may need refinement
- Some planned features are not yet built (auth, payments)
- Documentation exists but may need updates
- Code quality is good but can be improved

### When in Doubt

1. Check existing code for similar patterns
2. Refer to `/docs` for feature documentation
3. Look at `/types/database.ts` for data structures
4. Ask clarifying questions before major changes

---

**Last Updated:** November 15, 2025
**Maintained by:** AI Assistants & Development Team
**Version:** 1.0.0

---

*This file is a living document. Update it as the project evolves.*

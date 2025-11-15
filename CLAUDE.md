# CLAUDE.md - AI Assistant Guide for Nodo360 Plataforma

**Last Updated**: November 15, 2025
**Project**: nodo360-plataforma
**Status**: MVP Ready - Production Deployment

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Codebase Structure](#codebase-structure)
3. [Tech Stack](#tech-stack)
4. [Development Workflows](#development-workflows)
5. [Key Conventions](#key-conventions)
6. [Database & Backend](#database--backend)
7. [Component Patterns](#component-patterns)
8. [Common Tasks](#common-tasks)
9. [Important Notes](#important-notes)
10. [Resources](#resources)

---

## 🎯 Project Overview

**Nodo360** is a Spanish-language educational platform for Bitcoin, Blockchain, and Web3 education. The platform offers both free and premium courses with video content, progress tracking, and community features.

### Key Features
- 📚 Course catalog with free and premium content
- 🎥 Video lessons with structured content
- 📊 User progress tracking (via Supabase)
- 🔖 Bookmarks and notes system
- 📧 Newsletter subscription
- 🤝 Mentorship program
- 🏘️ Community integration
- 🔍 Course search functionality

### Current Status
- **MVP**: ✅ Ready for production
- **Authentication**: Currently removed for MVP (public access)
- **Database**: Supabase PostgreSQL
- **Deployment**: Configured for Vercel

---

## 📁 Codebase Structure

```
nodo360-plataforma/
├── app/                          # Next.js 16 App Router
│   ├── layout.tsx                # Root layout with metadata
│   ├── page.tsx                  # Homepage with course sections
│   ├── globals.css               # Global styles
│   ├── cursos/                   # Courses pages
│   │   ├── page.tsx              # Course catalog
│   │   └── [slug]/               # Dynamic course pages
│   │       ├── page.tsx          # Course detail page
│   │       └── [lessonSlug]/     # Dynamic lesson pages
│   │           └── page.tsx      # Lesson detail page
│   ├── dashboard/                # User dashboard (demo mode)
│   ├── mentoria/                 # Mentorship page
│   ├── comunidad/                # Community page
│   ├── proyectos/                # Projects page
│   ├── sobre-nosotros/           # About us page
│   └── api/                      # API routes
│       ├── newsletter/           # Newsletter subscription
│       └── mentorship/           # Mentorship requests
│
├── components/                   # React components
│   ├── common/                   # Shared components
│   │   ├── Logo.tsx              # Nodo360 logo component
│   │   └── NewsletterForm.tsx    # Newsletter form
│   ├── home/                     # Homepage sections
│   │   ├── HeroSection.tsx
│   │   ├── CourseGrid.tsx
│   │   ├── CommunitySection.tsx
│   │   ├── StatsSection.tsx
│   │   └── [other sections]
│   ├── course/                   # Course-related components
│   ├── lesson/                   # Lesson components
│   │   └── premium/              # Premium lesson features
│   ├── navigation/               # Navigation components
│   └── search/                   # Search components
│
├── lib/                          # Library code & utilities
│   ├── supabase/                 # Supabase integration
│   │   ├── client.ts             # Client-side Supabase client
│   │   ├── server.ts             # Server-side Supabase client
│   │   ├── types.ts              # Database type definitions
│   │   ├── helpers.ts            # Helper functions
│   │   └── index.ts              # Exports
│   ├── db/                       # Database queries
│   │   └── queries.ts            # Supabase query helpers
│   ├── analytics.ts              # Analytics utilities
│   ├── brand-config.ts           # Brand configuration
│   ├── community-config.ts       # Community settings
│   ├── filter-utils.ts           # Filter utilities
│   ├── lesson-helpers.ts         # Lesson helper functions
│   ├── progress-manager.ts       # Progress tracking
│   ├── search-utils.ts           # Search utilities
│   └── structured-data.ts        # SEO structured data
│
├── types/                        # TypeScript type definitions
│   ├── database.ts               # Database types
│   └── lesson-content.ts         # Lesson content types
│
├── hooks/                        # Custom React hooks
│   └── useSearch.ts              # Search hook
│
├── data/                         # Static data & examples
│   ├── example-lesson.json       # Example lesson structure
│   └── example-lesson-premium.json
│
├── scripts/                      # Utility scripts
│   ├── migrate-courses.ts        # Course migration script
│   └── [other migration scripts]
│
├── docs/                         # Documentation
│   ├── MVP-READY-REPORT.md       # MVP status report
│   ├── DEPLOYMENT-GUIDE.md       # Deployment instructions
│   ├── LESSON-SYSTEM.md          # Lesson system docs
│   ├── MIGRATION-GUIDE.md        # Migration guide
│   └── [other docs]
│
├── nodo360-community-widget/     # Community widget integration
│
├── public/                       # Static assets
│   └── imagenes/                 # Images
│
├── next.config.ts                # Next.js configuration
├── tsconfig.json                 # TypeScript configuration
├── eslint.config.mjs             # ESLint configuration
├── package.json                  # Dependencies & scripts
├── SCHEMA_APPLICATION.md         # Database schema guide
└── README.md                     # Project readme
```

---

## 🛠️ Tech Stack

### Core Framework
- **Next.js 16.0.1** - React framework with App Router
- **React 19.2.0** - UI library
- **TypeScript 5** - Type safety

### Backend & Database
- **Supabase** - PostgreSQL database + Auth (currently disabled)
  - `@supabase/supabase-js ^2.81.1` - JavaScript client
  - `@supabase/ssr ^0.7.0` - Server-side rendering support
  - Project ID: `gcahtbecfidroepelcuw`

### Styling
- **Tailwind CSS 4** - Utility-first CSS
- **@tailwindcss/postcss** - PostCSS integration
- **Inter Font** - Google Font (weights: 300-800)

### UI Components
- **lucide-react ^0.553.0** - Icon library

### Development Tools
- **ESLint 9** - Code linting
- **tsx ^4.20.6** - TypeScript execution
- **dotenv ^17.2.3** - Environment variables

### Utilities
- **cheerio ^1.1.2** - HTML parsing (for content processing)

---

## 🔄 Development Workflows

### Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev
# → Server runs at http://localhost:3000

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Run migration scripts
npm run migrate-courses
```

### Environment Variables

Required environment variables (`.env.local`):

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://gcahtbecfidroepelcuw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional: Database password for migrations
SUPABASE_DB_PASSWORD=your-db-password
```

**Note**: `.env*` files are gitignored. Use `.env.example` as template.

### Git Workflow

```bash
# Current branch structure
main/                    # Production branch
claude/                  # Claude AI development branches
  └── claude-md-*       # Feature branches with session IDs
```

**Important**: Always work on designated Claude branches starting with `claude/` and ending with the session ID.

### Build & Deployment

The project is configured for **Vercel** deployment:

```bash
# Build checks
npm run build
# ✅ Must pass without TypeScript errors

# Production optimizations enabled:
# - Image optimization (AVIF, WebP)
# - Console removal (except errors/warnings)
# - Security headers configured
# - Package imports optimized (lucide-react)
```

---

## 📝 Key Conventions

### File Naming
- **Components**: PascalCase (e.g., `HeroSection.tsx`, `CourseGrid.tsx`)
- **Utilities**: kebab-case (e.g., `search-utils.ts`, `filter-utils.ts`)
- **Pages**: lowercase with brackets for dynamic routes (e.g., `[slug]/page.tsx`)

### TypeScript
- **Strict mode enabled** in `tsconfig.json`
- **Path aliases**: Use `@/*` for imports from root
  ```typescript
  import { createClient } from '@/lib/supabase/server'
  import type { Course } from '@/types/database'
  ```
- **Type imports**: Use `type` keyword for type-only imports
  ```typescript
  import type { Metadata } from 'next'
  import type { Database } from '@/lib/supabase/types'
  ```

### Component Structure
```typescript
// 1. Imports - external first, then internal
import { useState } from 'react'
import type { Course } from '@/types/database'

// 2. Type definitions
interface CourseCardProps {
  course: Course
  isPremium?: boolean
}

// 3. Component
export default function CourseCard({ course, isPremium = false }: CourseCardProps) {
  // Component logic
}

// 4. Sub-components or helpers (if needed)
```

### Styling
- **Dark theme by default**: `bg-[#1a1f2e]`, `text-white`
- **Brand colors**:
  - Primary Orange: `#ff6b35`
  - Bitcoin Orange: `#f7931a`
  - Gold (Premium): `#FFD700` to `#FFA500`
  - Dark backgrounds: `#1a1f2e`, `#252b3d`
- **Gradients**: Use `bg-gradient-to-*` for premium features
- **Spacing**: Use Tailwind's spacing scale consistently

### API Routes
```typescript
// app/api/[route]/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    // Handle request
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    return NextResponse.json(
      { error: 'Error message' },
      { status: 500 }
    )
  }
}
```

### Data Fetching
- **Server Components**: Use `async/await` with Supabase server client
  ```typescript
  import { createClient } from '@/lib/supabase/server'

  async function getData() {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('courses')
      .select('*')

    if (error) console.error(error)
    return data || []
  }
  ```

- **Client Components**: Use Supabase client from `@/lib/supabase/client`

---

## 🗄️ Database & Backend

### Supabase Schema

**Tables**:
1. **users** - User profiles
   - `id` (uuid, PK)
   - `email` (string)
   - `full_name` (string, nullable)
   - `avatar_url` (string, nullable)
   - `created_at`, `updated_at`

2. **courses** - Course information
   - `id` (uuid, PK)
   - `title` (string)
   - `slug` (string, unique)
   - `description` (text, nullable)
   - `thumbnail_url` (string, nullable)
   - `is_free` (boolean)
   - `order_index` (integer)
   - `created_at`, `updated_at`

3. **modules** - Course modules/sections
   - `id` (uuid, PK)
   - `course_id` (uuid, FK → courses)
   - `title` (string)
   - `slug` (string)
   - `description` (text, nullable)
   - `order_index` (integer)
   - `created_at`, `updated_at`

4. **lessons** - Individual lessons
   - `id` (uuid, PK)
   - `module_id` (uuid, FK → modules)
   - `title` (string)
   - `slug` (string)
   - `content` (text, nullable)
   - `video_url` (string, nullable)
   - `order_index` (integer)
   - `is_free_preview` (boolean)
   - `created_at`, `updated_at`

5. **user_progress** - Track lesson completion
   - `id` (uuid, PK)
   - `user_id` (uuid, FK → users)
   - `lesson_id` (uuid, FK → lessons)
   - `completed` (boolean)
   - `completed_at` (timestamp, nullable)
   - `created_at`, `updated_at`

6. **bookmarks** - User bookmarks
   - `id` (uuid, PK)
   - `user_id` (uuid, FK → users)
   - `lesson_id` (uuid, FK → lessons)
   - `created_at`

7. **notes** - User notes
   - `id` (uuid, PK)
   - `user_id` (uuid, FK → users)
   - `lesson_id` (uuid, FK → lessons)
   - `content` (text)
   - `created_at`, `updated_at`

### Supabase Clients

**Server-side** (Server Components, API Routes):
```typescript
import { createClient } from '@/lib/supabase/server'

const supabase = await createClient()
```

**Client-side** (Client Components):
```typescript
import { supabase } from '@/lib/supabase/client'
```

### Query Patterns

```typescript
// Get courses with error handling
const { data, error } = await supabase
  .from('courses')
  .select('id, title, slug, description, is_premium')
  .eq('is_premium', false)
  .order('created_at', { ascending: false })
  .limit(6)

if (error) {
  console.error('Error fetching courses:', error)
  return []
}

return data || []
```

---

## 🧩 Component Patterns

### Page Components (Server Components)
```typescript
// app/page.tsx
import { createClient } from '@/lib/supabase/server'
import type { Course } from '@/types/database'
import { HeroSection } from '@/components/home'

export const metadata = {
  title: 'Page Title',
  description: 'Page description',
}

async function getData(): Promise<Course[]> {
  const supabase = await createClient()
  // Fetch data
  return data
}

export default async function Page() {
  const data = await getData()

  return (
    <main className="min-h-screen bg-[#1a1f2e]">
      <HeroSection />
      {/* Content */}
    </main>
  )
}
```

### Reusable Components
```typescript
// components/common/Component.tsx
import type { ReactNode } from 'react'

interface ComponentProps {
  title: string
  children?: ReactNode
  className?: string
}

export default function Component({
  title,
  children,
  className = ''
}: ComponentProps) {
  return (
    <div className={`base-classes ${className}`}>
      <h2>{title}</h2>
      {children}
    </div>
  )
}
```

### Index Files for Exports
```typescript
// components/home/index.ts
export { default as HeroSection } from './HeroSection'
export { default as CourseGrid } from './CourseGrid'
export { default as CommunitySection } from './CommunitySection'
// ... other exports
```

---

## ✅ Common Tasks

### Adding a New Page

1. Create page file in `app/`:
   ```typescript
   // app/nueva-pagina/page.tsx
   export const metadata = {
     title: 'Nueva Página - Nodo360',
     description: 'Description',
   }

   export default function NuevaPagina() {
     return <main>Content</main>
   }
   ```

2. Add navigation link if needed
3. Update sitemap in `app/sitemap.ts` if necessary

### Adding a New Component

1. Create component file:
   ```bash
   components/[category]/ComponentName.tsx
   ```

2. Add to index file:
   ```typescript
   // components/[category]/index.ts
   export { default as ComponentName } from './ComponentName'
   ```

3. Import where needed:
   ```typescript
   import { ComponentName } from '@/components/[category]'
   ```

### Adding a New API Route

1. Create route file:
   ```typescript
   // app/api/[route]/route.ts
   import { NextRequest, NextResponse } from 'next/server'

   export async function POST(request: NextRequest) {
     try {
       const body = await request.json()
       // Handle request
       return NextResponse.json({ success: true })
     } catch (error) {
       return NextResponse.json(
         { error: 'Error message' },
         { status: 500 }
       )
     }
   }
   ```

2. Test the endpoint

### Fetching Course Data

```typescript
// Get all courses
const { data: courses } = await supabase
  .from('courses')
  .select('*')
  .order('order_index')

// Get course with modules and lessons
const { data: course } = await supabase
  .from('courses')
  .select(`
    *,
    modules:modules(
      *,
      lessons:lessons(*)
    )
  `)
  .eq('slug', courseSlug)
  .single()

// Get single lesson
const { data: lesson } = await supabase
  .from('lessons')
  .select('*')
  .eq('slug', lessonSlug)
  .single()
```

### Running Migrations

```bash
# Run the course migration script
npm run migrate-courses

# Or run TypeScript scripts directly
npx tsx scripts/script-name.ts
```

---

## ⚠️ Important Notes

### Authentication Status
- **Current**: Authentication is DISABLED for MVP
- NextAuth v5 was removed to achieve MVP deployment
- Dashboard is in public demo mode
- User-specific features (progress, bookmarks, notes) are disabled
- **Future**: Will be re-implemented with Supabase Auth or NextAuth

### Removed/Disabled Features
- `lib/auth/` - Authentication utilities (removed)
- `app/api/auth/` - NextAuth routes (removed)
- `app/api/dashboard/` - Dashboard APIs (removed)
- `app/api/progress/` - Progress tracking (removed)
- `app/api/bookmarks/` - Bookmarks (removed)
- `app/api/notes/` - Notes (removed)

### Key Files to Never Delete
- `lib/supabase/client.ts` - Supabase client configuration
- `lib/supabase/server.ts` - Server-side Supabase client
- `lib/supabase/types.ts` - Database type definitions
- `types/database.ts` - Application type definitions
- `app/layout.tsx` - Root layout with metadata
- `next.config.ts` - Next.js configuration

### Performance Considerations
- Images are optimized (AVIF, WebP)
- Console logs removed in production (except errors/warnings)
- Package imports optimized (lucide-react)
- Static optimization enabled where possible
- Use `loading.tsx` and `error.tsx` for better UX

### SEO Best Practices
- Always set metadata in page components
- Use structured data (see `lib/structured-data.ts`)
- Update `app/sitemap.ts` for new pages
- Configure `app/robots.ts` as needed
- Use semantic HTML

### Security
- Security headers configured in `next.config.ts`:
  - HSTS, X-Frame-Options, X-Content-Type-Options
  - X-XSS-Protection, Referrer-Policy
- Environment variables properly secured
- Supabase RLS (Row Level Security) enabled

---

## 📚 Resources

### Documentation Files
- `docs/MVP-READY-REPORT.md` - Current MVP status
- `docs/DEPLOYMENT-GUIDE.md` - Deployment instructions
- `docs/LESSON-SYSTEM.md` - Lesson system documentation
- `docs/MIGRATION-GUIDE.md` - Database migration guide
- `docs/DASHBOARD-SYSTEM.md` - Dashboard system docs
- `SCHEMA_APPLICATION.md` - Database schema setup guide

### External Documentation
- [Next.js 16 Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Useful Commands
```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint

# Database
npm run migrate-courses  # Run course migration

# TypeScript
npx tsc --noEmit        # Type check without building
```

### Project Contacts
- **Platform**: Nodo360
- **Website**: https://nodo360.com
- **Supabase Project**: gcahtbecfidroepelcuw
- **Deployment**: Vercel

---

## 🎯 Working with This Codebase (AI Assistant Guidelines)

### Before Making Changes
1. ✅ Check if feature requires authentication (currently disabled)
2. ✅ Review existing patterns in similar files
3. ✅ Check TypeScript types for the data you're working with
4. ✅ Verify environment variables are available

### When Adding Features
1. ✅ Use existing component patterns from `components/`
2. ✅ Follow the file naming conventions
3. ✅ Add TypeScript types in `types/` if needed
4. ✅ Update documentation in `docs/` if it's a major feature
5. ✅ Test build with `npm run build`

### When Fixing Bugs
1. ✅ Check `docs/MVP-READY-REPORT.md` for known issues
2. ✅ Verify the issue isn't related to removed auth features
3. ✅ Check console for TypeScript errors
4. ✅ Test in both dev and build mode

### Code Quality Checklist
- [ ] TypeScript types are properly defined
- [ ] No console errors in build
- [ ] Components use proper import paths (`@/*`)
- [ ] Styling follows brand colors and dark theme
- [ ] Metadata added for new pages
- [ ] Error handling implemented
- [ ] Responsive design considered
- [ ] Accessibility considered (semantic HTML, ARIA where needed)

---

**Last Updated**: November 15, 2025
**Document Version**: 1.0.0
**For Questions**: Refer to documentation in `docs/` directory

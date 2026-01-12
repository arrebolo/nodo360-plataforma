/**
 * Course Migration Script
 *
 * Migrates courses from nodo360-cursos Next.js app to Supabase database
 *
 * Usage:
 *   npx tsx scripts/migrate-courses.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

// =====================================================
// CONFIGURATION
// =====================================================

const COURSES_SOURCE_PATH = 'C:\\Users\\alber\\proyectos\\nodo360-cursos\\app\\cursos'

const COURSES_TO_MIGRATE = [
  {
    slug: 'bitcoin-desde-cero',
    dirName: 'bitcoin-desde-cero',
  },
  {
    slug: 'fundamentos-blockchain',
    dirName: 'fundamentos-blockchain',
  },
  {
    slug: 'primera-wallet',
    dirName: 'primera-wallet',
  },
]

// =====================================================
// SUPABASE CLIENT
// =====================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase credentials in .env.local')
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Use admin client to bypass RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// =====================================================
// TYPES
// =====================================================

interface CourseData {
  slug: string
  title: string
  description: string
  level: 'beginner' | 'intermediate' | 'advanced'
  is_free: boolean
  modules: ModuleData[]
}

interface ModuleData {
  title: string
  slug: string
  order_index: number
  lessons: LessonData[]
}

interface LessonData {
  title: string
  slug: string
  order_index: number
  content: string
  video_url?: string
  is_free_preview: boolean
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Extract metadata from a Next.js page.tsx file
 */
function extractMetadataFromFile(filePath: string): any {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')

    // Extract title from metadata or h1
    let title = ''
    const metadataTitleMatch = content.match(/title:\s*['"]([^'"]+)['"]/i)
    if (metadataTitleMatch) {
      title = metadataTitleMatch[1]
    } else {
      const h1Match = content.match(/<h1[^>]*>([^<]+)<\/h1>/i)
      if (h1Match) {
        title = h1Match[1].trim()
      }
    }

    // Extract description
    let description = ''
    const metadataDescMatch = content.match(/description:\s*['"]([^'"]+)['"]/i)
    if (metadataDescMatch) {
      description = metadataDescMatch[1]
    }

    // Extract full content (for lessons)
    const contentMatch = content.match(/return\s*\(([\s\S]*?)\);?\s*}\s*$/m)
    let htmlContent = contentMatch ? contentMatch[1] : ''

    return {
      title,
      description,
      content: htmlContent,
      fullContent: content,
    }
  } catch (error) {
    console.error(`   ⚠️  Error reading file ${filePath}:`, error)
    return { title: '', description: '', content: '' }
  }
}

/**
 * Determine course level based on title/content
 */
function determineCourseLevel(title: string, description: string): 'beginner' | 'intermediate' | 'advanced' {
  const text = (title + ' ' + description).toLowerCase()

  if (text.includes('desde cero') || text.includes('fundamentos') || text.includes('básico')) {
    return 'beginner'
  }

  if (text.includes('avanzado') || text.includes('profesional')) {
    return 'advanced'
  }

  return 'beginner' // Default to beginner
}

/**
 * Read course structure from filesystem
 */
function readCourseStructure(courseDirPath: string, courseSlug: string): CourseData | null {
  try {
    console.log(`\n📖 Reading course: ${courseSlug}`)

    // Read main course page
    const coursePagePath = path.join(courseDirPath, 'page.tsx')
    if (!fs.existsSync(coursePagePath)) {
      console.error(`   ❌ Course page not found: ${coursePagePath}`)
      return null
    }

    const courseMetadata = extractMetadataFromFile(coursePagePath)

    if (!courseMetadata.title) {
      console.error(`   ❌ Could not extract title from course page`)
      return null
    }

    console.log(`   ✓ Course title: ${courseMetadata.title}`)

    // Read lessons directory
    const lessonsDir = path.join(courseDirPath, 'leccion')
    if (!fs.existsSync(lessonsDir)) {
      console.error(`   ⚠️  No lessons directory found`)
      return null
    }

    // Get all lesson directories
    const lessonDirs = fs
      .readdirSync(lessonsDir, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name)
      .sort()

    console.log(`   ✓ Found ${lessonDirs.length} lessons`)

    // Group lessons by module
    const moduleMap = new Map<number, ModuleData>()

    for (const lessonDir of lessonDirs) {
      // Parse lesson directory name: {module}-{lesson}
      const match = lessonDir.match(/^(\d+)-(\d+)$/)
      if (!match) {
        console.warn(`   ⚠️  Skipping invalid lesson directory: ${lessonDir}`)
        continue
      }

      const moduleNum = parseInt(match[1])
      const lessonNum = parseInt(match[2])

      // Read lesson page
      const lessonPagePath = path.join(lessonsDir, lessonDir, 'page.tsx')
      if (!fs.existsSync(lessonPagePath)) {
        console.warn(`   ⚠️  Lesson page not found: ${lessonPagePath}`)
        continue
      }

      const lessonMetadata = extractMetadataFromFile(lessonPagePath)

      if (!lessonMetadata.title) {
        console.warn(`   ⚠️  Could not extract title from lesson: ${lessonDir}`)
        continue
      }

      // Create module if it doesn't exist
      if (!moduleMap.has(moduleNum)) {
        moduleMap.set(moduleNum, {
          title: `Módulo ${moduleNum}`,
          slug: `modulo-${moduleNum}`,
          order_index: moduleNum,
          lessons: [],
        })
      }

      const module = moduleMap.get(moduleNum)!

      // Add lesson to module
      module.lessons.push({
        title: lessonMetadata.title,
        slug: lessonDir,
        order_index: lessonNum,
        content: lessonMetadata.content || lessonMetadata.fullContent,
        is_free_preview: lessonNum === 1, // First lesson of each module is free
      })

      console.log(`   ✓ Lesson ${moduleNum}-${lessonNum}: ${lessonMetadata.title}`)
    }

    // Convert module map to sorted array
    const modules = Array.from(moduleMap.values()).sort(
      (a, b) => a.order_index - b.order_index
    )

    // Sort lessons within each module
    modules.forEach((module) => {
      module.lessons.sort((a, b) => a.order_index - b.order_index)
    })

    const courseData: CourseData = {
      slug: courseSlug,
      title: courseMetadata.title,
      description: courseMetadata.description || `Aprende ${courseMetadata.title}`,
      level: determineCourseLevel(courseMetadata.title, courseMetadata.description),
      is_free: true,
      modules,
    }

    console.log(`   ✅ Course parsed: ${modules.length} modules, ${modules.reduce((sum, m) => sum + m.lessons.length, 0)} lessons`)

    return courseData
  } catch (error) {
    console.error(`   ❌ Error reading course structure:`, error)
    return null
  }
}

// =====================================================
// MIGRATION FUNCTIONS
// =====================================================

/**
 * Insert course into Supabase
 */
async function insertCourse(courseData: CourseData, instructorId: string | null): Promise<string | null> {
  try {
    console.log(`\n🚀 Inserting course: ${courseData.title}`)

    // Insert course
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .insert({
        slug: courseData.slug,
        title: courseData.title,
        description: courseData.description,
        level: courseData.level,
        status: 'published',
        is_free: courseData.is_free,
        price: 0,
        instructor_id: instructorId,
        total_modules: courseData.modules.length,
        total_lessons: courseData.modules.reduce((sum, m) => sum + m.lessons.length, 0),
        published_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (courseError) {
      console.error(`   ❌ Error inserting course:`, courseError)
      return null
    }

    console.log(`   ✅ Course inserted: ${course.id}`)

    // Insert modules and lessons
    for (const moduleData of courseData.modules) {
      const moduleId = await insertModule(course.id, moduleData)
      if (!moduleId) {
        console.error(`   ❌ Failed to insert module: ${moduleData.title}`)
        continue
      }

      // Insert lessons
      for (const lessonData of moduleData.lessons) {
        const lessonId = await insertLesson(moduleId, lessonData)
        if (!lessonId) {
          console.error(`   ❌ Failed to insert lesson: ${lessonData.title}`)
        }
      }
    }

    return course.id
  } catch (error) {
    console.error(`   ❌ Error in insertCourse:`, error)
    return null
  }
}

/**
 * Insert module into Supabase
 */
async function insertModule(courseId: string, moduleData: ModuleData): Promise<string | null> {
  try {
    const { data: module, error } = await supabase
      .from('modules')
      .insert({
        course_id: courseId,
        title: moduleData.title,
        order_index: moduleData.order_index,
        total_lessons: moduleData.lessons.length,
      })
      .select()
      .single()

    if (error) {
      console.error(`      ❌ Error inserting module:`, error)
      return null
    }

    console.log(`      ✅ Module inserted: ${moduleData.title}`)
    return module.id
  } catch (error) {
    console.error(`      ❌ Error in insertModule:`, error)
    return null
  }
}

/**
 * Insert lesson into Supabase
 */
async function insertLesson(moduleId: string, lessonData: LessonData): Promise<string | null> {
  try {
    const { data: lesson, error } = await supabase
      .from('lessons')
      .insert({
        module_id: moduleId,
        title: lessonData.title,
        slug: lessonData.slug,
        order_index: lessonData.order_index,
        content: lessonData.content,
        video_url: lessonData.video_url,
        is_free_preview: lessonData.is_free_preview,
      })
      .select()
      .single()

    if (error) {
      console.error(`         ❌ Error inserting lesson:`, error)
      return null
    }

    console.log(`         ✅ Lesson inserted: ${lessonData.title}`)
    return lesson.id
  } catch (error) {
    console.error(`         ❌ Error in insertLesson:`, error)
    return null
  }
}

// =====================================================
// MAIN MIGRATION LOGIC
// =====================================================

async function main() {
  console.log('=' .repeat(60))
  console.log('🔄 COURSE MIGRATION: Next.js → Supabase')
  console.log('=' .repeat(60))

  console.log(`\n📁 Source: ${COURSES_SOURCE_PATH}`)
  console.log(`🎯 Courses to migrate: ${COURSES_TO_MIGRATE.length}`)

  // Verify source directory exists
  if (!fs.existsSync(COURSES_SOURCE_PATH)) {
    console.error(`\n❌ Error: Source directory not found: ${COURSES_SOURCE_PATH}`)
    process.exit(1)
  }

  // Get or create instructor user
  console.log(`\n👤 Getting instructor user...`)
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, email, role')
    .eq('role', 'instructor')
    .limit(1)

  let instructorId: string | null = null

  if (usersError) {
    console.warn(`   ⚠️  Could not fetch instructor: ${usersError.message}`)
    console.warn(`   ℹ️  Courses will be created without instructor`)
  } else if (users && users.length > 0) {
    instructorId = users[0].id
    console.log(`   ✅ Using instructor: ${users[0].email}`)
  } else {
    console.warn(`   ⚠️  No instructor found in database`)
    console.warn(`   ℹ️  Courses will be created without instructor`)
  }

  // Migrate each course
  let successCount = 0
  let errorCount = 0

  for (const course of COURSES_TO_MIGRATE) {
    try {
      const courseDirPath = path.join(COURSES_SOURCE_PATH, course.dirName)

      if (!fs.existsSync(courseDirPath)) {
        console.error(`\n❌ Course directory not found: ${courseDirPath}`)
        errorCount++
        continue
      }

      // Read course structure
      const courseData = readCourseStructure(courseDirPath, course.slug)
      if (!courseData) {
        errorCount++
        continue
      }

      // Check if course already exists
      const { data: existingCourse } = await supabase
        .from('courses')
        .select('id, title')
        .eq('slug', course.slug)
        .single()

      if (existingCourse) {
        console.log(`\n⚠️  Course already exists: ${existingCourse.title}`)
        console.log(`   Skipping migration for: ${course.slug}`)
        continue
      }

      // Insert course
      const courseId = await insertCourse(courseData, instructorId)
      if (courseId) {
        successCount++
      } else {
        errorCount++
      }
    } catch (error) {
      console.error(`\n❌ Error migrating course ${course.slug}:`, error)
      errorCount++
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 MIGRATION SUMMARY')
  console.log('='.repeat(60))
  console.log(`✅ Successful: ${successCount}`)
  console.log(`❌ Errors: ${errorCount}`)
  console.log(`📝 Total: ${COURSES_TO_MIGRATE.length}`)

  if (successCount > 0) {
    console.log(`\n🎉 Migration completed successfully!`)
    console.log(`\n📋 Next steps:`)
    console.log(`   1. Verify courses in Supabase Dashboard → Table Editor`)
    console.log(`   2. Check course pages on your website`)
    console.log(`   3. Update any video URLs if needed`)
  } else {
    console.log(`\n⚠️  No courses were migrated`)
  }

  console.log('\n' + '='.repeat(60))
}

// Run migration
main().catch((error) => {
  console.error('\n💥 Fatal error:', error)
  process.exit(1)
})



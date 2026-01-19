/**
 * Database Types
 *
 * TypeScript types for all database tables
 * These types should match the schema defined in supabase/schema.sql
 */

import type { LessonContent } from './lesson-content'
import type { Database as SupabaseDatabase } from '@/lib/supabase/types'

// Re-export Database type for use across the app
export type Database = SupabaseDatabase

// =====================================================
// LEARNING PATHS TYPES (from Supabase schema)
// =====================================================

export type LearningPath = SupabaseDatabase['public']['Tables']['learning_paths']['Row']
export type LearningPathCourse = SupabaseDatabase['public']['Tables']['learning_path_courses']['Row']
export type LearningPathInsert = SupabaseDatabase['public']['Tables']['learning_paths']['Insert']
export type LearningPathUpdate = SupabaseDatabase['public']['Tables']['learning_paths']['Update']

// =====================================================
// ENUMS
// =====================================================

export type UserRole = 'student' | 'instructor' | 'admin' | 'mentor' | 'council'
export type CourseLevel = 'beginner' | 'intermediate' | 'advanced'
export type CourseStatus = 'draft' | 'published' | 'archived' | 'coming_soon'
export type CourseCategory = 'bitcoin' | 'blockchain' | 'defi' | 'nfts' | 'development' | 'trading' | 'other'
export type MentorshipRequestStatus = 'pending' | 'contacted' | 'scheduled' | 'completed'

// =====================================================
// TABLE TYPES
// =====================================================

/**
 * Users Table
 * Extends auth.users with additional profile information
 */
export interface User {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  bio: string | null
  website: string | null
  twitter: string | null
  github: string | null
  linkedin: string | null
  created_at: string
  updated_at: string
  last_seen_at: string | null
}

/**
 * Courses Table
 * Stores course information
 */
export interface Course {
  id: string
  slug: string
  title: string
  description: string | null
  long_description: string | null
  thumbnail_url: string | null
  banner_url: string | null
  level: CourseLevel
  category: CourseCategory
  status: CourseStatus
  price: number
  is_free: boolean
  is_premium: boolean
  duration_hours: number
  tags: string[]
  instructor_id: string | null
  total_modules: number
  total_lessons: number
  total_duration_minutes: number
  enrolled_count: number
  meta_title: string | null
  meta_description: string | null
  created_at: string
  updated_at: string
  published_at: string | null
}

/**
 * Modules Table
 * Stores course modules (sections)
 */
export interface Module {
  id: string
  course_id: string
  title: string
  slug: string
  description: string | null
  order_index: number
  total_lessons: number
  total_duration_minutes: number
  requires_quiz: boolean
  created_at: string
  updated_at: string
}

/**
 * Lessons Table
 * Stores individual lessons
 */
export interface Lesson {
  id: string
  module_id: string
  title: string
  description: string | null
  slug: string
  order_index: number
  content: string | null
  content_json: LessonContent | null
  video_url: string | null
  video_duration_minutes: number
  attachments: Attachment[]
  is_free_preview: boolean
  created_at: string
  updated_at: string
}

/**
 * User Progress Table
 * Tracks user progress through lessons
 */
export interface UserProgress {
  id: string
  user_id: string
  lesson_id: string
  is_completed: boolean
  completed_at: string | null
  watch_time_seconds: number
  created_at: string
  updated_at: string
}

/**
 * Bookmarks Table
 * Stores user bookmarks for lessons
 */
export interface Bookmark {
  id: string
  user_id: string
  lesson_id: string
  note: string | null
  created_at: string
}

/**
 * Notes Table
 * Stores user notes for lessons
 */
export interface Note {
  id: string
  user_id: string
  lesson_id: string
  content: string
  video_timestamp_seconds: number | null
  created_at: string
  updated_at: string
}

/**
 * User Lesson Notes Table (persistent per user + lesson)
 */
export interface UserLessonNote {
  id: string
  user_id: string
  course_id: string
  lesson_id: string
  content: string
  created_at: string
  updated_at: string
}

/**
 * Mentorship Requests Table
 * Stores mentorship 1-on-1 requests from users
 */
export interface MentorshipRequest {
  id: string
  full_name: string
  email: string
  goal: string
  message: string | null
  status: MentorshipRequestStatus
  created_at: string
  updated_at: string
}

/**
 * Newsletter Subscribers Table
 * Stores email newsletter subscriptions
 */
export interface NewsletterSubscriber {
  id: string
  email: string
  name: string | null
  subscribed_at: string
  is_active: boolean
}

// =====================================================
// JOINED/EXTENDED TYPES
// =====================================================

/**
 * Course with Instructor details
 */
export interface CourseWithInstructor extends Course {
  instructor: Pick<User, 'id' | 'full_name' | 'avatar_url'> | null
}

/**
 * Module with Course details
 */
export interface ModuleWithCourse extends Module {
  course: Pick<Course, 'id' | 'title' | 'slug' | 'status'>
}

/**
 * Lesson with Module and Course details
 */
export interface LessonWithDetails extends Lesson {
  module: {
    id: string
    title: string
    course_id: string
    course: Pick<Course, 'id' | 'title' | 'slug' | 'status'>
  }
}

/**
 * Lección con relaciones completas (Module y Course completos)
 * ESTRUCTURA CONSISTENTE: lesson.module.course (singular)
 * Esta es la estructura que usan las queries en lib/db/courses-queries.ts
 */
export interface LessonWithRelations extends Lesson {
  module: Module & {
    course: Course
  }
}

/**
 * Bookmark with Lesson details
 */
export interface BookmarkWithLesson extends Bookmark {
  lesson: {
    id: string
    title: string
    slug: string
    description: string | null
    video_duration_minutes: number | null
    module: {
      id: string
      title: string
      course: {
        id: string
        title: string
        slug: string
        thumbnail_url: string | null
        level: CourseLevel
      }
    }
  }
}

/**
 * Note with Lesson details
 */
export interface NoteWithLesson extends Note {
  lesson: {
    id: string
    title: string
    slug: string
    module: {
      id: string
      title: string
      course: {
        id: string
        title: string
        slug: string
      }
    }
  } | null
}

/**
 * Progress with Lesson details
 */
export interface ProgressWithLesson extends UserProgress {
  lessons: LessonWithDetails
}

// =====================================================
// HELPER TYPES
// =====================================================

/**
 * Attachment type for lessons
 */
export interface Attachment {
  id: string
  name: string
  url: string
  type: 'pdf' | 'doc' | 'link' | 'file'
  size?: number
}

/**
 * Course with full nested structure
 */
export interface CourseWithModules extends CourseWithInstructor {
  modules: Array<
    Module & {
      lessons: Lesson[]
    }
  >
}

/**
 * User's course progress summary
 */
export interface CourseProgress {
  course_id: string
  total_lessons: number
  completed_lessons: number
  total_watch_time_seconds: number
  last_watched_at: string | null
  completion_percentage: number
}

/**
 * Search results
 */
export interface SearchResults {
  courses?: CourseWithInstructor[]
  lessons?: LessonWithDetails[]
  totalResults: number
}

/**
 * Course filter options
 */
export interface CourseFilters {
  level: CourseLevel | 'all'
  category: CourseCategory | 'all'
  duration: 'all' | 'short' | 'medium' | 'long' | 'very-long'
  type: 'all' | 'free' | 'premium'
}

// =====================================================
// INSERT/UPDATE TYPES
// =====================================================

/**
 * Types for inserting new records (omit auto-generated fields)
 */
export type InsertUser = Omit<
  User,
  'created_at' | 'updated_at' | 'last_seen_at'
>
export type InsertCourse = Omit<
  Course,
  'id' | 'created_at' | 'updated_at' | 'published_at'
>
export type InsertModule = Omit<Module, 'id' | 'created_at' | 'updated_at'>
export type InsertLesson = Omit<Lesson, 'id' | 'created_at' | 'updated_at'>
export type InsertUserProgress = Omit<
  UserProgress,
  'id' | 'created_at' | 'updated_at'
>
export type InsertBookmark = Omit<Bookmark, 'id' | 'created_at'>
export type InsertNote = Omit<Note, 'id' | 'created_at' | 'updated_at'>
export type InsertUserLessonNote = Omit<UserLessonNote, 'id' | 'created_at' | 'updated_at'>
export type InsertMentorshipRequest = Omit<
  MentorshipRequest,
  'id' | 'status' | 'created_at' | 'updated_at'
>
export type InsertNewsletterSubscriber = Omit<
  NewsletterSubscriber,
  'id' | 'subscribed_at'
>
export type InsertCourseFinalQuizAttempt = Omit<
  CourseFinalQuizAttempt,
  'id' | 'created_at'
>

/**
 * Types for updating records (all fields optional except ID)
 */
export type UpdateUser = Partial<User> & { id: string }
export type UpdateCourse = Partial<Course> & { id: string }
export type UpdateModule = Partial<Module> & { id: string }
export type UpdateLesson = Partial<Lesson> & { id: string }
export type UpdateUserProgress = Partial<UserProgress> & { id: string }
export type UpdateNote = Partial<Note> & { id: string }
export type UpdateUserLessonNote = Partial<UserLessonNote> & { id: string }
export type UpdateCourseFinalQuizAttempt = Partial<CourseFinalQuizAttempt> & { id: string }

// =====================================================
// API RESPONSE TYPES
// =====================================================

/**
 * Standard API response structure
 */
export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
}

/**
 * Paginated API response
 */
export interface PaginatedResponse<T = any> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// =====================================================
// DASHBOARD & USER PROGRESS TYPES
// =====================================================

/**
 * Course Enrollments Table
 * Tracks which courses a user is enrolled in
 */
export interface CourseEnrollment {
  id: string
  user_id: string
  course_id: string
  enrolled_at: string
  last_accessed_at: string | null
  completed_at: string | null
  progress_percentage: number
}

/**
 * Lesson Progress Table
 * Detailed progress tracking for each lesson
 */
export interface LessonProgress {
  id: string
  user_id: string
  lesson_id: string
  course_id: string
  started_at: string
  completed_at: string | null
  last_position: number
  time_spent_seconds: number
  is_completed: boolean
}

/**
 * Quiz Questions Table
 * Stores quiz questions for module assessments
 */
export interface QuizQuestion {
  id: string
  module_id: string
  question: string
  explanation: string | null
  options: string[] // JSON array of options
  correct_answer: number // 0-based index
  order_index: number
  difficulty: 'easy' | 'medium' | 'hard'
  points: number
  created_at: string
  updated_at: string
}

/**
 * Quiz Attempts Table
 * Stores user quiz attempts and scores
 */
export interface QuizAttempt {
  id: string
  user_id: string
  module_id: string
  score: number // Percentage 0-100
  total_questions: number
  correct_answers: number
  passed: boolean // true if score >= 70%
  answers: QuizAnswer[] // JSON array
  time_spent_seconds: number | null
  completed_at: string
  created_at: string
}

/**
 * Quiz Answer Structure (stored in QuizAttempt.answers)
 */
export interface QuizAnswer {
  question_id: string
  selected_answer: number
  correct: boolean
}

/**
 * Course Final Quiz Attempts Table
 */
export interface CourseFinalQuizAttempt {
  id: string
  user_id: string
  course_id: string
  score: number
  total_questions: number
  correct_answers: number
  passed: boolean
  answers: QuizAnswer[]
  time_spent_seconds: number | null
  completed_at: string
  created_at: string
}

/**
 * Certificates Table
 * Certificates earned by completing modules or courses
 */
export interface Certificate {
  id: string
  user_id: string
  course_id: string
  module_id: string | null
  type: 'module' | 'course'
  certificate_number: string
  title: string
  description: string | null
  certificate_url: string | null
  certificate_hash: string | null
  nft_token_id: string | null
  nft_contract_address: string | null
  nft_chain: string | null
  nft_tx_hash: string | null
  verification_url: string | null
  qr_code_url: string | null
  issued_at: string
  expires_at: string | null
}

/**
 * User Achievements Table
 * Gamification: badges and achievements
 */
export interface UserAchievement {
  id: string
  user_id: string
  achievement_type: string
  unlocked_at: string
  metadata: any
}

/**
 * User Activity Table
 * Timeline of user activities for dashboard
 */
export interface UserActivity {
  id: string
  user_id: string
  activity_type: string
  related_id: string | null
  created_at: string
  metadata: any
}

/**
 * User Profiles Table
 * Extended user profile with gamification data
 */
export interface UserProfile {
  id: string
  user_id: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  current_streak: number
  longest_streak: number
  last_activity_date: string | null
  total_xp: number
  level: number
  created_at: string
  updated_at: string
}

/**
 * Dashboard Statistics
 * Aggregated stats for the dashboard
 */
export interface DashboardStats {
  totalProgress: number
  activeCourses: number
  completedCourses: number
  completedLessons: number
  totalLessons: number
  hoursStudied: number
  currentStreak: number
  longestStreak: number
  totalXp: number
  level: number
  certificatesEarned: number
}

/**
 * Enrollment with Course Details
 * Includes realProgress calculated from user_progress table
 */
export interface EnrollmentWithCourse extends CourseEnrollment {
  course: Course
  lastLesson?: Lesson
  realProgress?: {
    completedLessons: number
    totalLessons: number
    percentage: number
  }
}

/**
 * Activity with Related Data
 */
export interface ActivityWithDetails extends UserActivity {
  course?: Pick<Course, 'id' | 'title' | 'slug' | 'thumbnail_url'>
  lesson?: Pick<Lesson, 'id' | 'title' | 'slug'>
}

/**
 * Certificate with Course Details
 */
export interface CertificateWithCourse extends Certificate {
  course: Pick<Course, 'id' | 'title' | 'slug' | 'thumbnail_url'>
}

/**
 * Certificate with Module and Course Details
 */
export interface CertificateWithDetails extends Certificate {
  course: Pick<Course, 'id' | 'title' | 'slug' | 'thumbnail_url'>
  module?: Pick<Module, 'id' | 'title' | 'order_index'>
  user: Pick<User, 'id' | 'full_name' | 'email'>
}

/**
 * Quiz Attempt with Questions
 */
export interface QuizAttemptWithQuestions extends QuizAttempt {
  questions: QuizQuestion[]
}

/**
 * Module with Quiz Info
 */
export interface ModuleWithQuiz extends Module {
  quiz_questions: QuizQuestion[]
  user_best_attempt?: QuizAttempt | null
}

/**
 * Achievement Definition
 * Metadata for what each achievement means
 */
export interface AchievementDefinition {
  type: string
  name: string
  description: string
  icon: string
  requirement?: string
  progress?: number
  maxProgress?: number
}

// =====================================================
// DASHBOARD INSERT TYPES
// =====================================================

export type InsertCourseEnrollment = Omit<
  CourseEnrollment,
  'id' | 'enrolled_at' | 'progress_percentage'
>
export type InsertLessonProgress = Omit<
  LessonProgress,
  'id' | 'started_at'
>
export type InsertCertificate = Omit<Certificate, 'id' | 'issued_at'>
export type InsertUserAchievement = Omit<UserAchievement, 'id' | 'unlocked_at'>
export type InsertUserActivity = Omit<UserActivity, 'id' | 'created_at'>
export type InsertUserProfile = Omit<
  UserProfile,
  'id' | 'created_at' | 'updated_at'
>
export type InsertQuizQuestion = Omit<QuizQuestion, 'id' | 'created_at' | 'updated_at'>
export type InsertQuizAttempt = Omit<QuizAttempt, 'id' | 'created_at'>

/**
 * Example usage:
 *
 * // In a component
 * import { Course, CourseWithInstructor } from '@/types/database'
 *
 * const course: CourseWithInstructor = await fetchCourse(id)
 *
 * // In an API route
 * import { ApiResponse, InsertNote } from '@/types/database'
 *
 * export async function POST(request: Request) {
 *   const note: InsertNote = await request.json()
 *   // ...
 *   return Response.json({ data: note } as ApiResponse)
 * }
 */

// =====================================================
// NOTIFICATIONS TYPES
// =====================================================

export type NotificationType =
  | 'beta_granted'
  | 'course_published'
  | 'proposal_active'
  | 'course_completed'
  | 'certificate_issued'
  | 'badge_earned'
  | 'level_up'
  | 'feedback_reply'
  | 'welcome'
  | 'system';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  data: Record<string, unknown>;
  link: string | null;
  created_at: string;
}

export interface NotificationInsert {
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string | null;
  data?: Record<string, unknown>;
}

export interface NotificationsResponse {
  notifications: Notification[];
  unread_count: number;
}


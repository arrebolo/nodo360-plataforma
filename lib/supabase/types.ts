// Tipos para la base de datos de Supabase - Versión simplificada sin Relationships
// para evitar "Type instantiation is excessively deep" errors

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      badges: {
        Row: {
          category: string | null
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          order_index: number
          rarity: string | null
          requirement_type: string | null
          requirement_value: number | null
          slug: string
          title: string
        }
        Insert: {
          category?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          order_index: number
          rarity?: string | null
          requirement_type?: string | null
          requirement_value?: number | null
          slug: string
          title: string
        }
        Update: {
          category?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          order_index?: number
          rarity?: string | null
          requirement_type?: string | null
          requirement_value?: number | null
          slug?: string
          title?: string
        }
      }
      bookmarks: {
        Row: {
          created_at: string
          id: string
          lesson_id: string
          note: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lesson_id: string
          note?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lesson_id?: string
          note?: string | null
          user_id?: string
        }
      }
      certificates: {
        Row: {
          certificate_number: string
          course_id: string | null
          created_at: string
          description: string | null
          id: string
          issued_at: string
          metadata: Json | null
          module_id: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          certificate_number: string
          course_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          issued_at?: string
          metadata?: Json | null
          module_id?: string | null
          title: string
          type?: string
          updated_at?: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          certificate_number?: string
          course_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          issued_at?: string
          metadata?: Json | null
          module_id?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
          verified_at?: string | null
        }
      }
      course_enrollments: {
        Row: {
          completed_at: string | null
          course_id: string
          created_at: string
          enrolled_at: string
          id: string
          last_accessed_at: string | null
          progress_percentage: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          created_at?: string
          enrolled_at?: string
          id?: string
          last_accessed_at?: string | null
          progress_percentage?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          created_at?: string
          enrolled_at?: string
          id?: string
          last_accessed_at?: string | null
          progress_percentage?: number
          updated_at?: string
          user_id?: string
        }
      }
      courses: {
        Row: {
          id: string
          slug: string
          title: string
          subtitle: string | null
          description: string | null
          long_description: string | null
          thumbnail_url: string | null
          banner_url: string | null
          level: 'beginner' | 'intermediate' | 'advanced'
          status: 'draft' | 'published' | 'archived'
          price: number
          is_free: boolean
          is_premium: boolean
          instructor_id: string | null
          total_modules: number
          total_lessons: number
          total_duration_minutes: number
          enrolled_count: number
          meta_title: string | null
          meta_description: string | null
          duration_label: string | null
          is_certifiable: boolean
          order_index: number
          learning_objectives: string[] | null
          requirements: string[] | null
          target_audience: string | null
          created_at: string
          updated_at: string
          published_at: string | null
        }
        Insert: {
          id?: string
          slug: string
          title: string
          subtitle?: string | null
          description?: string | null
          long_description?: string | null
          thumbnail_url?: string | null
          banner_url?: string | null
          level?: 'beginner' | 'intermediate' | 'advanced'
          status?: 'draft' | 'published' | 'archived'
          price?: number
          is_free?: boolean
          is_premium?: boolean
          instructor_id?: string | null
          total_modules?: number
          total_lessons?: number
          total_duration_minutes?: number
          enrolled_count?: number
          meta_title?: string | null
          meta_description?: string | null
          duration_label?: string | null
          is_certifiable?: boolean
          order_index?: number
          learning_objectives?: string[] | null
          requirements?: string[] | null
          target_audience?: string | null
          created_at?: string
          updated_at?: string
          published_at?: string | null
        }
        Update: {
          id?: string
          slug?: string
          title?: string
          subtitle?: string | null
          description?: string | null
          long_description?: string | null
          thumbnail_url?: string | null
          banner_url?: string | null
          level?: 'beginner' | 'intermediate' | 'advanced'
          status?: 'draft' | 'published' | 'archived'
          price?: number
          is_free?: boolean
          is_premium?: boolean
          instructor_id?: string | null
          total_modules?: number
          total_lessons?: number
          total_duration_minutes?: number
          enrolled_count?: number
          meta_title?: string | null
          meta_description?: string | null
          duration_label?: string | null
          is_certifiable?: boolean
          order_index?: number
          learning_objectives?: string[] | null
          requirements?: string[] | null
          target_audience?: string | null
          created_at?: string
          updated_at?: string
          published_at?: string | null
        }
      }
      educators: {
        Row: {
          bio: string | null
          created_at: string
          hourly_rate: number | null
          id: string
          is_active: boolean
          linkedin_url: string | null
          location: string | null
          slug: string
          total_sessions: number
          twitter_url: string | null
          updated_at: string
          user_id: string
          years_experience: number | null
        }
        Insert: {
          bio?: string | null
          created_at?: string
          hourly_rate?: number | null
          id?: string
          is_active?: boolean
          linkedin_url?: string | null
          location?: string | null
          slug: string
          total_sessions?: number
          twitter_url?: string | null
          updated_at?: string
          user_id: string
          years_experience?: number | null
        }
        Update: {
          bio?: string | null
          created_at?: string
          hourly_rate?: number | null
          id?: string
          is_active?: boolean
          linkedin_url?: string | null
          location?: string | null
          slug?: string
          total_sessions?: number
          twitter_url?: string | null
          updated_at?: string
          user_id?: string
          years_experience?: number | null
        }
      }
      lessons: {
        Row: {
          id: string
          module_id: string
          title: string
          slug: string
          description: string | null
          order_index: number
          content: string | null
          video_url: string | null
          video_duration_minutes: number | null
          slides_url: string | null
          resources_url: string | null
          is_free_preview: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          module_id: string
          title: string
          slug: string
          description?: string | null
          order_index?: number
          content?: string | null
          video_url?: string | null
          video_duration_minutes?: number | null
          slides_url?: string | null
          resources_url?: string | null
          is_free_preview?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          module_id?: string
          title?: string
          slug?: string
          description?: string | null
          order_index?: number
          content?: string | null
          video_url?: string | null
          video_duration_minutes?: number | null
          slides_url?: string | null
          resources_url?: string | null
          is_free_preview?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      modules: {
        Row: {
          id: string
          course_id: string
          title: string
          slug: string | null
          description: string | null
          order_index: number
          total_lessons: number
          total_duration_minutes: number
          requires_quiz: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          course_id: string
          title: string
          slug?: string | null
          description?: string | null
          order_index?: number
          total_lessons?: number
          total_duration_minutes?: number
          requires_quiz?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          title?: string
          slug?: string | null
          description?: string | null
          order_index?: number
          total_lessons?: number
          total_duration_minutes?: number
          requires_quiz?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      quiz_attempts: {
        Row: {
          answers: Json
          completed_at: string
          correct_answers: number
          created_at: string
          id: string
          module_id: string
          passed: boolean
          score: number
          time_spent_seconds: number | null
          total_questions: number
          user_id: string
        }
        Insert: {
          answers: Json
          completed_at?: string
          correct_answers: number
          created_at?: string
          id?: string
          module_id: string
          passed?: boolean
          score: number
          time_spent_seconds?: number | null
          total_questions: number
          user_id: string
        }
        Update: {
          answers?: Json
          completed_at?: string
          correct_answers?: number
          created_at?: string
          id?: string
          module_id?: string
          passed?: boolean
          score?: number
          time_spent_seconds?: number | null
          total_questions?: number
          user_id?: string
        }
      }
      quiz_questions: {
        Row: {
          correct_answer: number
          created_at: string
          difficulty: string | null
          explanation: string | null
          id: string
          module_id: string
          options: Json
          order_index: number
          question: string
          updated_at: string
        }
        Insert: {
          correct_answer: number
          created_at?: string
          difficulty?: string | null
          explanation?: string | null
          id?: string
          module_id: string
          options: Json
          order_index?: number
          question: string
          updated_at?: string
        }
        Update: {
          correct_answer?: number
          created_at?: string
          difficulty?: string | null
          explanation?: string | null
          id?: string
          module_id?: string
          options?: Json
          order_index?: number
          question?: string
          updated_at?: string
        }
      }
      user_badges: {
        Row: {
          badge_id: string
          created_at: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          created_at?: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          created_at?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
      }
      user_gamification_stats: {
        Row: {
          courses_completed: number
          created_at: string
          current_level: number
          current_streak: number
          id: string
          last_activity_at: string | null
          lessons_completed: number
          longest_streak: number
          total_xp: number
          updated_at: string
          user_id: string
          xp_to_next_level: number
        }
        Insert: {
          courses_completed?: number
          created_at?: string
          current_level?: number
          current_streak?: number
          id?: string
          last_activity_at?: string | null
          lessons_completed?: number
          longest_streak?: number
          total_xp?: number
          updated_at?: string
          user_id: string
          xp_to_next_level?: number
        }
        Update: {
          courses_completed?: number
          created_at?: string
          current_level?: number
          current_streak?: number
          id?: string
          last_activity_at?: string | null
          lessons_completed?: number
          longest_streak?: number
          total_xp?: number
          updated_at?: string
          user_id?: string
          xp_to_next_level?: number
        }
      }
      user_notes: {
        Row: {
          content: string
          created_at: string
          id: string
          lesson_id: string
          note_text: string | null
          updated_at: string
          user_id: string
          video_timestamp_seconds: number | null
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          lesson_id: string
          note_text?: string | null
          updated_at?: string
          user_id: string
          video_timestamp_seconds?: number | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          lesson_id?: string
          note_text?: string | null
          updated_at?: string
          user_id?: string
          video_timestamp_seconds?: number | null
        }
      }
      user_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          is_completed: boolean
          lesson_id: string
          updated_at: string
          user_id: string
          watch_time_seconds: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          lesson_id: string
          updated_at?: string
          user_id: string
          watch_time_seconds?: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          lesson_id?: string
          updated_at?: string
          user_id?: string
          watch_time_seconds?: number
        }
      }
      users: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          location: string | null
          role: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          location?: string | null
          role?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          location?: string | null
          role?: string | null
          updated_at?: string
          website?: string | null
        }
      }
      xp_events: {
        Row: {
          created_at: string
          description: string | null
          event_type: string
          id: string
          lesson_id: string | null
          user_id: string
          xp_amount: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_type: string
          id?: string
          lesson_id?: string | null
          user_id: string
          xp_amount: number
        }
        Update: {
          created_at?: string
          description?: string | null
          event_type?: string
          id?: string
          lesson_id?: string | null
          user_id?: string
          xp_amount?: number
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

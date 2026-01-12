export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
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
        Relationships: []
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
        Relationships: [
          {
            foreignKeyName: "bookmarks_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookmarks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          certificate_hash: string | null
          certificate_number: string
          certificate_url: string | null
          course_id: string
          created_at: string
          description: string | null
          expires_at: string | null
          id: string
          issued_at: string
          module_id: string | null
          nft_chain: string | null
          nft_contract_address: string | null
          nft_token_id: string | null
          nft_tx_hash: string | null
          qr_code_url: string | null
          title: string
          type: Database["public"]["Enums"]["certificate_type"]
          user_id: string
          verification_url: string | null
        }
        Insert: {
          certificate_hash?: string | null
          certificate_number: string
          certificate_url?: string | null
          course_id: string
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          issued_at?: string
          module_id?: string | null
          nft_chain?: string | null
          nft_contract_address?: string | null
          nft_token_id?: string | null
          nft_tx_hash?: string | null
          qr_code_url?: string | null
          title: string
          type: Database["public"]["Enums"]["certificate_type"]
          user_id: string
          verification_url?: string | null
        }
        Update: {
          certificate_hash?: string | null
          certificate_number?: string
          certificate_url?: string | null
          course_id?: string
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          issued_at?: string
          module_id?: string | null
          nft_chain?: string | null
          nft_contract_address?: string | null
          nft_token_id?: string | null
          nft_tx_hash?: string | null
          qr_code_url?: string | null
          title?: string
          type?: Database["public"]["Enums"]["certificate_type"]
          user_id?: string
          verification_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      course_certificates: {
        Row: {
          code: string
          course_id: string
          id: string
          issued_at: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          code: string
          course_id: string
          id?: string
          issued_at?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          code?: string
          course_id?: string
          id?: string
          issued_at?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_enrollments: {
        Row: {
          completed_at: string | null
          course_id: string
          created_at: string
          enrolled_at: string
          id: string
          last_accessed_at: string | null
          progress_percentage: number | null
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
          progress_percentage?: number | null
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
          progress_percentage?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      course_quizzes: {
        Row: {
          correct_option: number
          course_id: string
          created_at: string | null
          id: string
          options: string[]
          order_index: number
          question: string
        }
        Insert: {
          correct_option: number
          course_id: string
          created_at?: string | null
          id?: string
          options: string[]
          order_index?: number
          question: string
        }
        Update: {
          correct_option?: number
          course_id?: string
          created_at?: string | null
          id?: string
          options?: string[]
          order_index?: number
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_quizzes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          banner_url: string | null
          created_at: string
          description: string | null
          difficulty_level: string | null
          duration_label: string | null
          enrolled_count: number | null
          id: string
          instructor_id: string | null
          is_certifiable: boolean
          is_free: boolean
          is_premium: boolean | null
          learning_objectives: string[] | null
          level: Database["public"]["Enums"]["course_level"]
          long_description: string | null
          meta_description: string | null
          meta_title: string | null
          price: number | null
          published_at: string | null
          requirements: string[] | null
          slug: string
          status: Database["public"]["Enums"]["course_status"]
          subtitle: string | null
          target_audience: string | null
          thumbnail_url: string | null
          title: string
          topic_category: string | null
          total_duration_minutes: number | null
          total_lessons: number | null
          total_modules: number | null
          updated_at: string
        }
        Insert: {
          banner_url?: string | null
          created_at?: string
          description?: string | null
          difficulty_level?: string | null
          duration_label?: string | null
          enrolled_count?: number | null
          id?: string
          instructor_id?: string | null
          is_certifiable?: boolean
          is_free?: boolean
          is_premium?: boolean | null
          learning_objectives?: string[] | null
          level?: Database["public"]["Enums"]["course_level"]
          long_description?: string | null
          meta_description?: string | null
          meta_title?: string | null
          price?: number | null
          published_at?: string | null
          requirements?: string[] | null
          slug: string
          status?: Database["public"]["Enums"]["course_status"]
          subtitle?: string | null
          target_audience?: string | null
          thumbnail_url?: string | null
          title: string
          topic_category?: string | null
          total_duration_minutes?: number | null
          total_lessons?: number | null
          total_modules?: number | null
          updated_at?: string
        }
        Update: {
          banner_url?: string | null
          created_at?: string
          description?: string | null
          difficulty_level?: string | null
          duration_label?: string | null
          enrolled_count?: number | null
          id?: string
          instructor_id?: string | null
          is_certifiable?: boolean
          is_free?: boolean
          is_premium?: boolean | null
          learning_objectives?: string[] | null
          level?: Database["public"]["Enums"]["course_level"]
          long_description?: string | null
          meta_description?: string | null
          meta_title?: string | null
          price?: number | null
          published_at?: string | null
          requirements?: string[] | null
          slug?: string
          status?: Database["public"]["Enums"]["course_status"]
          subtitle?: string | null
          target_audience?: string | null
          thumbnail_url?: string | null
          title?: string
          topic_category?: string | null
          total_duration_minutes?: number | null
          total_lessons?: number | null
          total_modules?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      governance_admin_actions: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          id: string
          is_public: boolean | null
          new_status: string | null
          previous_status: string | null
          proposal_id: string
          reason: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          id?: string
          is_public?: boolean | null
          new_status?: string | null
          previous_status?: string | null
          proposal_id: string
          reason?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          id?: string
          is_public?: boolean | null
          new_status?: string | null
          previous_status?: string | null
          proposal_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "governance_admin_actions_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "governance_admin_actions_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "governance_proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "governance_admin_actions_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals_with_details"
            referencedColumns: ["id"]
          },
        ]
      }
      governance_categories: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          order_index: number | null
          proposal_level: number | null
          slug: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          order_index?: number | null
          proposal_level?: number | null
          slug: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          order_index?: number | null
          proposal_level?: number | null
          slug?: string
        }
        Relationships: []
      }
      governance_proposals: {
        Row: {
          approval_threshold: number | null
          author_id: string
          category_id: string | null
          created_at: string | null
          description: string
          detailed_content: string | null
          id: string
          implementation_notes: string | null
          implemented_at: string | null
          proposal_level: number
          quorum_required: number | null
          slug: string
          status: string
          tags: string[] | null
          title: string
          total_gpower_abstain: number | null
          total_gpower_against: number | null
          total_gpower_for: number | null
          total_votes: number | null
          updated_at: string | null
          validated_at: string | null
          validated_by: string | null
          validation_notes: string | null
          voting_ends_at: string | null
          voting_starts_at: string | null
        }
        Insert: {
          approval_threshold?: number | null
          author_id: string
          category_id?: string | null
          created_at?: string | null
          description: string
          detailed_content?: string | null
          id?: string
          implementation_notes?: string | null
          implemented_at?: string | null
          proposal_level?: number
          quorum_required?: number | null
          slug: string
          status?: string
          tags?: string[] | null
          title: string
          total_gpower_abstain?: number | null
          total_gpower_against?: number | null
          total_gpower_for?: number | null
          total_votes?: number | null
          updated_at?: string | null
          validated_at?: string | null
          validated_by?: string | null
          validation_notes?: string | null
          voting_ends_at?: string | null
          voting_starts_at?: string | null
        }
        Update: {
          approval_threshold?: number | null
          author_id?: string
          category_id?: string | null
          created_at?: string | null
          description?: string
          detailed_content?: string | null
          id?: string
          implementation_notes?: string | null
          implemented_at?: string | null
          proposal_level?: number
          quorum_required?: number | null
          slug?: string
          status?: string
          tags?: string[] | null
          title?: string
          total_gpower_abstain?: number | null
          total_gpower_against?: number | null
          total_gpower_for?: number | null
          total_votes?: number | null
          updated_at?: string | null
          validated_at?: string | null
          validated_by?: string | null
          validation_notes?: string | null
          voting_ends_at?: string | null
          voting_starts_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "governance_proposals_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "governance_proposals_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "governance_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "governance_proposals_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      governance_votes: {
        Row: {
          badges_count_at_vote: number | null
          comment: string | null
          created_at: string | null
          gpower_used: number
          id: string
          proposal_id: string
          reputation_at_vote: number | null
          vote: string
          voter_id: string
          xp_at_vote: number
        }
        Insert: {
          badges_count_at_vote?: number | null
          comment?: string | null
          created_at?: string | null
          gpower_used: number
          id?: string
          proposal_id: string
          reputation_at_vote?: number | null
          vote: string
          voter_id: string
          xp_at_vote: number
        }
        Update: {
          badges_count_at_vote?: number | null
          comment?: string | null
          created_at?: string | null
          gpower_used?: number
          id?: string
          proposal_id?: string
          reputation_at_vote?: number | null
          vote?: string
          voter_id?: string
          xp_at_vote?: number
        }
        Relationships: [
          {
            foreignKeyName: "governance_votes_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "governance_proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "governance_votes_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "governance_votes_voter_id_fkey"
            columns: ["voter_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_path_courses: {
        Row: {
          course_id: string
          created_at: string
          id: string
          is_required: boolean
          learning_path_id: string
          position: number
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          is_required?: boolean
          learning_path_id: string
          position?: number
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          is_required?: boolean
          learning_path_id?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "learning_path_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_path_courses_learning_path_id_fkey"
            columns: ["learning_path_id"]
            isOneToOne: false
            referencedRelation: "learning_paths"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_paths: {
        Row: {
          created_at: string
          emoji: string | null
          id: string
          is_active: boolean
          long_description: string | null
          name: string
          position: number
          short_description: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          emoji?: string | null
          id?: string
          is_active?: boolean
          long_description?: string | null
          name: string
          position?: number
          short_description?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          emoji?: string | null
          id?: string
          is_active?: boolean
          long_description?: string | null
          name?: string
          position?: number
          short_description?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      lessons: {
        Row: {
          attachments: Json | null
          content: string | null
          content_json: Json | null
          course_id: string
          created_at: string
          description: string | null
          id: string
          is_free_preview: boolean | null
          module_id: string
          order_index: number
          pdf_url: string | null
          resources_url: string | null
          slides_url: string | null
          slug: string
          title: string
          updated_at: string
          video_duration_minutes: number | null
          video_url: string | null
        }
        Insert: {
          attachments?: Json | null
          content?: string | null
          content_json?: Json | null
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_free_preview?: boolean | null
          module_id: string
          order_index: number
          pdf_url?: string | null
          resources_url?: string | null
          slides_url?: string | null
          slug: string
          title: string
          updated_at?: string
          video_duration_minutes?: number | null
          video_url?: string | null
        }
        Update: {
          attachments?: Json | null
          content?: string | null
          content_json?: Json | null
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_free_preview?: boolean | null
          module_id?: string
          order_index?: number
          pdf_url?: string | null
          resources_url?: string | null
          slides_url?: string | null
          slug?: string
          title?: string
          updated_at?: string
          video_duration_minutes?: number | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          id: string
          order_index: number
          requires_quiz: boolean
          slug: string | null
          title: string
          total_duration_minutes: number | null
          total_lessons: number | null
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          order_index: number
          requires_quiz?: boolean
          slug?: string | null
          title: string
          total_duration_minutes?: number | null
          total_lessons?: number | null
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number
          requires_quiz?: boolean
          slug?: string | null
          title?: string
          total_duration_minutes?: number | null
          total_lessons?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          content: string
          created_at: string
          id: string
          lesson_id: string
          updated_at: string
          user_id: string
          video_timestamp_seconds: number | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          lesson_id: string
          updated_at?: string
          user_id: string
          video_timestamp_seconds?: number | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          lesson_id?: string
          updated_at?: string
          user_id?: string
          video_timestamp_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "notes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_lesson_notes: {
        Row: {
          id: string
          user_id: string
          course_id: string
          lesson_id: string
          content: string
          updated_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          course_id: string
          lesson_id: string
          content?: string
          updated_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          course_id?: string
          lesson_id?: string
          content?: string
          updated_at?: string
          created_at?: string
        }
        Relationships: []
      }
      course_final_quiz_attempts: {
        Row: {
          id: string
          user_id: string
          course_id: string
          score: number
          total_questions: number
          correct_answers: number
          passed: boolean
          answers: Json
          time_spent_seconds: number | null
          completed_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          course_id: string
          score: number
          total_questions: number
          correct_answers: number
          passed?: boolean
          answers: Json
          time_spent_seconds?: number | null
          completed_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          course_id?: string
          score?: number
          total_questions?: number
          correct_answers?: number
          passed?: boolean
          answers?: Json
          time_spent_seconds?: number | null
          completed_at?: string
          created_at?: string
        }
        Relationships: []
      }
      path_courses: {
        Row: {
          course_id: string
          created_at: string
          id: string
          is_required: boolean | null
          order_index: number
          path_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          is_required?: boolean | null
          order_index: number
          path_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          is_required?: boolean | null
          order_index?: number
          path_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "path_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
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
          passed: boolean
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
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
          points: number | null
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
          order_index: number
          points?: number | null
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
          points?: number | null
          question?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      reputation_history: {
        Row: {
          change_amount: number
          created_at: string | null
          id: string
          reason: string
          related_proposal_id: string | null
          user_id: string
        }
        Insert: {
          change_amount: number
          created_at?: string | null
          id?: string
          reason: string
          related_proposal_id?: string | null
          user_id: string
        }
        Update: {
          change_amount?: number
          created_at?: string | null
          id?: string
          reason?: string
          related_proposal_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reputation_history_related_proposal_id_fkey"
            columns: ["related_proposal_id"]
            isOneToOne: false
            referencedRelation: "governance_proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reputation_history_related_proposal_id_fkey"
            columns: ["related_proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reputation_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_id: string
          id: string
          is_featured: boolean | null
          unlocked_at: string
          user_id: string
        }
        Insert: {
          badge_id: string
          id?: string
          is_featured?: boolean | null
          unlocked_at?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          id?: string
          is_featured?: boolean | null
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_course_progress: {
        Row: {
          course_id: string
          id: string
          progress: number
          updated_at: string
          user_id: string
        }
        Insert: {
          course_id: string
          id?: string
          progress?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          course_id?: string
          id?: string
          progress?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_course_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_gamification_stats: {
        Row: {
          certificates_earned: number
          courses_completed: number
          created_at: string
          current_level: number
          current_streak: number
          id: string
          last_activity_date: string | null
          lessons_completed: number
          longest_streak: number
          total_badges: number
          total_xp: number
          updated_at: string
          user_id: string
          xp_to_next_level: number
        }
        Insert: {
          certificates_earned?: number
          courses_completed?: number
          created_at?: string
          current_level?: number
          current_streak?: number
          id?: string
          last_activity_date?: string | null
          lessons_completed?: number
          longest_streak?: number
          total_badges?: number
          total_xp?: number
          updated_at?: string
          user_id: string
          xp_to_next_level?: number
        }
        Update: {
          certificates_earned?: number
          courses_completed?: number
          created_at?: string
          current_level?: number
          current_streak?: number
          id?: string
          last_activity_date?: string | null
          lessons_completed?: number
          longest_streak?: number
          total_badges?: number
          total_xp?: number
          updated_at?: string
          user_id?: string
          xp_to_next_level?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_gamification_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_lesson_progress: {
        Row: {
          completed_at: string | null
          id: string
          lesson_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          lesson_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          lesson_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notes: {
        Row: {
          created_at: string | null
          id: string
          lesson_id: string | null
          note_text: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          lesson_id?: string | null
          note_text?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          lesson_id?: string | null
          note_text?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_notes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          is_completed: boolean
          last_position_seconds: number | null
          lesson_id: string
          updated_at: string
          user_id: string
          watch_time_seconds: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          last_position_seconds?: number | null
          lesson_id: string
          updated_at?: string
          user_id: string
          watch_time_seconds?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          last_position_seconds?: number | null
          lesson_id?: string
          updated_at?: string
          user_id?: string
          watch_time_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_reputation: {
        Row: {
          courses_completed: number | null
          created_at: string | null
          helpful_votes: number | null
          id: string
          mentoring_sessions: number | null
          proposals_created: number | null
          proposals_passed: number | null
          reputation_points: number | null
          updated_at: string | null
          user_id: string
          votes_cast: number | null
          warnings: number | null
        }
        Insert: {
          courses_completed?: number | null
          created_at?: string | null
          helpful_votes?: number | null
          id?: string
          mentoring_sessions?: number | null
          proposals_created?: number | null
          proposals_passed?: number | null
          reputation_points?: number | null
          updated_at?: string | null
          user_id: string
          votes_cast?: number | null
          warnings?: number | null
        }
        Update: {
          courses_completed?: number | null
          created_at?: string | null
          helpful_votes?: number | null
          id?: string
          mentoring_sessions?: number | null
          proposals_created?: number | null
          proposals_passed?: number | null
          reputation_points?: number | null
          updated_at?: string | null
          user_id?: string
          votes_cast?: number | null
          warnings?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_reputation_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_selected_paths: {
        Row: {
          id: string
          is_active: boolean | null
          path_id: string | null
          selected_at: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          is_active?: boolean | null
          path_id?: string | null
          selected_at?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          is_active?: boolean | null
          path_id?: string | null
          selected_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string
          full_name: string | null
          github: string | null
          id: string
          last_seen_at: string | null
          linkedin: string | null
          role: Database["public"]["Enums"]["user_role"]
          twitter: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          github?: string | null
          id: string
          last_seen_at?: string | null
          linkedin?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          twitter?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          github?: string | null
          id?: string
          last_seen_at?: string | null
          linkedin?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          twitter?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      xp_actions: {
        Row: {
          action_name: string
          created_at: string
          description: string | null
          is_active: boolean | null
          slug: string
          xp_amount: number
        }
        Insert: {
          action_name: string
          created_at?: string
          description?: string | null
          is_active?: boolean | null
          slug: string
          xp_amount: number
        }
        Update: {
          action_name?: string
          created_at?: string
          description?: string | null
          is_active?: boolean | null
          slug?: string
          xp_amount?: number
        }
        Relationships: []
      }
      xp_events: {
        Row: {
          course_id: string | null
          created_at: string
          description: string | null
          event_type: string
          id: string
          lesson_id: string | null
          metadata: Json
          related_id: string | null
          user_id: string
          xp_amount: number | null
          xp_earned: number
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          description?: string | null
          event_type: string
          id?: string
          lesson_id?: string | null
          metadata?: Json
          related_id?: string | null
          user_id: string
          xp_amount?: number | null
          xp_earned?: number
        }
        Update: {
          course_id?: string | null
          created_at?: string
          description?: string | null
          event_type?: string
          id?: string
          lesson_id?: string | null
          metadata?: Json
          related_id?: string | null
          user_id?: string
          xp_amount?: number | null
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "xp_events_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "xp_events_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "xp_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      proposals_with_details: {
        Row: {
          approval_threshold: number | null
          author_avatar: string | null
          author_gpower: number | null
          author_id: string | null
          author_name: string | null
          author_role: Database["public"]["Enums"]["user_role"] | null
          category_color: string | null
          category_icon: string | null
          category_id: string | null
          category_name: string | null
          created_at: string | null
          description: string | null
          detailed_content: string | null
          id: string | null
          implementation_notes: string | null
          implemented_at: string | null
          proposal_level: number | null
          quorum_required: number | null
          seconds_remaining: number | null
          slug: string | null
          status: string | null
          tags: string[] | null
          title: string | null
          total_gpower_abstain: number | null
          total_gpower_against: number | null
          total_gpower_for: number | null
          total_votes: number | null
          updated_at: string | null
          validated_at: string | null
          validated_by: string | null
          validation_notes: string | null
          voting_ends_at: string | null
          voting_starts_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "governance_proposals_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "governance_proposals_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "governance_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "governance_proposals_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      calculate_gpower: { Args: { p_user_id: string }; Returns: number }
      calculate_level_from_xp: { Args: { xp: number }; Returns: number }
      calculate_xp_to_next_level: {
        Args: { current_level: number }
        Returns: number
      }
      can_create_proposal: {
        Args: { p_level: number; p_user_id: string }
        Returns: boolean
      }
      can_validate_proposal: {
        Args: { p_proposal_level: number; p_user_id: string }
        Returns: boolean
      }
      generate_certificate_number: { Args: never; Returns: string }
      get_best_quiz_attempt: {
        Args: { p_module_id: string; p_user_id: string }
        Returns: {
          completed_at: string
          id: string
          passed: boolean
          score: number
        }[]
      }
      has_passed_module_quiz: {
        Args: { p_module_id: string; p_user_id: string }
        Returns: boolean
      }
      is_module_accessible: {
        Args: { p_module_id: string; p_user_id: string }
        Returns: boolean
      }
      issue_certificate_if_course_completed: {
        Args: { p_lesson_id: string; p_user_id: string }
        Returns: {
          certificate_code: string
          certificate_created: boolean
          certificate_id: string
          course_id: string
        }[]
      }
      issue_module_certificate: {
        Args: {
          p_module_id: string
          p_quiz_attempt_id: string
          p_user_id: string
        }
        Returns: string
      }
      recalculate_user_stats: { Args: { p_user_id: string }; Returns: Json }
      reset_course_progress: {
        Args: {
          p_course_id: string
          p_delete_certificate?: boolean
          p_user_id: string
        }
        Returns: Json
      }
      save_lesson_progress: {
        Args: { p_lesson_id: string; p_user_id: string }
        Returns: Json
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      certificate_type: "module" | "course"
      course_level: "beginner" | "intermediate" | "advanced"
      course_status: "draft" | "published" | "archived" | "coming_soon"
      user_role: "student" | "instructor" | "admin" | "mentor" | "council"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      certificate_type: ["module", "course"],
      course_level: ["beginner", "intermediate", "advanced"],
      course_status: ["draft", "published", "archived", "coming_soon"],
      user_role: ["student", "instructor", "admin", "mentor", "council"],
    },
  },
} as const



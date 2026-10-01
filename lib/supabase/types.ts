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
    PostgrestVersion: "14.5"
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
      beta_feedback: {
        Row: {
          created_at: string
          id: string
          message: string
          page_url: string | null
          status: string | null
          user_email: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          page_url?: string | null
          status?: string | null
          user_email: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          page_url?: string | null
          status?: string | null
          user_email?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "beta_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "beta_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_incident_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "beta_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookmarks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_incident_summary"
            referencedColumns: ["user_id"]
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
          revoked_at: string | null
          revoked_reason: string | null
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
          revoked_at?: string | null
          revoked_reason?: string | null
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
          revoked_at?: string | null
          revoked_reason?: string | null
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
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_incident_summary"
            referencedColumns: ["user_id"]
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
      conversations: {
        Row: {
          created_at: string | null
          id: string
          last_message_at: string | null
          participant_1: string
          participant_2: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          participant_1: string
          participant_2: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          participant_1?: string
          participant_2?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_participant_1_fkey"
            columns: ["participant_1"]
            isOneToOne: false
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_participant_1_fkey"
            columns: ["participant_1"]
            isOneToOne: false
            referencedRelation: "user_incident_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "conversations_participant_1_fkey"
            columns: ["participant_1"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_participant_2_fkey"
            columns: ["participant_2"]
            isOneToOne: false
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_participant_2_fkey"
            columns: ["participant_2"]
            isOneToOne: false
            referencedRelation: "user_incident_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "conversations_participant_2_fkey"
            columns: ["participant_2"]
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
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_incident_summary"
            referencedColumns: ["user_id"]
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
      course_final_quiz_attempts: {
        Row: {
          completed_at: string | null
          course_id: string
          created_at: string | null
          id: string
          passed: boolean
          score: number
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          created_at?: string | null
          id?: string
          passed?: boolean
          score?: number
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          created_at?: string | null
          id?: string
          passed?: boolean
          score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_final_quiz_attempts_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_purchases: {
        Row: {
          course_id: string
          created_at: string
          id: string
          original_price_cents: number | null
          payment_id: string | null
          payment_provider: string | null
          price_cents: number
          purchased_at: string
          refunded_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          original_price_cents?: number | null
          payment_id?: string | null
          payment_provider?: string | null
          price_cents: number
          purchased_at?: string
          refunded_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          original_price_cents?: number | null
          payment_id?: string | null
          payment_provider?: string | null
          price_cents?: number
          purchased_at?: string
          refunded_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_purchases_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_incident_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "course_purchases_user_id_fkey"
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
      course_reviews: {
        Row: {
          comment: string | null
          course_id: string
          created_at: string | null
          id: string
          mentor_id: string
          updated_at: string | null
          vote: string
        }
        Insert: {
          comment?: string | null
          course_id: string
          created_at?: string | null
          id?: string
          mentor_id: string
          updated_at?: string | null
          vote: string
        }
        Update: {
          comment?: string | null
          course_id?: string
          created_at?: string | null
          id?: string
          mentor_id?: string
          updated_at?: string | null
          vote?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_reviews_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_reviews_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_reviews_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "user_incident_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "course_reviews_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "users"
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
          has_final_quiz: boolean | null
          id: string
          instructor_id: string | null
          is_certifiable: boolean
          is_free: boolean
          is_premium: boolean | null
          jurisdiccion: string | null
          learning_objectives: string[] | null
          level: Database["public"]["Enums"]["course_level"]
          long_description: string | null
          meta_description: string | null
          meta_title: string | null
          owner_id: string | null
          owner_role: string | null
          price: number | null
          published_at: string | null
          rejection_reason: string | null
          requirements: string[] | null
          review_status: string | null
          slug: string
          specialty_id: string | null
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
          has_final_quiz?: boolean | null
          id?: string
          instructor_id?: string | null
          is_certifiable?: boolean
          is_free?: boolean
          is_premium?: boolean | null
          jurisdiccion?: string | null
          learning_objectives?: string[] | null
          level?: Database["public"]["Enums"]["course_level"]
          long_description?: string | null
          meta_description?: string | null
          meta_title?: string | null
          owner_id?: string | null
          owner_role?: string | null
          price?: number | null
          published_at?: string | null
          rejection_reason?: string | null
          requirements?: string[] | null
          review_status?: string | null
          slug: string
          specialty_id?: string | null
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
          has_final_quiz?: boolean | null
          id?: string
          instructor_id?: string | null
          is_certifiable?: boolean
          is_free?: boolean
          is_premium?: boolean | null
          jurisdiccion?: string | null
          learning_objectives?: string[] | null
          level?: Database["public"]["Enums"]["course_level"]
          long_description?: string | null
          meta_description?: string | null
          meta_title?: string | null
          owner_id?: string | null
          owner_role?: string | null
          price?: number | null
          published_at?: string | null
          rejection_reason?: string | null
          requirements?: string[] | null
          review_status?: string | null
          slug?: string
          specialty_id?: string | null
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
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "user_incident_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "courses_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_jurisdiccion_fkey"
            columns: ["jurisdiccion"]
            isOneToOne: false
            referencedRelation: "jurisdicciones"
            referencedColumns: ["codigo"]
          },
          {
            foreignKeyName: "courses_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "user_incident_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "courses_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "especialidades_publicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "instructor_specialties"
            referencedColumns: ["id"]
          },
        ]
      }
      entitlements: {
        Row: {
          created_at: string
          expires_at: string | null
          granted_by: string | null
          id: string
          is_active: boolean
          reason: string | null
          starts_at: string
          target_id: string | null
          type: Database["public"]["Enums"]["entitlement_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean
          reason?: string | null
          starts_at?: string
          target_id?: string | null
          type?: Database["public"]["Enums"]["entitlement_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean
          reason?: string | null
          starts_at?: string
          target_id?: string | null
          type?: Database["public"]["Enums"]["entitlement_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entitlements_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entitlements_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "user_incident_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "entitlements_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entitlements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entitlements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_incident_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "entitlements_user_id_fkey"
            columns: ["user_id"]
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
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "governance_admin_actions_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "user_incident_summary"
            referencedColumns: ["user_id"]
          },
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
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "governance_proposals_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "user_incident_summary"
            referencedColumns: ["user_id"]
          },
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
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "governance_proposals_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "user_incident_summary"
            referencedColumns: ["user_id"]
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
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "governance_votes_voter_id_fkey"
            columns: ["voter_id"]
            isOneToOne: false
            referencedRelation: "user_incident_summary"
            referencedColumns: ["user_id"]
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
      instructor_certifications: {
        Row: {
          accreditation_ref: string | null
          accreditation_type: string | null
          accreditation_verified_at: string | null
          anunciado_el: string | null
          attempt_id: string | null
          certification_number: string
          consentimiento_anuncio: boolean
          consentimiento_anuncio_el: string | null
          created_at: string
          evaluator_id: string | null
          evaluator_is_external: boolean
          evaluator_notes: string | null
          exam_id: string | null
          expires_at: string | null
          id: string
          issued_at: string | null
          jurisdiccion: string | null
          learning_path_id: string | null
          oral_result: string | null
          practical_result: string | null
          rechazada_el: string | null
          renewal_warning_sent: boolean | null
          renewed_at: string | null
          revoked_at: string | null
          revoked_reason: string | null
          specialty_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          accreditation_ref?: string | null
          accreditation_type?: string | null
          accreditation_verified_at?: string | null
          anunciado_el?: string | null
          attempt_id?: string | null
          certification_number: string
          consentimiento_anuncio?: boolean
          consentimiento_anuncio_el?: string | null
          created_at?: string
          evaluator_id?: string | null
          evaluator_is_external?: boolean
          evaluator_notes?: string | null
          exam_id?: string | null
          expires_at?: string | null
          id?: string
          issued_at?: string | null
          jurisdiccion?: string | null
          learning_path_id?: string | null
          oral_result?: string | null
          practical_result?: string | null
          rechazada_el?: string | null
          renewal_warning_sent?: boolean | null
          renewed_at?: string | null
          revoked_at?: string | null
          revoked_reason?: string | null
          specialty_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          accreditation_ref?: string | null
          accreditation_type?: string | null
          accreditation_verified_at?: string | null
          anunciado_el?: string | null
          attempt_id?: string | null
          certification_number?: string
          consentimiento_anuncio?: boolean
          consentimiento_anuncio_el?: string | null
          created_at?: string
          evaluator_id?: string | null
          evaluator_is_external?: boolean
          evaluator_notes?: string | null
          exam_id?: string | null
          expires_at?: string | null
          id?: string
          issued_at?: string | null
          jurisdiccion?: string | null
          learning_path_id?: string | null
          oral_result?: string | null
          practical_result?: string | null
          rechazada_el?: string | null
          renewal_warning_sent?: boolean | null
          renewed_at?: string | null
          revoked_at?: string | null
          revoked_reason?: string | null
          specialty_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_certificacion_examen"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "instructor_exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_certificacion_intento"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "instructor_exam_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_certificacion_ruta"
            columns: ["learning_path_id"]
            isOneToOne: false
            referencedRelation: "learning_paths"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_certifications_evaluator_id_fkey"
            columns: ["evaluator_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_certifications_evaluator_id_fkey"
            columns: ["evaluator_id"]
            isOneToOne: false
            referencedRelation: "user_incident_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "instructor_certifications_evaluator_id_fkey"
            columns: ["evaluator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_certifications_jurisdiccion_fkey"
            columns: ["jurisdiccion"]
            isOneToOne: false
            referencedRelation: "jurisdicciones"
            referencedColumns: ["codigo"]
          },
          {
            foreignKeyName: "instructor_certifications_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "especialidades_publicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_certifications_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "instructor_specialties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_certifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_certifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_incident_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "instructor_certifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_exam_attempt_questions: {
        Row: {
          attempt_id: string
          created_at: string
          id: string
          orden_opciones: number[]
          posicion: number
          question_id: string
        }
        Insert: {
          attempt_id: string
          created_at?: string
          id?: string
          orden_opciones: number[]
          posicion: number
          question_id: string
        }
        Update: {
          attempt_id?: string
          created_at?: string
          id?: string
          orden_opciones?: number[]
          posicion?: number
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructor_exam_attempt_questions_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "instructor_exam_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_exam_attempt_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "instructor_exam_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_exam_attempts: {
        Row: {
          answers: Json | null
          completed_at: string | null
          correct_answers: number | null
          created_at: string
          exam_id: string
          id: string
          model_id: string | null
          models_exhausted: boolean | null
          next_attempt_available_at: string | null
          passed: boolean | null
          score: number | null
          started_at: string
          status: string
          time_limit_exceeded: boolean | null
          time_spent_seconds: number | null
          total_questions: number
          user_id: string
        }
        Insert: {
          answers?: Json | null
          completed_at?: string | null
          correct_answers?: number | null
          created_at?: string
          exam_id: string
          id?: string
          model_id?: string | null
          models_exhausted?: boolean | null
          next_attempt_available_at?: string | null
          passed?: boolean | null
          score?: number | null
          started_at?: string
          status?: string
          time_limit_exceeded?: boolean | null
          time_spent_seconds?: number | null
          total_questions: number
          user_id: string
        }
        Update: {
          answers?: Json | null
          completed_at?: string | null
          correct_answers?: number | null
          created_at?: string
          exam_id?: string
          id?: string
          model_id?: string | null
          models_exhausted?: boolean | null
          next_attempt_available_at?: string | null
          passed?: boolean | null
          score?: number | null
          started_at?: string
          status?: string
          time_limit_exceeded?: boolean | null
          time_spent_seconds?: number | null
          total_questions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructor_exam_attempts_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "instructor_exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_exam_attempts_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "instructor_exam_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_exam_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_exam_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_incident_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "instructor_exam_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_exam_models: {
        Row: {
          created_at: string
          exam_id: string
          id: string
          is_active: boolean | null
          model_number: number
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          exam_id: string
          id?: string
          is_active?: boolean | null
          model_number: number
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          exam_id?: string
          id?: string
          is_active?: boolean | null
          model_number?: number
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructor_exam_models_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "instructor_exams"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_exam_questions: {
        Row: {
          category: string | null
          correct_answer: number
          created_at: string
          difficulty: string
          explanation: string | null
          id: string
          model_id: string | null
          options: Json
          oral_followup: string | null
          oral_rubric: Json | null
          order_index: number | null
          points: number | null
          question: string
          specialty_id: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          correct_answer: number
          created_at?: string
          difficulty?: string
          explanation?: string | null
          id?: string
          model_id?: string | null
          options: Json
          oral_followup?: string | null
          oral_rubric?: Json | null
          order_index?: number | null
          points?: number | null
          question: string
          specialty_id?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          correct_answer?: number
          created_at?: string
          difficulty?: string
          explanation?: string | null
          id?: string
          model_id?: string | null
          options?: Json
          oral_followup?: string | null
          oral_rubric?: Json | null
          order_index?: number | null
          points?: number | null
          question?: string
          specialty_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructor_exam_questions_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "instructor_exam_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_exam_questions_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "especialidades_publicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_exam_questions_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "instructor_specialties"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_exams: {
        Row: {
          certification_validity_years: number
          cooldown_days: number
          created_at: string
          description: string | null
          exhausted_cooldown_months: number
          id: string
          is_active: boolean | null
          learning_path_id: string | null
          pass_threshold: number
          renewal_warning_days: number
          slug: string
          specialty_id: string | null
          time_limit_minutes: number
          title: string
          total_models: number
          total_questions: number
          updated_at: string
        }
        Insert: {
          certification_validity_years?: number
          cooldown_days?: number
          created_at?: string
          description?: string | null
          exhausted_cooldown_months?: number
          id?: string
          is_active?: boolean | null
          learning_path_id?: string | null
          pass_threshold?: number
          renewal_warning_days?: number
          slug: string
          specialty_id?: string | null
          time_limit_minutes?: number
          title: string
          total_models?: number
          total_questions?: number
          updated_at?: string
        }
        Update: {
          certification_validity_years?: number
          cooldown_days?: number
          created_at?: string
          description?: string | null
          exhausted_cooldown_months?: number
          id?: string
          is_active?: boolean | null
          learning_path_id?: string | null
          pass_threshold?: number
          renewal_warning_days?: number
          slug?: string
          specialty_id?: string | null
          time_limit_minutes?: number
          title?: string
          total_models?: number
          total_questions?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructor_exams_learning_path_id_fkey"
            columns: ["learning_path_id"]
            isOneToOne: false
            referencedRelation: "learning_paths"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_exams_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "especialidades_publicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_exams_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "instructor_specialties"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_payouts: {
        Row: {
          amount_cents: number
          completed_at: string | null
          created_at: string | null
          failure_reason: string | null
          id: string
          instructor_id: string
          notes: string | null
          payment_method: string | null
          payment_reference: string | null
          period_end: string
          period_start: string
          processed_at: string | null
          requested_at: string | null
          status: string
        }
        Insert: {
          amount_cents: number
          completed_at?: string | null
          created_at?: string | null
          failure_reason?: string | null
          id?: string
          instructor_id: string
          notes?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          period_end: string
          period_start: string
          processed_at?: string | null
          requested_at?: string | null
          status?: string
        }
        Update: {
          amount_cents?: number
          completed_at?: string | null
          created_at?: string | null
          failure_reason?: string | null
          id?: string
          instructor_id?: string
          notes?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          period_end?: string
          period_start?: string
          processed_at?: string | null
          requested_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructor_payouts_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_payouts_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "user_incident_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "instructor_payouts_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_profiles: {
        Row: {
          accepts_messages: boolean | null
          average_rating: number | null
          bio: string | null
          certified_paths: string[] | null
          created_at: string
          headline: string | null
          id: string
          is_active: boolean | null
          is_public: boolean | null
          is_verified: boolean | null
          max_courses: number | null
          specialties: string[] | null
          total_courses: number | null
          total_revenue_cents: number | null
          total_reviews: number | null
          total_students: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accepts_messages?: boolean | null
          average_rating?: number | null
          bio?: string | null
          certified_paths?: string[] | null
          created_at?: string
          headline?: string | null
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          is_verified?: boolean | null
          max_courses?: number | null
          specialties?: string[] | null
          total_courses?: number | null
          total_revenue_cents?: number | null
          total_reviews?: number | null
          total_students?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          accepts_messages?: boolean | null
          average_rating?: number | null
          bio?: string | null
          certified_paths?: string[] | null
          created_at?: string
          headline?: string | null
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          is_verified?: boolean | null
          max_courses?: number | null
          specialties?: string[] | null
          total_courses?: number | null
          total_revenue_cents?: number | null
          total_reviews?: number | null
          total_students?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructor_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_incident_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "instructor_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_specialties: {
        Row: {
          created_at: string
          descripcion: string | null
          id: string
          is_active: boolean
          learning_path_id: string | null
          nombre: string
          permite_evaluador_externo: boolean
          position: number
          requiere_acreditacion: boolean
          slug: string
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          id?: string
          is_active?: boolean
          learning_path_id?: string | null
          nombre: string
          permite_evaluador_externo?: boolean
          position?: number
          requiere_acreditacion?: boolean
          slug: string
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          id?: string
          is_active?: boolean
          learning_path_id?: string | null
          nombre?: string
          permite_evaluador_externo?: boolean
          position?: number
          requiere_acreditacion?: boolean
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructor_specialties_learning_path_id_fkey"
            columns: ["learning_path_id"]
            isOneToOne: false
            referencedRelation: "learning_paths"
            referencedColumns: ["id"]
          },
        ]
      }
      invites: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number
          notes: string | null
          role: Database["public"]["Enums"]["user_role"]
          used_count: number
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number
          notes?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          used_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number
          notes?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          used_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "invites_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_incident_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "invites_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      jurisdicciones: {
        Row: {
          codigo: string
          created_at: string
          es_bloque: boolean
          is_active: boolean
          nombre: string
          position: number
        }
        Insert: {
          codigo: string
          created_at?: string
          es_bloque?: boolean
          is_active?: boolean
          nombre: string
          position?: number
        }
        Update: {
          codigo?: string
          created_at?: string
          es_bloque?: boolean
          is_active?: boolean
          nombre?: string
          position?: number
        }
        Relationships: []
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
          subtitle: string | null
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
          subtitle?: string | null
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
          subtitle?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      lesson_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_answer: boolean | null
          is_hidden: boolean | null
          lesson_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_answer?: boolean | null
          is_hidden?: boolean | null
          lesson_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_answer?: boolean | null
          is_hidden?: boolean | null
          lesson_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_comments_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_incident_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "lesson_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
          slides_type: string | null
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
          slides_type?: string | null
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
          slides_type?: string | null
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
      level_thresholds: {
        Row: {
          level: number
          min_xp: number
          name: string
        }
        Insert: {
          level: number
          min_xp: number
          name: string
        }
        Update: {
          level?: number
          min_xp?: number
          name?: string
        }
        Relationships: []
      }
      mentor_application_votes: {
        Row: {
          application_id: string
          comment: string | null
          created_at: string
          id: string
          vote: string
          voter_id: string
        }
        Insert: {
          application_id: string
          comment?: string | null
          created_at?: string
          id?: string
          vote: string
          voter_id: string
        }
        Update: {
          application_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          vote?: string
          voter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentor_application_votes_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "mentor_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentor_application_votes_voter_id_fkey"
            columns: ["voter_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentor_application_votes_voter_id_fkey"
            columns: ["voter_id"]
            isOneToOne: false
            referencedRelation: "user_incident_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "mentor_application_votes_voter_id_fkey"
            columns: ["voter_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      mentor_applications: {
        Row: {
          approval_met: boolean | null
          can_reapply_at: string | null
          created_at: string
          decided_at: string | null
          decided_by: string | null
          decision_method: string | null
          decision_reason: string | null
          experience: string | null
          id: string
          motivation: string
          points_at_application: number
          quorum_met: boolean | null
          status: string
          total_eligible_voters: number | null
          updated_at: string
          user_id: string
          votes_abstain: number | null
          votes_against: number | null
          votes_for: number | null
          voting_ends_at: string | null
          voting_starts_at: string | null
        }
        Insert: {
          approval_met?: boolean | null
          can_reapply_at?: string | null
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_method?: string | null
          decision_reason?: string | null
          experience?: string | null
          id?: string
          motivation: string
          points_at_application: number
          quorum_met?: boolean | null
          status?: string
          total_eligible_voters?: number | null
          updated_at?: string
          user_id: string
          votes_abstain?: number | null
          votes_against?: number | null
          votes_for?: number | null
          voting_ends_at?: string | null
          voting_starts_at?: string | null
        }
        Update: {
          approval_met?: boolean | null
          can_reapply_at?: string | null
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_method?: string | null
          decision_reason?: string | null
          experience?: string | null
          id?: string
          motivation?: string
          points_at_application?: number
          quorum_met?: boolean | null
          status?: string
          total_eligible_voters?: number | null
          updated_at?: string
          user_id?: string
          votes_abstain?: number | null
          votes_against?: number | null
          votes_for?: number | null
          voting_ends_at?: string | null
          voting_starts_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mentor_applications_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentor_applications_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "user_incident_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "mentor_applications_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentor_applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentor_applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_incident_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "mentor_applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      mentor_config: {
        Row: {
          config_key: string
          config_value: Json
          created_at: string
          description: string | null
          id: string
          updated_at: string
        }
        Insert: {
          config_key: string
          config_value: Json
          created_at?: string
          description?: string | null
          id?: string
          updated_at?: string
        }
        Update: {
          config_key?: string
          config_value?: Json
          created_at?: string
          description?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      mentor_leaves: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          ends_at: string
          id: string
          reason: string
          rejection_reason: string | null
          starts_at: string
          status: string
          total_days: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          ends_at: string
          id?: string
          reason: string
          rejection_reason?: string | null
          starts_at: string
          status?: string
          total_days?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          ends_at?: string
          id?: string
          reason?: string
          rejection_reason?: string | null
          starts_at?: string
          status?: string
          total_days?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentor_leaves_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentor_leaves_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "user_incident_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "mentor_leaves_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentor_leaves_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentor_leaves_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_incident_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "mentor_leaves_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      mentor_monthly_stats: {
        Row: {
          active_days: number | null
          community_responses: number | null
          content_reviews: number | null
          created_at: string
          governance_votes: number | null
          id: string
          meets_minimums: boolean | null
          mentoring_sessions: number | null
          on_leave: boolean | null
          period_month: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active_days?: number | null
          community_responses?: number | null
          content_reviews?: number | null
          created_at?: string
          governance_votes?: number | null
          id?: string
          meets_minimums?: boolean | null
          mentoring_sessions?: number | null
          on_leave?: boolean | null
          period_month: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active_days?: number | null
          community_responses?: number | null
          content_reviews?: number | null
          created_at?: string
          governance_votes?: number | null
          id?: string
          meets_minimums?: boolean | null
          mentoring_sessions?: number | null
          on_leave?: boolean | null
          period_month?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentor_monthly_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentor_monthly_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_incident_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "mentor_monthly_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      mentor_points: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          points: number
          reference_id: string | null
          reference_type: string | null
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          points: number
          reference_id?: string | null
          reference_type?: string | null
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          points?: number
          reference_id?: string | null
          reference_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentor_points_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentor_points_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_incident_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "mentor_points_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      mentor_warnings: {
        Row: {
          acknowledged_at: string | null
          created_at: string
          details: Json | null
          id: string
          is_active: boolean | null
          issued_by: string | null
          reason: string
          reference_month: string | null
          user_id: string
          warning_number: number
          warning_type: string
        }
        Insert: {
          acknowledged_at?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          is_active?: boolean | null
          issued_by?: string | null
          reason: string
          reference_month?: string | null
          user_id: string
          warning_number: number
          warning_type: string
        }
        Update: {
          acknowledged_at?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          is_active?: boolean | null
          issued_by?: string | null
          reason?: string
          reference_month?: string | null
          user_id?: string
          warning_number?: number
          warning_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentor_warnings_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentor_warnings_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "user_incident_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "mentor_warnings_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentor_warnings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentor_warnings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_incident_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "mentor_warnings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      message_flags: {
        Row: {
          conversation_id: string
          created_at: string | null
          created_by: string | null
          evidence_hash: string | null
          evidence_meta: Json | null
          flag_type: Database["public"]["Enums"]["message_flag_type"]
          id: string
          message_id: string | null
          review_action: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          severity: number
        }
        Insert: {
          conversation_id: string
          created_at?: string | null
          created_by?: string | null
          evidence_hash?: string | null
          evidence_meta?: Json | null
          flag_type: Database["public"]["Enums"]["message_flag_type"]
          id?: string
          message_id?: string | null
          review_action?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity: number
        }
        Update: {
          conversation_id?: string
          created_at?: string | null
          created_by?: string | null
          evidence_hash?: string | null
          evidence_meta?: Json | null
          flag_type?: Database["public"]["Enums"]["message_flag_type"]
          id?: string
          message_id?: string | null
          review_action?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity?: number
        }
        Relationships: [
          {
            foreignKeyName: "message_flags_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_flags_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_flags_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_incident_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "message_flags_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_flags_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_flags_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_flags_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "user_incident_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "message_flags_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reports: {
        Row: {
          admin_notes: string | null
          conversation_id: string
          created_at: string | null
          details: string | null
          id: string
          message_id: string | null
          reason: Database["public"]["Enums"]["message_report_reason"]
          reported_user_id: string
          reporter_user_id: string
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["message_report_status"] | null
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          conversation_id: string
          created_at?: string | null
          details?: string | null
          id?: string
          message_id?: string | null
          reason: Database["public"]["Enums"]["message_report_reason"]
          reported_user_id: string
          reporter_user_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["message_report_status"] | null
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          conversation_id?: string
          created_at?: string | null
          details?: string | null
          id?: string
          message_id?: string | null
          reason?: Database["public"]["Enums"]["message_report_reason"]
          reported_user_id?: string
          reporter_user_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["message_report_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_reports_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reports_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reports_reported_user_id_fkey"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reports_reported_user_id_fkey"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "user_incident_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "message_reports_reported_user_id_fkey"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reports_reporter_user_id_fkey"
            columns: ["reporter_user_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reports_reporter_user_id_fkey"
            columns: ["reporter_user_id"]
            isOneToOne: false
            referencedRelation: "user_incident_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "message_reports_reporter_user_id_fkey"
            columns: ["reporter_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reports_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reports_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "user_incident_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "message_reports_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "user_incident_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
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
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_incident_summary"
            referencedColumns: ["user_id"]
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
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          link: string | null
          message: string
          read: boolean
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          link?: string | null
          message: string
          read?: boolean
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          link?: string | null
          message?: string
          read?: boolean
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_incident_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
      pricing_plans: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          plan_type: string
          price_cents: number
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          plan_type: string
          price_cents: number
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          plan_type?: string
          price_cents?: number
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      project_collaborators: {
        Row: {
          created_at: string
          id: string
          invited_by: string
          joined_at: string | null
          project_id: string
          status: Database["public"]["Enums"]["project_collaborator_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by: string
          joined_at?: string | null
          project_id: string
          status?: Database["public"]["Enums"]["project_collaborator_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_by?: string
          joined_at?: string | null
          project_id?: string
          status?: Database["public"]["Enums"]["project_collaborator_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_collaborators_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_collaborators_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "user_incident_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "project_collaborators_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_collaborators_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_collaborators_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_collaborators_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_incident_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "project_collaborators_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      project_reviews: {
        Row: {
          created_at: string
          feedback: string | null
          id: string
          project_id: string
          review_round: number
          reviewer_id: string
          vote: Database["public"]["Enums"]["course_review_vote"]
        }
        Insert: {
          created_at?: string
          feedback?: string | null
          id?: string
          project_id: string
          review_round?: number
          reviewer_id: string
          vote: Database["public"]["Enums"]["course_review_vote"]
        }
        Update: {
          created_at?: string
          feedback?: string | null
          id?: string
          project_id?: string
          review_round?: number
          reviewer_id?: string
          vote?: Database["public"]["Enums"]["course_review_vote"]
        }
        Relationships: [
          {
            foreignKeyName: "project_reviews_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "user_incident_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "project_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      project_updates: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          project_id: string
          title: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          project_id: string
          title: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          project_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_updates_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_updates_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "user_incident_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "project_updates_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          approved_at: string | null
          author_id: string
          category: Database["public"]["Enums"]["project_category"]
          completed_at: string | null
          created_at: string
          current_review_round: number
          description: string
          id: string
          is_public: boolean
          rejection_reason: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["project_status"]
          summary: string
          title: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          author_id: string
          category?: Database["public"]["Enums"]["project_category"]
          completed_at?: string | null
          created_at?: string
          current_review_round?: number
          description: string
          id?: string
          is_public?: boolean
          rejection_reason?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          summary: string
          title: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          author_id?: string
          category?: Database["public"]["Enums"]["project_category"]
          completed_at?: string | null
          created_at?: string
          current_review_round?: number
          description?: string
          id?: string
          is_public?: boolean
          rejection_reason?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          summary?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "user_incident_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "projects_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_code_uses: {
        Row: {
          course_id: string
          discount_applied_cents: number
          final_price_cents: number
          id: string
          original_price_cents: number
          promo_code_id: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          course_id: string
          discount_applied_cents: number
          final_price_cents: number
          id?: string
          original_price_cents: number
          promo_code_id: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          course_id?: string
          discount_applied_cents?: number
          final_price_cents?: number
          id?: string
          original_price_cents?: number
          promo_code_id?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_code_uses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_code_uses_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_code_uses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_code_uses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_incident_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "promo_code_uses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_codes: {
        Row: {
          code: string
          course_id: string | null
          created_at: string | null
          current_uses: number | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          instructor_id: string
          is_active: boolean | null
          max_discount_cents: number | null
          max_uses: number | null
          min_purchase_cents: number | null
          starts_at: string | null
          updated_at: string | null
        }
        Insert: {
          code: string
          course_id?: string | null
          created_at?: string | null
          current_uses?: number | null
          discount_type: string
          discount_value: number
          expires_at?: string | null
          id?: string
          instructor_id: string
          is_active?: boolean | null
          max_discount_cents?: number | null
          max_uses?: number | null
          min_purchase_cents?: number | null
          starts_at?: string | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          course_id?: string | null
          created_at?: string | null
          current_uses?: number | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          instructor_id?: string
          is_active?: boolean | null
          max_discount_cents?: number | null
          max_uses?: number | null
          min_purchase_cents?: number | null
          starts_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promo_codes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_codes_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_codes_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "user_incident_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "promo_codes_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "users"
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
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_incident_summary"
            referencedColumns: ["user_id"]
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
      referral_attributions: {
        Row: {
          click_id: string | null
          created_at: string | null
          expires_at: string
          id: string
          link_id: string
          session_id: string
          user_id: string | null
        }
        Insert: {
          click_id?: string | null
          created_at?: string | null
          expires_at: string
          id?: string
          link_id: string
          session_id: string
          user_id?: string | null
        }
        Update: {
          click_id?: string | null
          created_at?: string | null
          expires_at?: string
          id?: string
          link_id?: string
          session_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_attributions_click_id_fkey"
            columns: ["click_id"]
            isOneToOne: false
            referencedRelation: "referral_clicks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_attributions_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "referral_link_performance"
            referencedColumns: ["link_id"]
          },
          {
            foreignKeyName: "referral_attributions_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "referral_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_attributions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_attributions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_incident_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "referral_attributions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_clicks: {
        Row: {
          clicked_at: string | null
          country_code: string | null
          device_type: string | null
          id: string
          landing_page: string
          link_id: string
          referer_url: string | null
          user_agent: string | null
          visitor_ip_hash: string | null
        }
        Insert: {
          clicked_at?: string | null
          country_code?: string | null
          device_type?: string | null
          id?: string
          landing_page: string
          link_id: string
          referer_url?: string | null
          user_agent?: string | null
          visitor_ip_hash?: string | null
        }
        Update: {
          clicked_at?: string | null
          country_code?: string | null
          device_type?: string | null
          id?: string
          landing_page?: string
          link_id?: string
          referer_url?: string | null
          user_agent?: string | null
          visitor_ip_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_clicks_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "referral_link_performance"
            referencedColumns: ["link_id"]
          },
          {
            foreignKeyName: "referral_clicks_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "referral_links"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_conversions: {
        Row: {
          attribution_window_hours: number | null
          click_id: string | null
          commission_rate: number | null
          conversion_type: string
          converted_at: string | null
          course_id: string
          id: string
          instructor_commission_cents: number | null
          link_id: string
          revenue_cents: number | null
          user_id: string
        }
        Insert: {
          attribution_window_hours?: number | null
          click_id?: string | null
          commission_rate?: number | null
          conversion_type: string
          converted_at?: string | null
          course_id: string
          id?: string
          instructor_commission_cents?: number | null
          link_id: string
          revenue_cents?: number | null
          user_id: string
        }
        Update: {
          attribution_window_hours?: number | null
          click_id?: string | null
          commission_rate?: number | null
          conversion_type?: string
          converted_at?: string | null
          course_id?: string
          id?: string
          instructor_commission_cents?: number | null
          link_id?: string
          revenue_cents?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_conversions_click_id_fkey"
            columns: ["click_id"]
            isOneToOne: false
            referencedRelation: "referral_clicks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_conversions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_conversions_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "referral_link_performance"
            referencedColumns: ["link_id"]
          },
          {
            foreignKeyName: "referral_conversions_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "referral_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_conversions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_conversions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_incident_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "referral_conversions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_links: {
        Row: {
          code: string
          course_id: string | null
          created_at: string | null
          custom_slug: string | null
          expires_at: string | null
          id: string
          instructor_id: string
          is_active: boolean | null
          updated_at: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          code: string
          course_id?: string | null
          created_at?: string | null
          custom_slug?: string | null
          expires_at?: string | null
          id?: string
          instructor_id: string
          is_active?: boolean | null
          updated_at?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          code?: string
          course_id?: string | null
          created_at?: string | null
          custom_slug?: string | null
          expires_at?: string | null
          id?: string
          instructor_id?: string
          is_active?: boolean | null
          updated_at?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_links_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_links_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_links_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "user_incident_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "referral_links_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "users"
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
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reputation_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_incident_summary"
            referencedColumns: ["user_id"]
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
      revenue_transactions: {
        Row: {
          course_id: string | null
          created_at: string
          creator_percentage: number
          gross_amount_cents: number
          id: string
          is_split: boolean | null
          net_amount_cents: number
          paid_at: string | null
          period_end: string | null
          period_start: string | null
          platform_fee_cents: number
          recipient_id: string
          source_id: string | null
          source_type: string
          split_with_user_id: string | null
          status: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          creator_percentage: number
          gross_amount_cents: number
          id?: string
          is_split?: boolean | null
          net_amount_cents: number
          paid_at?: string | null
          period_end?: string | null
          period_start?: string | null
          platform_fee_cents: number
          recipient_id: string
          source_id?: string | null
          source_type: string
          split_with_user_id?: string | null
          status?: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          creator_percentage?: number
          gross_amount_cents?: number
          id?: string
          is_split?: boolean | null
          net_amount_cents?: number
          paid_at?: string | null
          period_end?: string | null
          period_start?: string | null
          platform_fee_cents?: number
          recipient_id?: string
          source_id?: string | null
          source_type?: string
          split_with_user_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "revenue_transactions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenue_transactions_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenue_transactions_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "user_incident_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "revenue_transactions_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenue_transactions_split_with_user_id_fkey"
            columns: ["split_with_user_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenue_transactions_split_with_user_id_fkey"
            columns: ["split_with_user_id"]
            isOneToOne: false
            referencedRelation: "user_incident_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "revenue_transactions_split_with_user_id_fkey"
            columns: ["split_with_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_points: {
        Row: {
          course_completion_points: number | null
          course_id: string
          created_at: string
          id: string
          instructor_id: string
          lesson_points: number | null
          period_month: string
          total_points: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          course_completion_points?: number | null
          course_id: string
          created_at?: string
          id?: string
          instructor_id: string
          lesson_points?: number | null
          period_month: string
          total_points?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          course_completion_points?: number | null
          course_id?: string
          created_at?: string
          id?: string
          instructor_id?: string
          lesson_points?: number | null
          period_month?: string
          total_points?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_points_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_points_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_points_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "user_incident_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "subscription_points_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_points_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_points_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_incident_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "subscription_points_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          auto_renew: boolean | null
          cancelled_at: string | null
          created_at: string
          ends_at: string
          grace_period_ends_at: string | null
          id: string
          payment_id: string | null
          payment_provider: string | null
          plan_type: string
          price_cents: number
          pricing_plan_id: string | null
          starts_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_renew?: boolean | null
          cancelled_at?: string | null
          created_at?: string
          ends_at: string
          grace_period_ends_at?: string | null
          id?: string
          payment_id?: string | null
          payment_provider?: string | null
          plan_type: string
          price_cents: number
          pricing_plan_id?: string | null
          starts_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_renew?: boolean | null
          cancelled_at?: string | null
          created_at?: string
          ends_at?: string
          grace_period_ends_at?: string | null
          id?: string
          payment_id?: string | null
          payment_provider?: string | null
          plan_type?: string
          price_cents?: number
          pricing_plan_id?: string | null
          starts_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_pricing_plan_id_fkey"
            columns: ["pricing_plan_id"]
            isOneToOne: false
            referencedRelation: "pricing_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_incident_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
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
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_incident_summary"
            referencedColumns: ["user_id"]
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
      user_events: {
        Row: {
          created_at: string
          event: string
          id: string
          page: string | null
          payload: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event: string
          id?: string
          page?: string | null
          payload?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event?: string
          id?: string
          page?: string | null
          payload?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_incident_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_feedback: {
        Row: {
          created_at: string
          id: string
          message: string
          meta: Json | null
          page: string
          rating: number | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          meta?: Json | null
          page: string
          rating?: number | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          meta?: Json | null
          page?: string
          rating?: number | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_incident_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
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
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_gamification_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_incident_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_gamification_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_lesson_notes: {
        Row: {
          content: string
          course_id: string
          created_at: string
          id: string
          lesson_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string
          course_id: string
          created_at?: string
          id?: string
          lesson_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          course_id?: string
          created_at?: string
          id?: string
          lesson_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_incident_summary"
            referencedColumns: ["user_id"]
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
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_reputation_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_incident_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_reputation_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          granted_at: string | null
          granted_by: string | null
          id: string
          is_active: boolean | null
          notes: string | null
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          role: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
          active_path_id: string | null
          active_path_selected_at: string | null
          avatar_path: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string
          email_confirmed_at: string | null
          email_normalizado: string | null
          full_name: string | null
          github: string | null
          id: string
          is_beta: boolean
          is_beta_enabled: boolean
          is_suspended: boolean | null
          last_seen_at: string | null
          linkedin: string | null
          role: Database["public"]["Enums"]["user_role"]
          suspended_at: string | null
          suspended_by: string | null
          suspended_reason: string | null
          twitter: string | null
          updated_at: string
          wants_beta_notification: boolean | null
          website: string | null
          welcome_email_sent_at: string | null
        }
        Insert: {
          active_path_id?: string | null
          active_path_selected_at?: string | null
          avatar_path?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email: string
          email_confirmed_at?: string | null
          email_normalizado?: string | null
          full_name?: string | null
          github?: string | null
          id: string
          is_beta?: boolean
          is_beta_enabled?: boolean
          is_suspended?: boolean | null
          last_seen_at?: string | null
          linkedin?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          suspended_at?: string | null
          suspended_by?: string | null
          suspended_reason?: string | null
          twitter?: string | null
          updated_at?: string
          wants_beta_notification?: boolean | null
          website?: string | null
          welcome_email_sent_at?: string | null
        }
        Update: {
          active_path_id?: string | null
          active_path_selected_at?: string | null
          avatar_path?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string
          email_confirmed_at?: string | null
          email_normalizado?: string | null
          full_name?: string | null
          github?: string | null
          id?: string
          is_beta?: boolean
          is_beta_enabled?: boolean
          is_suspended?: boolean | null
          last_seen_at?: string | null
          linkedin?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          suspended_at?: string | null
          suspended_by?: string | null
          suspended_reason?: string | null
          twitter?: string | null
          updated_at?: string
          wants_beta_notification?: boolean | null
          website?: string | null
          welcome_email_sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_active_path_id_fkey"
            columns: ["active_path_id"]
            isOneToOne: false
            referencedRelation: "learning_paths"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "xp_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_incident_summary"
            referencedColumns: ["user_id"]
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
      especialidades_publicas: {
        Row: {
          descripcion: string | null
          id: string | null
          nombre: string | null
          permite_evaluador_externo: boolean | null
          position: number | null
          preguntas_en_banco: number | null
          requiere_acreditacion: boolean | null
          slug: string | null
          tiene_examen: boolean | null
        }
        Insert: {
          descripcion?: string | null
          id?: string | null
          nombre?: string | null
          permite_evaluador_externo?: boolean | null
          position?: number | null
          preguntas_en_banco?: never
          requiere_acreditacion?: boolean | null
          slug?: string | null
          tiene_examen?: never
        }
        Update: {
          descripcion?: string | null
          id?: string | null
          nombre?: string | null
          permite_evaluador_externo?: boolean | null
          position?: number | null
          preguntas_en_banco?: never
          requiere_acreditacion?: boolean | null
          slug?: string | null
          tiene_examen?: never
        }
        Relationships: []
      }
      instructor_referral_stats: {
        Row: {
          active_links: number | null
          active_promo_codes: number | null
          clicks_last_30_days: number | null
          clicks_last_7_days: number | null
          commission_last_30_days_cents: number | null
          conversion_rate_percent: number | null
          conversions_last_30_days: number | null
          instructor_id: string | null
          instructor_name: string | null
          revenue_last_30_days_cents: number | null
          total_clicks: number | null
          total_commission_cents: number | null
          total_conversions: number | null
          total_enrollments: number | null
          total_links: number | null
          total_promo_codes: number | null
          total_promo_uses: number | null
          total_purchases: number | null
          total_revenue_cents: number | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_links_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_links_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "user_incident_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "referral_links_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_revenue_details: {
        Row: {
          buyer_email: string | null
          buyer_id: string | null
          buyer_name: string | null
          course_id: string | null
          course_title: string | null
          created_at: string | null
          creator_percentage: number | null
          gross_amount_cents: number | null
          id: string | null
          instructor_id: string | null
          instructor_name: string | null
          instructor_role: Database["public"]["Enums"]["user_role"] | null
          net_amount_cents: number | null
          paid_at: string | null
          platform_fee_cents: number | null
          source_type: string | null
          status: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_purchases_user_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_purchases_user_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "user_incident_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "course_purchases_user_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenue_transactions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenue_transactions_recipient_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenue_transactions_recipient_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "user_incident_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "revenue_transactions_recipient_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      message_flags_summary: {
        Row: {
          flag_type: Database["public"]["Enums"]["message_flag_type"] | null
          last_flag_at: string | null
          pending_review: number | null
          reviewed: number | null
          severity: number | null
          total_flags: number | null
        }
        Relationships: []
      }
      perfiles_publicos: {
        Row: {
          avatar_url: string | null
          bio: string | null
          es_autor: boolean | null
          es_instructor: boolean | null
          es_mentor: boolean | null
          full_name: string | null
          github: string | null
          id: string | null
          linkedin: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          twitter: string | null
          website: string | null
        }
        Relationships: []
      }
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
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "governance_proposals_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "user_incident_summary"
            referencedColumns: ["user_id"]
          },
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
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "governance_proposals_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "user_incident_summary"
            referencedColumns: ["user_id"]
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
      referral_link_performance: {
        Row: {
          clicks_30d: number | null
          clicks_7d: number | null
          code: string | null
          conversion_rate: number | null
          conversions_30d: number | null
          course_id: string | null
          course_title: string | null
          created_at: string | null
          custom_slug: string | null
          instructor_id: string | null
          is_active: boolean | null
          link_id: string | null
          total_clicks: number | null
          total_commission_cents: number | null
          total_conversions: number | null
          total_revenue_cents: number | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_links_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_links_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_links_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "user_incident_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "referral_links_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sellos_de_instructor: {
        Row: {
          certification_number: string | null
          especialidad: string | null
          especialidad_slug: string | null
          expires_at: string | null
          issued_at: string | null
          jurisdiccion: string | null
          jurisdiccion_nombre: string | null
          user_id: string | null
          vigente: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "instructor_certifications_jurisdiccion_fkey"
            columns: ["jurisdiccion"]
            isOneToOne: false
            referencedRelation: "jurisdicciones"
            referencedColumns: ["codigo"]
          },
          {
            foreignKeyName: "instructor_certifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_certifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_incident_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "instructor_certifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_incident_summary: {
        Row: {
          actioned_reports: number | null
          avatar_url: string | null
          full_name: string | null
          high_severity_flags: number | null
          last_flag_at: string | null
          last_report_at: string | null
          open_reports: number | null
          pending_flags: number | null
          risk_level: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          total_flags: number | null
          total_reports_received: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      activar_ruta: { Args: { p_slug: string }; Returns: string }
      admin_assign_instructor: {
        Args: {
          p_admin_id: string
          p_bio?: string
          p_headline?: string
          p_reason?: string
          p_user_id: string
        }
        Returns: Json
      }
      admin_assign_mentor: {
        Args: {
          p_admin_id: string
          p_initial_points?: number
          p_reason?: string
          p_user_id: string
        }
        Returns: Json
      }
      admin_decide_mentor_application: {
        Args: {
          p_admin_id: string
          p_application_id: string
          p_approved: boolean
          p_reason?: string
        }
        Returns: Json
      }
      admin_list_assignable_users: {
        Args: { p_limit?: number; p_role: string; p_search?: string }
        Returns: {
          avatar_url: string
          email: string
          full_name: string
          has_role: boolean
          role_is_active: boolean
          user_current_role: string
          user_id: string
        }[]
      }
      admin_revoke_instructor: {
        Args: { p_admin_id: string; p_reason?: string; p_user_id: string }
        Returns: Json
      }
      admin_revoke_mentor: {
        Args: {
          p_admin_id: string
          p_apply_cooldown?: boolean
          p_reason?: string
          p_user_id: string
        }
        Returns: Json
      }
      apply_promo_code: {
        Args: {
          p_code: string
          p_course_id: string
          p_original_price_cents: number
          p_user_id: string
        }
        Returns: Json
      }
      borrar_cuentas_sin_confirmar: {
        Args: { p_dias?: number; p_solo_contar?: boolean }
        Returns: number
      }
      calculate_gpower: { Args: { p_user_id: string }; Returns: number }
      calculate_level_from_xp: { Args: { xp_amount: number }; Returns: number }
      calculate_mentor_plazas: {
        Args: never
        Returns: {
          available_plazas: number
          calculated_plazas: number
          current_mentors: number
          total_active_users: number
        }[]
      }
      calculate_xp_to_next_level: {
        Args: { current_level: number }
        Returns: number
      }
      can_apply_mentor: { Args: { p_user_id: string }; Returns: Json }
      can_attempt_exam: {
        Args: { p_exam_id: string; p_user_id: string }
        Returns: {
          can_attempt: boolean
          models_used: number
          next_available_at: string
          reason: string
          total_models: number
        }[]
      }
      can_create_proposal: {
        Args: { p_level: number; p_user_id: string }
        Returns: boolean
      }
      can_validate_proposal: {
        Args: { p_proposal_level: number; p_user_id: string }
        Returns: boolean
      }
      candidatas_sin_confirmar: { Args: { p_dias?: number }; Returns: string[] }
      check_expiring_certifications: {
        Args: never
        Returns: {
          certification_id: string
          days_remaining: number
          exam_title: string
          expires_at: string
          path_title: string
          user_id: string
        }[]
      }
      check_project_eligibility: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      cleanup_expired_attributions: { Args: never; Returns: number }
      correo_normalizado: { Args: { p_correo: string }; Returns: string }
      create_notification: {
        Args: {
          p_data?: Json
          p_link?: string
          p_message: string
          p_title: string
          p_type: Database["public"]["Enums"]["notification_type"]
          p_user_id: string
        }
        Returns: string
      }
      curso_visible: { Args: { p_course_id: string }; Returns: boolean }
      es_admin_actual: { Args: never; Returns: boolean }
      evaluate_mentor_monthly: {
        Args: { p_month?: number; p_user_id: string; p_year?: number }
        Returns: Json
      }
      expire_certifications: { Args: never; Returns: number }
      generate_certificate_number: { Args: never; Returns: string }
      generate_instructor_cert_number: {
        Args: { p_path_slug: string }
        Returns: string
      }
      generate_referral_code: { Args: { p_length?: number }; Returns: string }
      get_best_quiz_attempt: {
        Args: { p_module_id: string; p_user_id: string }
        Returns: {
          completed_at: string
          id: string
          passed: boolean
          score: number
        }[]
      }
      get_exam_eligibility_details: {
        Args: { p_exam_id: string; p_user_id: string }
        Returns: {
          can_attempt: boolean
          cooldown_ends_at: string
          courses_complete: boolean
          courses_completed: number
          courses_required: number
          has_active_cert: boolean
          has_premium: boolean
          in_cooldown: boolean
          models_used: number
          premium_status: string
          quizzes_complete: boolean
          quizzes_passed: number
          quizzes_required: number
          reason: string
          total_models: number
        }[]
      }
      get_instructor_earnings_summary: {
        Args: { p_instructor_id: string }
        Returns: Json
      }
      get_mentor_leave_balance: {
        Args: { p_user_id: string; p_year?: number }
        Returns: {
          max_days: number
          remaining_days: number
          used_days: number
        }[]
      }
      get_mentor_points: { Args: { p_user_id: string }; Returns: number }
      get_or_create_conversation: {
        Args: { p_user_1: string; p_user_2: string }
        Returns: string
      }
      get_or_create_referral_attribution: {
        Args: {
          p_attribution_hours?: number
          p_click_id?: string
          p_link_id?: string
          p_session_id: string
          p_user_id?: string
        }
        Returns: Json
      }
      get_path_completion_status: {
        Args: { p_learning_path_id: string; p_user_id: string }
        Returns: {
          completed_courses: number
          is_complete: boolean
          required_courses: number
        }[]
      }
      get_path_quiz_status: {
        Args: { p_learning_path_id: string; p_user_id: string }
        Returns: {
          all_passed: boolean
          courses_with_quiz: number
          quizzes_passed: number
        }[]
      }
      get_unread_message_count: { Args: { p_user_id: string }; Returns: number }
      get_user_certificates_summary: {
        Args: { p_user_id: string }
        Returns: {
          course_certificates: number
          latest_certificate_date: string
          module_certificates: number
          total_certificates: number
        }[]
      }
      has_course_access: {
        Args: { p_course_id: string; p_user_id: string }
        Returns: boolean
      }
      has_passed_module_quiz: {
        Args: { p_module_id: string; p_user_id: string }
        Returns: boolean
      }
      has_premium_access: { Args: { p_user_id: string }; Returns: boolean }
      is_admin: { Args: { check_user_id: string }; Returns: boolean }
      is_module_accessible: {
        Args: { p_module_id: string; p_user_id: string }
        Returns: boolean
      }
      is_project_author: {
        Args: { p_project_id: string; p_user_id: string }
        Returns: boolean
      }
      is_project_collaborator: {
        Args: { p_project_id: string; p_user_id: string }
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
      issue_instructor_certification: {
        Args: { p_attempt_id: string; p_user_id: string }
        Returns: string
      }
      issue_module_certificate: {
        Args: {
          p_module_id: string
          p_quiz_attempt_id: string
          p_user_id: string
        }
        Returns: string
      }
      level_from_xp: { Args: { p_xp: number }; Returns: number }
      mark_messages_as_read: {
        Args: { p_conversation_id: string; p_user_id: string }
        Returns: number
      }
      mi_perfil: {
        Args: never
        Returns: {
          active_path_id: string | null
          active_path_selected_at: string | null
          avatar_path: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string
          email_confirmed_at: string | null
          email_normalizado: string | null
          full_name: string | null
          github: string | null
          id: string
          is_beta: boolean
          is_beta_enabled: boolean
          is_suspended: boolean | null
          last_seen_at: string | null
          linkedin: string | null
          role: Database["public"]["Enums"]["user_role"]
          suspended_at: string | null
          suspended_by: string | null
          suspended_reason: string | null
          twitter: string | null
          updated_at: string
          wants_beta_notification: boolean | null
          website: string | null
          welcome_email_sent_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "users"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      process_course_purchase_commission: {
        Args: { p_purchase_id: string; p_referral_link_id?: string }
        Returns: Json
      }
      project_is_publicly_visible: {
        Args: { p_project_id: string }
        Returns: boolean
      }
      puede_crear_cursos: { Args: never; Returns: boolean }
      puede_ensenar: {
        Args: { p_jurisdiccion?: string; p_specialty_id: string }
        Returns: boolean
      }
      recalculate_user_stats: { Args: { p_user_id: string }; Returns: Json }
      remove_mentor_status: {
        Args: { p_reason: string; p_removed_by?: string; p_user_id: string }
        Returns: Json
      }
      request_mentor_leave: {
        Args: {
          p_ends_at: string
          p_reason: string
          p_starts_at: string
          p_user_id: string
        }
        Returns: string
      }
      reset_course_progress: {
        Args: {
          p_course_id: string
          p_delete_certificate?: boolean
          p_user_id: string
        }
        Returns: Json
      }
      resolve_expired_mentor_votes: { Args: never; Returns: number }
      resolve_mentor_application: {
        Args: {
          p_application_id: string
          p_approved?: boolean
          p_reason?: string
          p_resolved_by?: string
        }
        Returns: Json
      }
      save_lesson_progress: {
        Args: { p_lesson_id: string; p_user_id: string }
        Returns: Json
      }
      select_exam_model: {
        Args: { p_exam_id: string; p_user_id: string }
        Returns: string
      }
      servir_preguntas: {
        Args: { p_cuantas?: number; p_exam_id: string; p_user_id: string }
        Returns: {
          attempt_id: string
          category: string
          difficulty: string
          options: Json
          points: number
          posicion: number
          question: string
          question_id: string
        }[]
      }
      submit_course_review: {
        Args: { p_course_id: string; p_decision: string; p_feedback?: string }
        Returns: Json
      }
      submit_mentor_application: {
        Args: { p_experience?: string; p_motivation: string; p_user_id: string }
        Returns: Json
      }
      track_referral_click: {
        Args: {
          p_code: string
          p_country_code?: string
          p_device_type?: string
          p_landing_page?: string
          p_referer_url?: string
          p_user_agent?: string
          p_visitor_ip?: string
        }
        Returns: Json
      }
      track_referral_conversion: {
        Args: {
          p_click_id?: string
          p_conversion_type: string
          p_course_id: string
          p_link_id: string
          p_revenue_cents?: number
          p_user_id: string
        }
        Returns: Json
      }
      user_has_role: {
        Args: { p_roles: string[]; p_user_id: string }
        Returns: boolean
      }
      validate_promo_code: {
        Args: {
          p_code: string
          p_course_id: string
          p_price_cents: number
          p_user_id: string
        }
        Returns: Json
      }
      verificar_certificado: {
        Args: { p_codigo: string }
        Returns: {
          certificate_number: string
          completado_en: string
          curso_descripcion: string
          curso_titulo: string
          expires_at: string
          issued_at: string
          modulo_titulo: string
          revocado: boolean
          tipo: string
          titular: string
          titulo_certificado: string
        }[]
      }
      vote_mentor_application: {
        Args: {
          p_application_id: string
          p_comment?: string
          p_vote: string
          p_voter_id: string
        }
        Returns: Json
      }
      xp_to_next_level_from_xp: { Args: { p_xp: number }; Returns: number }
    }
    Enums: {
      certificate_type: "module" | "course"
      course_level: "beginner" | "intermediate" | "advanced"
      course_review_vote: "approve" | "request_changes"
      course_status:
        | "draft"
        | "published"
        | "archived"
        | "coming_soon"
        | "pending_review"
        | "rejected"
        | "changes_requested"
      entitlement_type:
        | "course_access"
        | "full_platform"
        | "learning_path_access"
      message_flag_type:
        | "external_link"
        | "invite_link"
        | "spam_pattern"
        | "trading_promo"
        | "repeat_message"
        | "mass_dm"
      message_report_reason:
        | "spam"
        | "external_promo"
        | "trading_promo"
        | "harassment"
        | "scam"
        | "inappropriate"
        | "other"
      message_report_status: "open" | "triaged" | "closed" | "actioned"
      notification_type:
        | "beta_granted"
        | "course_published"
        | "proposal_active"
        | "course_completed"
        | "certificate_issued"
        | "badge_earned"
        | "level_up"
        | "feedback_reply"
        | "welcome"
        | "system"
        | "verificacion_aprobada"
        | "verificacion_rechazada"
        | "verificacion_retirada"
        | "course_changes_requested"
        | "lesson_comment_new"
      project_category:
        | "bitcoin"
        | "lightning"
        | "defi"
        | "education"
        | "tools"
        | "general"
      project_collaborator_status: "pending" | "accepted" | "declined"
      project_status:
        | "draft"
        | "pending_review"
        | "changes_requested"
        | "approved"
        | "in_progress"
        | "completed"
        | "rejected"
        | "archived"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      course_review_vote: ["approve", "request_changes"],
      course_status: [
        "draft",
        "published",
        "archived",
        "coming_soon",
        "pending_review",
        "rejected",
        "changes_requested",
      ],
      entitlement_type: [
        "course_access",
        "full_platform",
        "learning_path_access",
      ],
      message_flag_type: [
        "external_link",
        "invite_link",
        "spam_pattern",
        "trading_promo",
        "repeat_message",
        "mass_dm",
      ],
      message_report_reason: [
        "spam",
        "external_promo",
        "trading_promo",
        "harassment",
        "scam",
        "inappropriate",
        "other",
      ],
      message_report_status: ["open", "triaged", "closed", "actioned"],
      notification_type: [
        "beta_granted",
        "course_published",
        "proposal_active",
        "course_completed",
        "certificate_issued",
        "badge_earned",
        "level_up",
        "feedback_reply",
        "welcome",
        "system",
        "verificacion_aprobada",
        "verificacion_rechazada",
        "verificacion_retirada",
        "course_changes_requested",
        "lesson_comment_new",
      ],
      project_category: [
        "bitcoin",
        "lightning",
        "defi",
        "education",
        "tools",
        "general",
      ],
      project_collaborator_status: ["pending", "accepted", "declined"],
      project_status: [
        "draft",
        "pending_review",
        "changes_requested",
        "approved",
        "in_progress",
        "completed",
        "rejected",
        "archived",
      ],
      user_role: ["student", "instructor", "admin", "mentor", "council"],
    },
  },
} as const

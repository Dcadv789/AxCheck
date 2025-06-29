export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      pillars: {
        Row: {
          id: string
          name: string
          order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          order: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          order?: number
          created_at?: string
          updated_at?: string
        }
      }
      questions: {
        Row: {
          id: string
          pillar_id: string
          text: string
          points: number
          positive_answer: string
          answer_type: 'BINARY' | 'TERNARY'
          order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          pillar_id: string
          text: string
          points: number
          positive_answer: string
          answer_type: 'BINARY' | 'TERNARY'
          order: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          pillar_id?: string
          text?: string
          points?: number
          positive_answer?: string
          answer_type?: 'BINARY' | 'TERNARY'
          order?: number
          created_at?: string
          updated_at?: string
        }
      }
      diagnostic_results: {
        Row: {
          id: string
          user_id: string
          company_data: Json
          answers: Json
          pillar_scores: Json
          total_score: number
          max_possible_score: number
          percentage_score: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          company_data: Json
          answers: Json
          pillar_scores: Json
          total_score: number
          max_possible_score: number
          percentage_score: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          company_data?: Json
          answers?: Json
          pillar_scores?: Json
          total_score?: number
          max_possible_score?: number
          percentage_score?: number
          created_at?: string
        }
      }
      settings: {
        Row: {
          id: string
          logo: string | null
          navbar_logo: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          logo?: string | null
          navbar_logo?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          logo?: string | null
          navbar_logo?: string | null
          created_at?: string
          updated_at?: string
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
  }
}
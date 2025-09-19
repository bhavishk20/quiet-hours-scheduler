import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

export type Database = {
  public: {
    Tables: {
      quiet_schedules: {
        Row: {
          id: string
          name: string
          description: string | null
          start_time: string
          end_time: string
          days_of_week: string[]
          is_active: boolean
          email_notifications: boolean
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          start_time: string
          end_time: string
          days_of_week: string[]
          is_active?: boolean
          email_notifications?: boolean
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          start_time?: string
          end_time?: string
          days_of_week?: string[]
          is_active?: boolean
          email_notifications?: boolean
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      schedule_logs: {
        Row: {
          id: string
          schedule_id: string
          action: string
          details: string | null
          timestamp: string
          user_id: string
        }
        Insert: {
          id?: string
          schedule_id: string
          action: string
          details?: string | null
          timestamp?: string
          user_id: string
        }
        Update: {
          id?: string
          schedule_id?: string
          action?: string
          details?: string | null
          timestamp?: string
          user_id?: string
        }
      }
    }
  }
}
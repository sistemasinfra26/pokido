export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'admin' | 'manager' | 'cashier' | 'staff' | 'customer'

export type TicketStatus = 'active' | 'used' | 'expired' | 'cancelled'

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          phone: string | null
          role: UserRole
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          phone?: string | null
          role?: UserRole
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          phone?: string | null
          role?: UserRole
          created_at?: string
          updated_at?: string
        }
      }
      tickets: {
        Row: {
          id: string
          user_id: string | null
          guest_name: string
          ticket_type: string
          duration_minutes: number
          price: number
          status: TicketStatus
          valid_date: string
          start_time: string | null
          end_time: string | null
          qr_code: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          guest_name: string
          ticket_type: string
          duration_minutes: number
          price: number
          status?: TicketStatus
          valid_date: string
          start_time?: string | null
          end_time?: string | null
          qr_code?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          guest_name?: string
          ticket_type?: string
          duration_minutes?: number
          price?: number
          status?: TicketStatus
          valid_date?: string
          start_time?: string | null
          end_time?: string | null
          qr_code?: string | null
          created_at?: string
        }
      }
      waivers: {
        Row: {
          id: string
          signer_name: string
          signer_dni: string
          signer_phone: string | null
          signer_email: string | null
          minors_covered: Json
          signed_at: string
          signature_url: string | null
          is_valid: boolean
        }
        Insert: {
          id?: string
          signer_name: string
          signer_dni: string
          signer_phone?: string | null
          signer_email?: string | null
          minors_covered?: Json
          signed_at?: string
          signature_url?: string | null
          is_valid?: boolean
        }
        Update: {
          id?: string
          signer_name?: string
          signer_dni?: string
          signer_phone?: string | null
          signer_email?: string | null
          minors_covered?: Json
          signed_at?: string
          signature_url?: string | null
          is_valid?: boolean
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
      user_role: UserRole
      ticket_status: TicketStatus
      payment_status: PaymentStatus
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

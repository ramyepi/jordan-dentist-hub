export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      appointment_services: {
        Row: {
          appointment_id: string
          created_at: string
          id: string
          notes: string | null
          quantity: number
          service_id: string
          service_notes: string | null
          total_price: number
          unit_price: number
        }
        Insert: {
          appointment_id: string
          created_at?: string
          id?: string
          notes?: string | null
          quantity?: number
          service_id: string
          service_notes?: string | null
          total_price: number
          unit_price: number
        }
        Update: {
          appointment_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          quantity?: number
          service_id?: string
          service_notes?: string | null
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "appointment_services_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_services_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "patient_detailed_installments"
            referencedColumns: ["appointment_id"]
          },
          {
            foreignKeyName: "appointment_services_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "patient_detailed_services"
            referencedColumns: ["appointment_id"]
          },
          {
            foreignKeyName: "appointment_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "treatment_services"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          appointment_type: Database["public"]["Enums"]["appointment_type"]
          created_at: string
          discount_amount: number | null
          discount_percentage: number | null
          doctor_id: string | null
          duration_minutes: number
          final_total: number | null
          id: string
          notes: string | null
          patient_id: string
          scheduled_date: string
          scheduled_time: string
          status: Database["public"]["Enums"]["appointment_status"]
          subtotal: number | null
          total_cost: number | null
          treatment_plan: string | null
          updated_at: string
        }
        Insert: {
          appointment_type?: Database["public"]["Enums"]["appointment_type"]
          created_at?: string
          discount_amount?: number | null
          discount_percentage?: number | null
          doctor_id?: string | null
          duration_minutes?: number
          final_total?: number | null
          id?: string
          notes?: string | null
          patient_id: string
          scheduled_date: string
          scheduled_time: string
          status?: Database["public"]["Enums"]["appointment_status"]
          subtotal?: number | null
          total_cost?: number | null
          treatment_plan?: string | null
          updated_at?: string
        }
        Update: {
          appointment_type?: Database["public"]["Enums"]["appointment_type"]
          created_at?: string
          discount_amount?: number | null
          discount_percentage?: number | null
          doctor_id?: string | null
          duration_minutes?: number
          final_total?: number | null
          id?: string
          notes?: string | null
          patient_id?: string
          scheduled_date?: string
          scheduled_time?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          subtotal?: number | null
          total_cost?: number | null
          treatment_plan?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_comprehensive_report"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_detailed_installments"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_detailed_services"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_expenses: {
        Row: {
          amount: number
          category: string
          category_id: string | null
          created_at: string
          created_by: string
          description: string | null
          expense_date: string
          id: string
          receipt_path: string | null
          title: string
          updated_at: string
        }
        Insert: {
          amount: number
          category: string
          category_id?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          expense_date?: string
          id?: string
          receipt_path?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          category_id?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          expense_date?: string
          id?: string
          receipt_path?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_expenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_categories: {
        Row: {
          color: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          name_en: string
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          name_en: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          name_en?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_categories_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      installment_plans: {
        Row: {
          amount: number
          created_at: string
          due_date: string
          id: string
          installment_number: number
          is_paid: boolean
          paid_date: string | null
          payment_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          due_date: string
          id?: string
          installment_number: number
          is_paid?: boolean
          paid_date?: string | null
          payment_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string
          id?: string
          installment_number?: number
          is_paid?: boolean
          paid_date?: string | null
          payment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "installment_plans_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "patient_detailed_installments"
            referencedColumns: ["payment_id"]
          },
          {
            foreignKeyName: "installment_plans_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_records: {
        Row: {
          appointment_id: string | null
          created_at: string
          created_by: string
          description: string | null
          file_path: string | null
          file_size: number | null
          id: string
          mime_type: string | null
          patient_id: string
          record_type: string
          title: string
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          mime_type?: string | null
          patient_id: string
          record_type: string
          title: string
        }
        Update: {
          appointment_id?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          mime_type?: string | null
          patient_id?: string
          record_type?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_records_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_records_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "patient_detailed_installments"
            referencedColumns: ["appointment_id"]
          },
          {
            foreignKeyName: "medical_records_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "patient_detailed_services"
            referencedColumns: ["appointment_id"]
          },
          {
            foreignKeyName: "medical_records_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_comprehensive_report"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_detailed_installments"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "medical_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_detailed_services"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "medical_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_financial_summary: {
        Row: {
          created_at: string
          id: string
          last_appointment_date: string | null
          last_payment_date: string | null
          patient_id: string
          total_amount: number
          total_appointments: number
          total_paid: number
          total_pending: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_appointment_date?: string | null
          last_payment_date?: string | null
          patient_id: string
          total_amount?: number
          total_appointments?: number
          total_paid?: number
          total_pending?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_appointment_date?: string | null
          last_payment_date?: string | null
          patient_id?: string
          total_amount?: number
          total_appointments?: number
          total_paid?: number
          total_pending?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_financial_summary_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: true
            referencedRelation: "patient_comprehensive_report"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_financial_summary_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: true
            referencedRelation: "patient_detailed_installments"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "patient_financial_summary_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: true
            referencedRelation: "patient_detailed_services"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "patient_financial_summary_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: true
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          address: string | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          full_name: string
          id: string
          medical_history: string | null
          notes: string | null
          phone: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          full_name: string
          id?: string
          medical_history?: string | null
          notes?: string | null
          phone: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          full_name?: string
          id?: string
          medical_history?: string | null
          notes?: string | null
          phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          appointment_id: string
          created_at: string
          id: string
          notes: string | null
          paid_amount: number
          patient_id: string
          payment_date: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          appointment_id: string
          created_at?: string
          id?: string
          notes?: string | null
          paid_amount?: number
          patient_id: string
          payment_date?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          appointment_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          paid_amount?: number
          patient_id?: string
          payment_date?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "patient_detailed_installments"
            referencedColumns: ["appointment_id"]
          },
          {
            foreignKeyName: "payments_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "patient_detailed_services"
            referencedColumns: ["appointment_id"]
          },
          {
            foreignKeyName: "payments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_comprehensive_report"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_detailed_installments"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "payments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_detailed_services"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "payments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          emergency_contact: string | null
          employee_id: string | null
          full_name: string
          hire_date: string | null
          id: string
          is_active: boolean
          notes: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          salary: number | null
          specialization: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emergency_contact?: string | null
          employee_id?: string | null
          full_name: string
          hire_date?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          salary?: number | null
          specialization?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          emergency_contact?: string | null
          employee_id?: string | null
          full_name?: string
          hire_date?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          salary?: number | null
          specialization?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      service_categories: {
        Row: {
          color: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          name_en: string
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          name_en: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          name_en?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_categories_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          calendar_type: string
          clinic_description: string | null
          clinic_name: string
          created_at: string
          created_by: string
          currency: string | null
          currency_symbol: string | null
          date_format: string | null
          id: string
          language: string
          time_format: string
          timezone: string | null
          updated_at: string
        }
        Insert: {
          calendar_type?: string
          clinic_description?: string | null
          clinic_name?: string
          created_at?: string
          created_by: string
          currency?: string | null
          currency_symbol?: string | null
          date_format?: string | null
          id?: string
          language?: string
          time_format?: string
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          calendar_type?: string
          clinic_description?: string | null
          clinic_name?: string
          created_at?: string
          created_by?: string
          currency?: string | null
          currency_symbol?: string | null
          date_format?: string | null
          id?: string
          language?: string
          time_format?: string
          timezone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "system_settings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_services: {
        Row: {
          category: string
          category_id: string | null
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          is_active: boolean
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          category?: string
          category_id?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean
          name: string
          price?: number
          updated_at?: string
        }
        Update: {
          category?: string
          category_id?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatment_services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      patient_comprehensive_report: {
        Row: {
          address: string | null
          completed_appointments: number | null
          date_of_birth: string | null
          email: string | null
          first_appointment_date: string | null
          full_name: string | null
          id: string | null
          last_appointment_date: string | null
          medical_history: string | null
          next_installment_date: string | null
          outstanding_balance: number | null
          patient_notes: string | null
          patient_since: string | null
          pending_installments: number | null
          pending_installments_amount: number | null
          phone: string | null
          scheduled_appointments: number | null
          total_appointments: number | null
          total_installments: number | null
          total_paid: number | null
          total_treatment_cost: number | null
          treatment_plans: string | null
        }
        Relationships: []
      }
      patient_detailed_installments: {
        Row: {
          appointment_date: string | null
          appointment_id: string | null
          days_overdue: number | null
          due_date: string | null
          full_name: string | null
          installment_amount: number | null
          installment_id: string | null
          installment_number: number | null
          installment_status: string | null
          is_paid: boolean | null
          paid_date: string | null
          patient_id: string | null
          payment_id: string | null
          total_payment_amount: number | null
        }
        Relationships: []
      }
      patient_detailed_services: {
        Row: {
          appointment_id: string | null
          appointment_service_notes: string | null
          appointment_status:
            | Database["public"]["Enums"]["appointment_status"]
            | null
          full_name: string | null
          patient_id: string | null
          quantity: number | null
          scheduled_date: string | null
          scheduled_time: string | null
          service_category: string | null
          service_description: string | null
          service_name: string | null
          service_notes: string | null
          total_price: number | null
          unit_price: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_patient_installments_summary: {
        Args: { patient_id_param: string }
        Returns: {
          total_installments: number
          paid_installments: number
          pending_installments: number
          overdue_installments: number
          total_amount: number
          paid_amount: number
          pending_amount: number
          overdue_amount: number
          next_due_date: string
          next_due_amount: number
        }[]
      }
      recalculate_appointment_total: {
        Args: { appointment_id_param: string }
        Returns: undefined
      }
    }
    Enums: {
      appointment_status:
        | "scheduled"
        | "confirmed"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "no_show"
      appointment_type: "regular" | "emergency" | "consultation" | "treatment"
      payment_method: "cash" | "cliq" | "installment"
      payment_status: "pending" | "paid" | "partial" | "cancelled"
      user_role: "doctor" | "receptionist" | "nurse" | "admin"
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
      appointment_status: [
        "scheduled",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
        "no_show",
      ],
      appointment_type: ["regular", "emergency", "consultation", "treatment"],
      payment_method: ["cash", "cliq", "installment"],
      payment_status: ["pending", "paid", "partial", "cancelled"],
      user_role: ["doctor", "receptionist", "nurse", "admin"],
    },
  },
} as const

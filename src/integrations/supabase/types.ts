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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      active_shifts: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          platform_id: string | null
          start_km: number
          started_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          platform_id?: string | null
          start_km?: number
          started_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          platform_id?: string | null
          start_km?: number
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "active_shifts_platform_id_fkey"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "platforms"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_alerts: {
        Row: {
          created_at: string
          event_type: string
          id: string
          is_read: boolean
          message: string
          user_email: string | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          is_read?: boolean
          message: string
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          is_read?: boolean
          message?: string
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
      admin_logs: {
        Row: {
          action: string
          admin_id: string | null
          created_at: string
          details: Json | null
          id: string
          target_user_id: string | null
        }
        Insert: {
          action: string
          admin_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          target_user_id?: string | null
        }
        Update: {
          action?: string
          admin_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          target_user_id?: string | null
        }
        Relationships: []
      }
      earnings: {
        Row: {
          amount: number
          created_at: string
          date: string
          earning_type: Database["public"]["Enums"]["earning_type"]
          id: string
          notes: string | null
          payment_type: Database["public"]["Enums"]["payment_type"]
          platform_id: string | null
          service_count: number
          service_type: Database["public"]["Enums"]["service_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          date?: string
          earning_type?: Database["public"]["Enums"]["earning_type"]
          id?: string
          notes?: string | null
          payment_type?: Database["public"]["Enums"]["payment_type"]
          platform_id?: string | null
          service_count?: number
          service_type?: Database["public"]["Enums"]["service_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          earning_type?: Database["public"]["Enums"]["earning_type"]
          id?: string
          notes?: string | null
          payment_type?: Database["public"]["Enums"]["payment_type"]
          platform_id?: string | null
          service_count?: number
          service_type?: Database["public"]["Enums"]["service_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "earnings_platform_id_fkey"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "platforms"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: Database["public"]["Enums"]["expense_category"]
          created_at: string
          date: string
          id: string
          notes: string | null
          platform_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          platform_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          platform_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_platform_id_fkey"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "platforms"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_intents: {
        Row: {
          completed_at: string | null
          created_at: string
          expires_at: string
          id: string
          plan_type: string
          status: string
          user_email: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          plan_type?: string
          status?: string
          user_email: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          plan_type?: string
          status?: string
          user_email?: string
          user_id?: string
        }
        Relationships: []
      }
      pending_payments: {
        Row: {
          amount: number
          created_at: string
          email: string
          id: string
          intent_id: string | null
          linked_at: string | null
          linked_by: string | null
          linked_user_id: string | null
          payment_data: Json | null
          status: string
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          email: string
          id?: string
          intent_id?: string | null
          linked_at?: string | null
          linked_by?: string | null
          linked_user_id?: string | null
          payment_data?: Json | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          email?: string
          id?: string
          intent_id?: string | null
          linked_at?: string | null
          linked_by?: string | null
          linked_user_id?: string | null
          payment_data?: Json | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_payments_intent_id_fkey"
            columns: ["intent_id"]
            isOneToOne: false
            referencedRelation: "payment_intents"
            referencedColumns: ["id"]
          },
        ]
      }
      platforms: {
        Row: {
          color: string | null
          created_at: string
          icon: string | null
          id: string
          is_default: boolean
          name: string
          user_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_default?: boolean
          name: string
          user_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_default?: boolean
          name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          is_blocked: boolean
          last_login_at: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id?: string
          is_blocked?: boolean
          last_login_at?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          is_blocked?: boolean
          last_login_at?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shifts: {
        Row: {
          created_at: string
          date: string
          hours_worked: number
          id: string
          km_driven: number
          platform_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          hours_worked?: number
          id?: string
          km_driven?: number
          platform_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          hours_worked?: number
          id?: string
          km_driven?: number
          platform_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shifts_platform_id_fkey"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "platforms"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          started_at: string
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          started_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          started_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          admin_reply: string | null
          created_at: string
          id: string
          message: string
          replied_at: string | null
          replied_by: string | null
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_reply?: string | null
          created_at?: string
          id?: string
          message: string
          replied_at?: string | null
          replied_by?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_reply?: string | null
          created_at?: string
          id?: string
          message?: string
          replied_at?: string | null
          replied_by?: string | null
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_gamification: {
        Row: {
          created_at: string
          current_streak: number
          id: string
          last_activity_date: string | null
          level: number
          longest_streak: number
          total_earnings: number
          total_hours: number
          total_km: number
          total_services: number
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          created_at?: string
          current_streak?: number
          id?: string
          last_activity_date?: string | null
          level?: number
          longest_streak?: number
          total_earnings?: number
          total_hours?: number
          total_km?: number
          total_services?: number
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          created_at?: string
          current_streak?: number
          id?: string
          last_activity_date?: string | null
          level?: number
          longest_streak?: number
          total_earnings?: number
          total_hours?: number
          total_km?: number
          total_services?: number
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
      user_notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          cost_distribution_rule: Database["public"]["Enums"]["cost_distribution_rule"]
          cost_per_km: number
          created_at: string
          id: string
          updated_at: string
          user_id: string
          vehicle_type: Database["public"]["Enums"]["vehicle_type"]
          week_starts_on: string
          weekly_goal_earnings: number
          weekly_goal_hours: number
          weekly_goal_km: number
          weekly_goal_services: number
        }
        Insert: {
          cost_distribution_rule?: Database["public"]["Enums"]["cost_distribution_rule"]
          cost_per_km?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"]
          week_starts_on?: string
          weekly_goal_earnings?: number
          weekly_goal_hours?: number
          weekly_goal_km?: number
          weekly_goal_services?: number
        }
        Update: {
          cost_distribution_rule?: Database["public"]["Enums"]["cost_distribution_rule"]
          cost_per_km?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"]
          week_starts_on?: string
          weekly_goal_earnings?: number
          weekly_goal_hours?: number
          weekly_goal_km?: number
          weekly_goal_services?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_cancel_pending_payment: {
        Args: { _payment_id: string }
        Returns: boolean
      }
      admin_close_ticket: { Args: { _ticket_id: string }; Returns: boolean }
      admin_get_user_for_reset: {
        Args: { _target_user_id: string }
        Returns: Json
      }
      admin_link_payment_to_user: {
        Args: {
          _is_annual?: boolean
          _payment_id: string
          _target_user_id: string
        }
        Returns: boolean
      }
      admin_reply_ticket: {
        Args: { _reply: string; _ticket_id: string }
        Returns: boolean
      }
      admin_reset_monthly_limit: {
        Args: { _target_user_id: string }
        Returns: boolean
      }
      admin_toggle_user_block: {
        Args: { _is_blocked: boolean; _target_user_id: string }
        Returns: boolean
      }
      admin_update_subscription: {
        Args: {
          _expires_at?: string
          _plan: string
          _status: string
          _target_user_id: string
        }
        Returns: boolean
      }
      create_payment_failure_alert: {
        Args: { _error_type?: string; _user_id: string }
        Returns: boolean
      }
      generate_churn_alerts: { Args: never; Returns: number }
      get_admin_alerts: {
        Args: { _limit?: number }
        Returns: {
          created_at: string
          event_type: string
          id: string
          is_read: boolean
          message: string
          user_email: string
          user_id: string
          user_name: string
        }[]
      }
      get_admin_logs: {
        Args: { _limit?: number }
        Returns: {
          action: string
          admin_email: string
          created_at: string
          details: Json
          id: string
          target_user_email: string
        }[]
      }
      get_admin_metrics: { Args: never; Returns: Json }
      get_admin_users: {
        Args: never
        Returns: {
          created_at: string
          email: string
          full_name: string
          is_blocked: boolean
          last_login_at: string
          phone: string
          plan: string
          plan_expires_at: string
          plan_started_at: string
          plan_status: string
          user_id: string
        }[]
      }
      get_email_by_phone: { Args: { _phone: string }; Returns: string }
      get_pending_payments: {
        Args: never
        Returns: {
          amount: number
          created_at: string
          email: string
          id: string
          intent_id: string
          linked_at: string
          linked_user_email: string
          linked_user_id: string
          linked_user_name: string
          status: string
          transaction_id: string
        }[]
      }
      get_support_tickets: {
        Args: { _status?: string }
        Returns: {
          admin_reply: string
          created_at: string
          id: string
          message: string
          replied_at: string
          status: string
          subject: string
          user_email: string
          user_id: string
          user_name: string
        }[]
      }
      get_unread_alerts_count: { Args: never; Returns: number }
      get_weekly_goals: { Args: { p_user_id: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      mark_alert_as_read: { Args: { _alert_id: string }; Returns: boolean }
      mark_all_alerts_as_read: { Args: never; Returns: boolean }
      notify_subscription_update: {
        Args: { _plan: string; _status: string; _target_user_id: string }
        Returns: boolean
      }
      verify_user_for_password_reset: {
        Args: { _email: string; _full_name: string; _phone: string }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      cost_distribution_rule: "km" | "horas" | "receita"
      earning_type: "corrida_entrega" | "gorjeta" | "bonus" | "ajuste"
      expense_category:
        | "combustivel"
        | "manutencao"
        | "alimentacao"
        | "seguro"
        | "aluguel"
        | "internet"
        | "pedagio_estacionamento"
        | "outros"
      payment_type: "imediato" | "app"
      service_type: "corrida" | "entrega" | "outro"
      subscription_plan: "free" | "pro"
      subscription_status: "active" | "cancelled" | "expired" | "trialing"
      vehicle_type: "carro" | "moto"
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
      app_role: ["admin", "moderator", "user"],
      cost_distribution_rule: ["km", "horas", "receita"],
      earning_type: ["corrida_entrega", "gorjeta", "bonus", "ajuste"],
      expense_category: [
        "combustivel",
        "manutencao",
        "alimentacao",
        "seguro",
        "aluguel",
        "internet",
        "pedagio_estacionamento",
        "outros",
      ],
      payment_type: ["imediato", "app"],
      service_type: ["corrida", "entrega", "outro"],
      subscription_plan: ["free", "pro"],
      subscription_status: ["active", "cancelled", "expired", "trialing"],
      vehicle_type: ["carro", "moto"],
    },
  },
} as const

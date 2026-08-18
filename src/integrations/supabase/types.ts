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
      artists: {
        Row: {
          created_at: string | null
          description: string | null
          hall_id: string
          id: string
          image_url: string | null
          name: string
          performance_time: string | null
          wedding_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          hall_id: string
          id?: string
          image_url?: string | null
          name: string
          performance_time?: string | null
          wedding_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          hall_id?: string
          id?: string
          image_url?: string | null
          name?: string
          performance_time?: string | null
          wedding_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "artists_hall_id_fkey"
            columns: ["hall_id"]
            isOneToOne: false
            referencedRelation: "wedding_halls"
            referencedColumns: ["id"]
          },
        ]
      }
      banners: {
        Row: {
          created_at: string | null
          hall_id: string
          id: string
          image_url: string
          sort_order: number | null
          title: string | null
          wedding_id: string | null
        }
        Insert: {
          created_at?: string | null
          hall_id: string
          id?: string
          image_url: string
          sort_order?: number | null
          title?: string | null
          wedding_id?: string | null
        }
        Update: {
          created_at?: string | null
          hall_id?: string
          id?: string
          image_url?: string
          sort_order?: number | null
          title?: string | null
          wedding_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "banners_hall_id_fkey"
            columns: ["hall_id"]
            isOneToOne: false
            referencedRelation: "wedding_halls"
            referencedColumns: ["id"]
          },
        ]
      }
      bride_groom: {
        Row: {
          bride_name: string
          bride_photo: string | null
          created_at: string | null
          groom_name: string
          groom_photo: string | null
          hall_id: string
          id: string
          love_story: string | null
          wedding_date: string | null
          wedding_id: string | null
        }
        Insert: {
          bride_name: string
          bride_photo?: string | null
          created_at?: string | null
          groom_name: string
          groom_photo?: string | null
          hall_id: string
          id?: string
          love_story?: string | null
          wedding_date?: string | null
          wedding_id?: string | null
        }
        Update: {
          bride_name?: string
          bride_photo?: string | null
          created_at?: string | null
          groom_name?: string
          groom_photo?: string | null
          hall_id?: string
          id?: string
          love_story?: string | null
          wedding_date?: string | null
          wedding_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bride_groom_hall_id_fkey"
            columns: ["hall_id"]
            isOneToOne: true
            referencedRelation: "wedding_halls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bride_groom_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      food_items: {
        Row: {
          created_at: string | null
          description: string | null
          hall_id: string
          id: string
          image_url: string | null
          is_today: boolean | null
          name: string
          price: number | null
          wedding_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          hall_id: string
          id?: string
          image_url?: string | null
          is_today?: boolean | null
          name: string
          price?: number | null
          wedding_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          hall_id?: string
          id?: string
          image_url?: string | null
          is_today?: boolean | null
          name?: string
          price?: number | null
          wedding_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "food_items_hall_id_fkey"
            columns: ["hall_id"]
            isOneToOne: false
            referencedRelation: "wedding_halls"
            referencedColumns: ["id"]
          },
        ]
      }
      hall_admins: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          hall_id: string
          id: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          hall_id: string
          id?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          hall_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hall_admins_hall_id_fkey"
            columns: ["hall_id"]
            isOneToOne: false
            referencedRelation: "wedding_halls"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          address: string | null
          bride_name: string
          created_at: string
          final_text: string | null
          groom_name: string
          hall_name: string
          id: string
          invitation_text: string | null
          maps_url: string | null
          music_url: string | null
          phone: string | null
          photos: string[]
          slug: string
          template: string
          updated_at: string
          views: number
          wedding_date: string
          wedding_time: string
          welcome_text: string | null
        }
        Insert: {
          address?: string | null
          bride_name: string
          created_at?: string
          final_text?: string | null
          groom_name: string
          hall_name: string
          id?: string
          invitation_text?: string | null
          maps_url?: string | null
          music_url?: string | null
          phone?: string | null
          photos?: string[]
          slug: string
          template?: string
          updated_at?: string
          views?: number
          wedding_date: string
          wedding_time: string
          welcome_text?: string | null
        }
        Update: {
          address?: string | null
          bride_name?: string
          created_at?: string
          final_text?: string | null
          groom_name?: string
          hall_name?: string
          id?: string
          invitation_text?: string | null
          maps_url?: string | null
          music_url?: string | null
          phone?: string | null
          photos?: string[]
          slug?: string
          template?: string
          updated_at?: string
          views?: number
          wedding_date?: string
          wedding_time?: string
          welcome_text?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          approved: boolean
          approved_at: string | null
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          user_id: string
        }
        Insert: {
          approved?: boolean
          approved_at?: string | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          user_id: string
        }
        Update: {
          approved?: boolean
          approved_at?: string | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      rsvps: {
        Row: {
          attending: boolean
          created_at: string
          guest_name: string
          guests_count: number
          hall_id: string
          id: string
          message: string | null
          phone: string | null
          table_number: string | null
          wedding_id: string | null
        }
        Insert: {
          attending?: boolean
          created_at?: string
          guest_name: string
          guests_count?: number
          hall_id: string
          id?: string
          message?: string | null
          phone?: string | null
          table_number?: string | null
          wedding_id?: string | null
        }
        Update: {
          attending?: boolean
          created_at?: string
          guest_name?: string
          guests_count?: number
          hall_id?: string
          id?: string
          message?: string | null
          phone?: string | null
          table_number?: string | null
          wedding_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rsvps_hall_id_fkey"
            columns: ["hall_id"]
            isOneToOne: false
            referencedRelation: "wedding_halls"
            referencedColumns: ["id"]
          },
        ]
      }
      timeline_events: {
        Row: {
          created_at: string
          description: string | null
          end_time: string | null
          hall_id: string
          icon: string | null
          id: string
          sort_order: number
          start_time: string
          title: string
          updated_at: string
          wedding_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_time?: string | null
          hall_id: string
          icon?: string | null
          id?: string
          sort_order?: number
          start_time: string
          title: string
          updated_at?: string
          wedding_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          end_time?: string | null
          hall_id?: string
          icon?: string | null
          id?: string
          sort_order?: number
          start_time?: string
          title?: string
          updated_at?: string
          wedding_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "timeline_events_hall_id_fkey"
            columns: ["hall_id"]
            isOneToOne: false
            referencedRelation: "wedding_halls"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wedding_halls: {
        Row: {
          address: string | null
          archived: boolean
          archived_at: string | null
          cover_url: string | null
          created_at: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          trial_ends_at: string | null
        }
        Insert: {
          address?: string | null
          archived?: boolean
          archived_at?: string | null
          cover_url?: string | null
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name: string
          phone?: string | null
          trial_ends_at?: string | null
        }
        Update: {
          address?: string | null
          archived?: boolean
          archived_at?: string | null
          cover_url?: string | null
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          trial_ends_at?: string | null
        }
        Relationships: []
      }
      wedding_moments: {
        Row: {
          approved: boolean
          caption: string | null
          created_at: string
          guest_name: string | null
          hall_id: string
          id: string
          image_url: string
          storage_path: string | null
          table_number: string | null
          wedding_id: string | null
        }
        Insert: {
          approved?: boolean
          caption?: string | null
          created_at?: string
          guest_name?: string | null
          hall_id: string
          id?: string
          image_url: string
          storage_path?: string | null
          table_number?: string | null
          wedding_id?: string | null
        }
        Update: {
          approved?: boolean
          caption?: string | null
          created_at?: string
          guest_name?: string | null
          hall_id?: string
          id?: string
          image_url?: string
          storage_path?: string | null
          table_number?: string | null
          wedding_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wedding_moments_hall_id_fkey"
            columns: ["hall_id"]
            isOneToOne: false
            referencedRelation: "wedding_halls"
            referencedColumns: ["id"]
          },
        ]
      }
      weddings: {
        Row: {
          id: string
          hall_id: string
          bride_name: string
          groom_name: string
          wedding_date: string
          cover_image: string | null
          status: string
          archived_at: string | null
          guest_count: number
          qr_scan_count: number
          uploaded_photo_count: number
          rsvp_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          hall_id: string
          bride_name?: string
          groom_name?: string
          wedding_date?: string
          cover_image?: string | null
          status?: string
          archived_at?: string | null
          guest_count?: number
          qr_scan_count?: number
          uploaded_photo_count?: number
          rsvp_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          hall_id?: string
          bride_name?: string
          groom_name?: string
          wedding_date?: string
          cover_image?: string | null
          status?: string
          archived_at?: string | null
          guest_count?: number
          qr_scan_count?: number
          uploaded_photo_count?: number
          rsvp_count?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "weddings_hall_id_fkey"
            columns: ["hall_id"]
            isOneToOne: false
            referencedRelation: "wedding_halls"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          code: string
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          name: string
          period_days: number
          price: number
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
          period_days?: number
          price?: number
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
          period_days?: number
          price?: number
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          auto_renew: boolean
          created_at: string
          expires_at: string
          hall_id: string
          id: string
          plan_id: string
          started_at: string
          status: string
          updated_at: string
        }
        Insert: {
          auto_renew?: boolean
          created_at?: string
          expires_at: string
          hall_id: string
          id?: string
          plan_id: string
          started_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          auto_renew?: boolean
          created_at?: string
          expires_at?: string
          hall_id?: string
          id?: string
          plan_id?: string
          started_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_hall_id_fkey"
            columns: ["hall_id"]
            isOneToOne: false
            referencedRelation: "wedding_halls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          currency: string
          hall_id: string
          id: string
          note: string | null
          paid_at: string
          period_end: string
          period_start: string
          plan_id: string | null
          status: string
          subscription_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          currency?: string
          hall_id: string
          id?: string
          note?: string | null
          paid_at?: string
          period_end: string
          period_start: string
          plan_id?: string | null
          status?: string
          subscription_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          hall_id?: string
          id?: string
          note?: string | null
          paid_at?: string
          period_end?: string
          period_start?: string
          plan_id?: string | null
          status?: string
          subscription_id?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          dedup_key: string | null
          hall_id: string | null
          id: string
          link: string | null
          message: string
          read_at: string | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          dedup_key?: string | null
          hall_id?: string | null
          id?: string
          link?: string | null
          message: string
          read_at?: string | null
          title: string
          type: string
        }
        Update: {
          created_at?: string
          dedup_key?: string | null
          hall_id?: string | null
          id?: string
          link?: string | null
          message?: string
          read_at?: string | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      activity_logs: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          created_at: string
          description: string
          hall_id: string | null
          id: string
          metadata: Json | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          description: string
          hall_id?: string | null
          id?: string
          metadata?: Json | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          description?: string
          hall_id?: string | null
          id?: string
          metadata?: Json | null
        }
        Relationships: []
      }
    }
    Views: {
      [key: string]: never
    }
    Functions: {
      archive_active_wedding: {
        Args: { _hall_id: string; _now?: string }
        Returns: string
      }
      archive_all_active_weddings: {
        Args: { _now?: string }
        Returns: number
      }
      get_user_hall_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_hall_admin: {
        Args: { _hall_id: string; _user_id: string }
        Returns: boolean
      }
      storage_path_hall_id: { Args: { _name: string }; Returns: string }
      today_in_tashkent: { Args: Record<PropertyKey, never>; Returns: string }
      subscription_days_remaining: {
        Args: { _expires_at: string }
        Returns: number
      }
      confirm_subscription_payment: {
        Args: { _hall_id: string; _plan_id: string; _paid_at?: string; _note?: string | null }
        Returns: string
      }
      sync_subscription_notifications: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
    }
    Enums: {
      app_role: "super_admin"
    }
    CompositeTypes: {
      [key: string]: never
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
      app_role: ["super_admin"],
    },
  },
} as const

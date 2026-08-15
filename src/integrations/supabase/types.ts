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
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          hall_id: string
          id?: string
          image_url?: string | null
          name: string
          performance_time?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          hall_id?: string
          id?: string
          image_url?: string | null
          name?: string
          performance_time?: string | null
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
        }
        Insert: {
          created_at?: string | null
          hall_id: string
          id?: string
          image_url: string
          sort_order?: number | null
          title?: string | null
        }
        Update: {
          created_at?: string | null
          hall_id?: string
          id?: string
          image_url?: string
          sort_order?: number | null
          title?: string | null
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
        }
        Relationships: [
          {
            foreignKeyName: "bride_groom_hall_id_fkey"
            columns: ["hall_id"]
            isOneToOne: true
            referencedRelation: "wedding_halls"
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
          created_at: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name: string
          phone?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
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
    }
    Views: {
      [key: string]: never
    }
    Functions: {
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

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
      chat_messages: {
        Row: {
          avatar_url: string | null
          body: string
          created_at: string
          device_id: string
          display_name: string | null
          id: string
          tiktok_username: string
        }
        Insert: {
          avatar_url?: string | null
          body: string
          created_at?: string
          device_id: string
          display_name?: string | null
          id?: string
          tiktok_username: string
        }
        Update: {
          avatar_url?: string | null
          body?: string
          created_at?: string
          device_id?: string
          display_name?: string | null
          id?: string
          tiktok_username?: string
        }
        Relationships: []
      }
      chat_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          device_id: string
          display_name: string | null
          id: string
          tiktok_username: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          device_id: string
          display_name?: string | null
          id?: string
          tiktok_username: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          device_id?: string
          display_name?: string | null
          id?: string
          tiktok_username?: string
          updated_at?: string
        }
        Relationships: []
      }
      gift_items: {
        Row: {
          coins: number
          created_at: string
          gallery: string
          icon_url: string | null
          id: string
          is_gallery: boolean
          lit: boolean
          name: string
          position: number
          remaining: number
          sponsor_id: string | null
          sponsor_name: string | null
          tiktok_gift_id: string | null
        }
        Insert: {
          coins?: number
          created_at?: string
          gallery: string
          icon_url?: string | null
          id?: string
          is_gallery?: boolean
          lit?: boolean
          name: string
          position?: number
          remaining?: number
          sponsor_id?: string | null
          sponsor_name?: string | null
          tiktok_gift_id?: string | null
        }
        Update: {
          coins?: number
          created_at?: string
          gallery?: string
          icon_url?: string | null
          id?: string
          is_gallery?: boolean
          lit?: boolean
          name?: string
          position?: number
          remaining?: number
          sponsor_id?: string | null
          sponsor_name?: string | null
          tiktok_gift_id?: string | null
        }
        Relationships: []
      }
      gift_state: {
        Row: {
          current_gallery: string
          id: number
          league: string | null
          updated_at: string
        }
        Insert: {
          current_gallery?: string
          id?: number
          league?: string | null
          updated_at?: string
        }
        Update: {
          current_gallery?: string
          id?: number
          league?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      live_state: {
        Row: {
          id: number
          is_live: boolean
          last_notified_room_id: string | null
          room_id: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          id?: number
          is_live?: boolean
          last_notified_room_id?: string | null
          room_id?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          id?: number
          is_live?: boolean
          last_notified_room_id?: string | null
          room_id?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      live_tools: {
        Row: {
          created_at: string
          holder_name: string
          id: string
          note: string | null
          position: number
          tool: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          holder_name: string
          id?: string
          note?: string | null
          position?: number
          tool: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          holder_name?: string
          id?: string
          note?: string | null
          position?: number
          tool?: string
          updated_at?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          last_seen_at: string
          p256dh: string
          user_agent: string | null
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          last_seen_at?: string
          p256dh: string
          user_agent?: string | null
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          last_seen_at?: string
          p256dh?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      tiktok_user_names: {
        Row: {
          created_at: string
          name: string
          uid: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          name: string
          uid: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          name?: string
          uid?: string
          updated_at?: string
        }
        Relationships: []
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
    Enums: {},
  },
} as const

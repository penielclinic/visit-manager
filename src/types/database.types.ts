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
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: number
          ip_address: unknown
          new_data: Json | null
          old_data: Json | null
          target_id: string | null
          target_table: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: number
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          target_id?: string | null
          target_table: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: number
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          target_id?: string | null
          target_table?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cells: {
        Row: {
          created_at: string
          description: string | null
          district_id: string
          id: string
          is_active: boolean
          leader_id: string | null
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          district_id: string
          id?: string
          is_active?: boolean
          leader_id?: string | null
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          district_id?: string
          id?: string
          is_active?: boolean
          leader_id?: string | null
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cells_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cells_leader_id_fkey"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      districts: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          leader_id: string | null
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          leader_id?: string | null
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          leader_id?: string | null
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "districts_leader_id_fkey"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      household_members: {
        Row: {
          birth_year: number | null
          created_at: string
          deleted_at: string | null
          faith_status: Database["public"]["Enums"]["faith_status"]
          full_name: string
          gender: Database["public"]["Enums"]["gender"]
          household_id: string
          id: string
          is_active: boolean
          is_primary: boolean
          phone: string | null
          relation: Database["public"]["Enums"]["member_relation"]
          updated_at: string
        }
        Insert: {
          birth_year?: number | null
          created_at?: string
          deleted_at?: string | null
          faith_status?: Database["public"]["Enums"]["faith_status"]
          full_name: string
          gender?: Database["public"]["Enums"]["gender"]
          household_id: string
          id?: string
          is_active?: boolean
          is_primary?: boolean
          phone?: string | null
          relation?: Database["public"]["Enums"]["member_relation"]
          updated_at?: string
        }
        Update: {
          birth_year?: number | null
          created_at?: string
          deleted_at?: string | null
          faith_status?: Database["public"]["Enums"]["faith_status"]
          full_name?: string
          gender?: Database["public"]["Enums"]["gender"]
          household_id?: string
          id?: string
          is_active?: boolean
          is_primary?: boolean
          phone?: string | null
          relation?: Database["public"]["Enums"]["member_relation"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "household_members_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      households: {
        Row: {
          address_detail: string | null
          address_full: string | null
          cell_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          geocoded_at: string | null
          household_name: string
          id: string
          import_batch_id: string | null
          imported_at: string | null
          latitude: number | null
          longitude: number | null
          notes: string | null
          phone_primary: string | null
          phone_secondary: string | null
          representative_name: string
          status: Database["public"]["Enums"]["household_status"]
          updated_at: string
        }
        Insert: {
          address_detail?: string | null
          address_full?: string | null
          cell_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          geocoded_at?: string | null
          household_name: string
          id?: string
          import_batch_id?: string | null
          imported_at?: string | null
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          phone_primary?: string | null
          phone_secondary?: string | null
          representative_name: string
          status?: Database["public"]["Enums"]["household_status"]
          updated_at?: string
        }
        Update: {
          address_detail?: string | null
          address_full?: string | null
          cell_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          geocoded_at?: string | null
          household_name?: string
          id?: string
          import_batch_id?: string | null
          imported_at?: string | null
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          phone_primary?: string | null
          phone_secondary?: string | null
          representative_name?: string
          status?: Database["public"]["Enums"]["household_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "households_cell_id_fkey"
            columns: ["cell_id"]
            isOneToOne: false
            referencedRelation: "cells"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "households_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prayer_requests: {
        Row: {
          answered_at: string | null
          answered_note: string | null
          content: string
          created_at: string
          created_by: string
          deleted_at: string | null
          household_id: string
          id: string
          is_answered: boolean
          member_id: string | null
          record_id: string
          updated_at: string
        }
        Insert: {
          answered_at?: string | null
          answered_note?: string | null
          content: string
          created_at?: string
          created_by: string
          deleted_at?: string | null
          household_id: string
          id?: string
          is_answered?: boolean
          member_id?: string | null
          record_id: string
          updated_at?: string
        }
        Update: {
          answered_at?: string | null
          answered_note?: string | null
          content?: string
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          household_id?: string
          id?: string
          is_answered?: boolean
          member_id?: string | null
          record_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prayer_requests_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prayer_requests_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prayer_requests_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "household_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prayer_requests_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "visit_records"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          assigned_cell_id: string | null
          assigned_district_id: string | null
          avatar_url: string | null
          created_at: string
          display_name: string | null
          full_name: string
          id: string
          is_active: boolean
          kakao_id: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          assigned_cell_id?: string | null
          assigned_district_id?: string | null
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          full_name: string
          id: string
          is_active?: boolean
          kakao_id?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          assigned_cell_id?: string | null
          assigned_district_id?: string | null
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          kakao_id?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_assigned_cell_id_fkey"
            columns: ["assigned_cell_id"]
            isOneToOne: false
            referencedRelation: "cells"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_assigned_district_id_fkey"
            columns: ["assigned_district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_records: {
        Row: {
          ai_follow_up: string | null
          ai_summary: string | null
          attending_member_ids: string[] | null
          content: string | null
          created_at: string
          deleted_at: string | null
          duration_actual_min: number | null
          household_id: string
          id: string
          schedule_id: string | null
          special_notes: string | null
          status: Database["public"]["Enums"]["record_status"]
          updated_at: string
          visit_type: Database["public"]["Enums"]["visit_type"]
          visited_at: string
          visited_by: string
        }
        Insert: {
          ai_follow_up?: string | null
          ai_summary?: string | null
          attending_member_ids?: string[] | null
          content?: string | null
          created_at?: string
          deleted_at?: string | null
          duration_actual_min?: number | null
          household_id: string
          id?: string
          schedule_id?: string | null
          special_notes?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
          visit_type?: Database["public"]["Enums"]["visit_type"]
          visited_at?: string
          visited_by: string
        }
        Update: {
          ai_follow_up?: string | null
          ai_summary?: string | null
          attending_member_ids?: string[] | null
          content?: string | null
          created_at?: string
          deleted_at?: string | null
          duration_actual_min?: number | null
          household_id?: string
          id?: string
          schedule_id?: string | null
          special_notes?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
          visit_type?: Database["public"]["Enums"]["visit_type"]
          visited_at?: string
          visited_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_records_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_records_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "visit_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_records_visited_by_fkey"
            columns: ["visited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_routes: {
        Row: {
          created_at: string
          created_by: string
          id: string
          optimization_algo: string | null
          ordered_schedule_ids: string[]
          route_date: string
          route_geojson: Json | null
          total_distance_m: number | null
          total_duration_sec: number | null
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          optimization_algo?: string | null
          ordered_schedule_ids: string[]
          route_date: string
          route_geojson?: Json | null
          total_distance_m?: number | null
          total_duration_sec?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          optimization_algo?: string | null
          ordered_schedule_ids?: string[]
          route_date?: string
          route_geojson?: Json | null
          total_distance_m?: number | null
          total_duration_sec?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "visit_routes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_schedules: {
        Row: {
          assigned_to: string | null
          created_at: string
          created_by: string
          deleted_at: string | null
          duration_min: number | null
          household_id: string
          id: string
          memo: string | null
          scheduled_date: string
          scheduled_time: string | null
          status: Database["public"]["Enums"]["visit_status"]
          updated_at: string
          visit_order: number | null
          visit_type: Database["public"]["Enums"]["visit_type"]
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          created_by: string
          deleted_at?: string | null
          duration_min?: number | null
          household_id: string
          id?: string
          memo?: string | null
          scheduled_date: string
          scheduled_time?: string | null
          status?: Database["public"]["Enums"]["visit_status"]
          updated_at?: string
          visit_order?: number | null
          visit_type?: Database["public"]["Enums"]["visit_type"]
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          duration_min?: number | null
          household_id?: string
          id?: string
          memo?: string | null
          scheduled_date?: string
          scheduled_time?: string | null
          status?: Database["public"]["Enums"]["visit_status"]
          updated_at?: string
          visit_order?: number | null
          visit_type?: Database["public"]["Enums"]["visit_type"]
        }
        Relationships: [
          {
            foreignKeyName: "visit_schedules_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_schedules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_schedules_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_recordings: {
        Row: {
          ai_result: Json | null
          created_at: string
          deleted_at: string | null
          duration_sec: number | null
          error_message: string | null
          file_name: string
          file_size_bytes: number | null
          household_id: string
          id: string
          mime_type: string
          processed_at: string | null
          record_id: string
          status: Database["public"]["Enums"]["recording_status"]
          storage_path: string
          transcript: string | null
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          ai_result?: Json | null
          created_at?: string
          deleted_at?: string | null
          duration_sec?: number | null
          error_message?: string | null
          file_name: string
          file_size_bytes?: number | null
          household_id: string
          id?: string
          mime_type?: string
          processed_at?: string | null
          record_id: string
          status?: Database["public"]["Enums"]["recording_status"]
          storage_path: string
          transcript?: string | null
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          ai_result?: Json | null
          created_at?: string
          deleted_at?: string | null
          duration_sec?: number | null
          error_message?: string | null
          file_name?: string
          file_size_bytes?: number | null
          household_id?: string
          id?: string
          mime_type?: string
          processed_at?: string | null
          record_id?: string
          status?: Database["public"]["Enums"]["recording_status"]
          storage_path?: string
          transcript?: string | null
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "voice_recordings_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_recordings_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "visit_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_recordings_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_household: {
        Args: { p_household_id: string }
        Returns: boolean
      }
      my_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
    }
    Enums: {
      faith_status:
        | "registered"
        | "unbaptized"
        | "baptized"
        | "confirmed"
        | "long_absent"
        | "withdrawn"
      gender: "male" | "female" | "undisclosed"
      household_status: "active" | "inactive" | "moved" | "withdrawn"
      member_relation:
        | "head"
        | "spouse"
        | "child"
        | "parent"
        | "sibling"
        | "other"
      record_status: "draft" | "final"
      recording_status: "uploading" | "processing" | "completed" | "failed"
      user_role:
        | "senior_pastor"
        | "associate_pastor"
        | "officer"
        | "district_leader"
        | "cell_leader"
        | "member"
      visit_status:
        | "scheduled"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "postponed"
      visit_type: "regular" | "special" | "new_member" | "follow_up"
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
      faith_status: [
        "registered",
        "unbaptized",
        "baptized",
        "confirmed",
        "long_absent",
        "withdrawn",
      ],
      gender: ["male", "female", "undisclosed"],
      household_status: ["active", "inactive", "moved", "withdrawn"],
      member_relation: [
        "head",
        "spouse",
        "child",
        "parent",
        "sibling",
        "other",
      ],
      record_status: ["draft", "final"],
      recording_status: ["uploading", "processing", "completed", "failed"],
      user_role: [
        "senior_pastor",
        "associate_pastor",
        "officer",
        "district_leader",
        "cell_leader",
        "member",
      ],
      visit_status: [
        "scheduled",
        "in_progress",
        "completed",
        "cancelled",
        "postponed",
      ],
      visit_type: ["regular", "special", "new_member", "follow_up"],
    },
  },
} as const

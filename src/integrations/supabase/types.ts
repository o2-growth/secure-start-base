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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          card_id: string
          created_at: string
          created_by: string | null
          id: string
          payload: Json | null
          type: string
        }
        Insert: {
          card_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          payload?: Json | null
          type: string
        }
        Update: {
          card_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          payload?: Json | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_rules: {
        Row: {
          actions: Json | null
          active: boolean
          conditions: Json | null
          created_at: string
          id: string
          pipeline_id: string
          trigger_type: Database["public"]["Enums"]["automation_trigger"]
        }
        Insert: {
          actions?: Json | null
          active?: boolean
          conditions?: Json | null
          created_at?: string
          id?: string
          pipeline_id: string
          trigger_type: Database["public"]["Enums"]["automation_trigger"]
        }
        Update: {
          actions?: Json | null
          active?: boolean
          conditions?: Json | null
          created_at?: string
          id?: string
          pipeline_id?: string
          trigger_type?: Database["public"]["Enums"]["automation_trigger"]
        }
        Relationships: [
          {
            foreignKeyName: "automation_rules_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_runs: {
        Row: {
          card_id: string | null
          error_message: string | null
          executed_at: string
          id: string
          rule_id: string
          status: string
        }
        Insert: {
          card_id?: string | null
          error_message?: string | null
          executed_at?: string
          id?: string
          rule_id: string
          status?: string
        }
        Update: {
          card_id?: string | null
          error_message?: string | null
          executed_at?: string
          id?: string
          rule_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_runs_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "automation_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      business_units: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          organization_id: string
          slug: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          organization_id: string
          slug: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_units_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      card_field_values: {
        Row: {
          card_id: string
          created_at: string
          id: string
          pipeline_field_id: string
          updated_by: string | null
          value: Json | null
        }
        Insert: {
          card_id: string
          created_at?: string
          id?: string
          pipeline_field_id: string
          updated_by?: string | null
          value?: Json | null
        }
        Update: {
          card_id?: string
          created_at?: string
          id?: string
          pipeline_field_id?: string
          updated_by?: string | null
          value?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "card_field_values_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_field_values_pipeline_field_id_fkey"
            columns: ["pipeline_field_id"]
            isOneToOne: false
            referencedRelation: "pipeline_fields"
            referencedColumns: ["id"]
          },
        ]
      }
      cards: {
        Row: {
          contract_status: string | null
          created_at: string
          current_phase_id: string
          id: string
          lead_id: string
          origin: string
          owner_profile_id: string | null
          pipeline_id: string
          status: string
          updated_at: string
        }
        Insert: {
          contract_status?: string | null
          created_at?: string
          current_phase_id: string
          id?: string
          lead_id: string
          origin?: string
          owner_profile_id?: string | null
          pipeline_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          contract_status?: string | null
          created_at?: string
          current_phase_id?: string
          id?: string
          lead_id?: string
          origin?: string
          owner_profile_id?: string | null
          pipeline_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cards_current_phase_id_fkey"
            columns: ["current_phase_id"]
            isOneToOne: false
            referencedRelation: "pipeline_phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cards_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cards_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cards_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          card_id: string
          content: Json | null
          created_at: string
          id: string
          status: string
          updated_at: string
        }
        Insert: {
          card_id: string
          content?: Json | null
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
        }
        Update: {
          card_id?: string
          content?: Json | null
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_connections: {
        Row: {
          active: boolean
          config: Json | null
          created_at: string
          id: string
          last_sync_at: string | null
          organization_id: string
          provider: string
        }
        Insert: {
          active?: boolean
          config?: Json | null
          created_at?: string
          id?: string
          last_sync_at?: string | null
          organization_id: string
          provider: string
        }
        Update: {
          active?: boolean
          config?: Json | null
          created_at?: string
          id?: string
          last_sync_at?: string | null
          organization_id?: string
          provider?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_connections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          company_name: string | null
          created_at: string
          document: string | null
          email: string | null
          full_name: string
          id: string
          organization_id: string | null
          phone: string | null
          source: string | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          document?: string | null
          email?: string | null
          full_name: string
          id?: string
          organization_id?: string | null
          phone?: string | null
          source?: string | null
        }
        Update: {
          company_name?: string | null
          created_at?: string
          document?: string | null
          email?: string | null
          full_name?: string
          id?: string
          organization_id?: string | null
          phone?: string | null
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_records: {
        Row: {
          card_id: string
          created_at: string
          external_id: string | null
          id: string
          meeting_url: string | null
          occurred_at: string
          provider: string
          summary: string | null
        }
        Insert: {
          card_id: string
          created_at?: string
          external_id?: string | null
          id?: string
          meeting_url?: string | null
          occurred_at?: string
          provider?: string
          summary?: string | null
        }
        Update: {
          card_id?: string
          created_at?: string
          external_id?: string | null
          id?: string
          meeting_url?: string | null
          occurred_at?: string
          provider?: string
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_records_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
        ]
      }
      message_templates: {
        Row: {
          active: boolean
          body: string
          category: string
          channel: Database["public"]["Enums"]["message_channel"]
          created_at: string
          id: string
          name: string
          subject: string | null
        }
        Insert: {
          active?: boolean
          body?: string
          category?: string
          channel?: Database["public"]["Enums"]["message_channel"]
          created_at?: string
          id?: string
          name: string
          subject?: string | null
        }
        Update: {
          active?: boolean
          body?: string
          category?: string
          channel?: Database["public"]["Enums"]["message_channel"]
          created_at?: string
          id?: string
          name?: string
          subject?: string | null
        }
        Relationships: []
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          type: Database["public"]["Enums"]["org_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          type?: Database["public"]["Enums"]["org_type"]
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          type?: Database["public"]["Enums"]["org_type"]
        }
        Relationships: []
      }
      pipeline_fields: {
        Row: {
          created_at: string
          id: string
          key: string
          label: string
          options: Json | null
          phase_id: string | null
          pipeline_id: string
          position: number
          required: boolean
          type: Database["public"]["Enums"]["field_type"]
          visible_on_card: boolean
          visible_on_start_form: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          label: string
          options?: Json | null
          phase_id?: string | null
          pipeline_id: string
          position?: number
          required?: boolean
          type?: Database["public"]["Enums"]["field_type"]
          visible_on_card?: boolean
          visible_on_start_form?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          label?: string
          options?: Json | null
          phase_id?: string | null
          pipeline_id?: string
          position?: number
          required?: boolean
          type?: Database["public"]["Enums"]["field_type"]
          visible_on_card?: boolean
          visible_on_start_form?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_fields_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "pipeline_phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipeline_fields_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_phases: {
        Row: {
          created_at: string
          id: string
          is_final: boolean
          name: string
          pipeline_id: string
          position: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_final?: boolean
          name: string
          pipeline_id: string
          position?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_final?: boolean
          name?: string
          pipeline_id?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_phases_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
        ]
      }
      pipelines: {
        Row: {
          active: boolean
          audience: Database["public"]["Enums"]["pipeline_audience"]
          business_unit_id: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          active?: boolean
          audience?: Database["public"]["Enums"]["pipeline_audience"]
          business_unit_id: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          active?: boolean
          audience?: Database["public"]["Enums"]["pipeline_audience"]
          business_unit_id?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipelines_business_unit_id_fkey"
            columns: ["business_unit_id"]
            isOneToOne: false
            referencedRelation: "business_units"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean
          auth_user_id: string
          business_unit_id: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          organization_id: string | null
        }
        Insert: {
          active?: boolean
          auth_user_id: string
          business_unit_id?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          organization_id?: string | null
        }
        Update: {
          active?: boolean
          auth_user_id?: string
          business_unit_id?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_business_unit_id_fkey"
            columns: ["business_unit_id"]
            isOneToOne: false
            referencedRelation: "business_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "enablement" | "head" | "closer" | "sdr" | "bdr"
      automation_trigger:
        | "phase_change"
        | "field_update"
        | "time_based"
        | "lead_created"
      field_type:
        | "text"
        | "number"
        | "email"
        | "textarea"
        | "select"
        | "date"
        | "phone"
      message_channel: "email" | "whatsapp"
      org_type: "hq" | "franchise"
      pipeline_audience: "internal" | "franchise"
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
      app_role: ["admin", "enablement", "head", "closer", "sdr", "bdr"],
      automation_trigger: [
        "phase_change",
        "field_update",
        "time_based",
        "lead_created",
      ],
      field_type: [
        "text",
        "number",
        "email",
        "textarea",
        "select",
        "date",
        "phone",
      ],
      message_channel: ["email", "whatsapp"],
      org_type: ["hq", "franchise"],
      pipeline_audience: ["internal", "franchise"],
    },
  },
} as const

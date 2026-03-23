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
          payload: Json
          type: Database["public"]["Enums"]["activity_type"]
        }
        Insert: {
          card_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          payload?: Json
          type: Database["public"]["Enums"]["activity_type"]
        }
        Update: {
          card_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          payload?: Json
          type?: Database["public"]["Enums"]["activity_type"]
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
          actions: Json
          active: boolean
          conditions: Json
          created_at: string
          id: string
          pipeline_id: string
          trigger_type: Database["public"]["Enums"]["automation_trigger"]
        }
        Insert: {
          actions?: Json
          active?: boolean
          conditions?: Json
          created_at?: string
          id?: string
          pipeline_id: string
          trigger_type: Database["public"]["Enums"]["automation_trigger"]
        }
        Update: {
          actions?: Json
          active?: boolean
          conditions?: Json
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
          card_id: string
          error_message: string | null
          executed_at: string | null
          id: string
          input_payload: Json | null
          output_payload: Json | null
          rule_id: string
          status: Database["public"]["Enums"]["automation_run_status"]
        }
        Insert: {
          card_id: string
          error_message?: string | null
          executed_at?: string | null
          id?: string
          input_payload?: Json | null
          output_payload?: Json | null
          rule_id: string
          status?: Database["public"]["Enums"]["automation_run_status"]
        }
        Update: {
          card_id?: string
          error_message?: string | null
          executed_at?: string | null
          id?: string
          input_payload?: Json | null
          output_payload?: Json | null
          rule_id?: string
          status?: Database["public"]["Enums"]["automation_run_status"]
        }
        Relationships: [
          {
            foreignKeyName: "automation_runs_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
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
          id: string
          pipeline_field_id: string
          updated_at: string
          updated_by: string | null
          value: Json | null
        }
        Insert: {
          card_id: string
          id?: string
          pipeline_field_id: string
          updated_at?: string
          updated_by?: string | null
          value?: Json | null
        }
        Update: {
          card_id?: string
          id?: string
          pipeline_field_id?: string
          updated_at?: string
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
          contract_status: Database["public"]["Enums"]["contract_status"] | null
          created_at: string
          current_phase_id: string
          id: string
          lead_id: string
          origin: Database["public"]["Enums"]["card_origin"]
          owner_profile_id: string | null
          pipeline_id: string
          status: Database["public"]["Enums"]["card_status"]
          updated_at: string
        }
        Insert: {
          contract_status?:
            | Database["public"]["Enums"]["contract_status"]
            | null
          created_at?: string
          current_phase_id: string
          id?: string
          lead_id: string
          origin?: Database["public"]["Enums"]["card_origin"]
          owner_profile_id?: string | null
          pipeline_id: string
          status?: Database["public"]["Enums"]["card_status"]
          updated_at?: string
        }
        Update: {
          contract_status?:
            | Database["public"]["Enums"]["contract_status"]
            | null
          created_at?: string
          current_phase_id?: string
          id?: string
          lead_id?: string
          origin?: Database["public"]["Enums"]["card_origin"]
          owner_profile_id?: string | null
          pipeline_id?: string
          status?: Database["public"]["Enums"]["card_status"]
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
          created_at: string
          external_contract_id: string | null
          id: string
          payload: Json
          provider: string
          status: Database["public"]["Enums"]["contract_status"]
          updated_at: string
        }
        Insert: {
          card_id: string
          created_at?: string
          external_contract_id?: string | null
          id?: string
          payload?: Json
          provider?: string
          status?: Database["public"]["Enums"]["contract_status"]
          updated_at?: string
        }
        Update: {
          card_id?: string
          created_at?: string
          external_contract_id?: string | null
          id?: string
          payload?: Json
          provider?: string
          status?: Database["public"]["Enums"]["contract_status"]
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
          created_at: string
          encrypted_config: string | null
          id: string
          last_sync_at: string | null
          organization_id: string | null
          provider: Database["public"]["Enums"]["integration_provider"]
        }
        Insert: {
          active?: boolean
          created_at?: string
          encrypted_config?: string | null
          id?: string
          last_sync_at?: string | null
          organization_id?: string | null
          provider: Database["public"]["Enums"]["integration_provider"]
        }
        Update: {
          active?: boolean
          created_at?: string
          encrypted_config?: string | null
          id?: string
          last_sync_at?: string | null
          organization_id?: string | null
          provider?: Database["public"]["Enums"]["integration_provider"]
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
          business_unit_id: string
          company_name: string | null
          created_at: string
          created_by: string
          dedupe_hash: string | null
          document: string | null
          email: string | null
          full_name: string
          id: string
          organization_id: string
          phone: string | null
          source: string | null
        }
        Insert: {
          business_unit_id: string
          company_name?: string | null
          created_at?: string
          created_by: string
          dedupe_hash?: string | null
          document?: string | null
          email?: string | null
          full_name: string
          id?: string
          organization_id: string
          phone?: string | null
          source?: string | null
        }
        Update: {
          business_unit_id?: string
          company_name?: string | null
          created_at?: string
          created_by?: string
          dedupe_hash?: string | null
          document?: string | null
          email?: string | null
          full_name?: string
          id?: string
          organization_id?: string
          phone?: string | null
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_business_unit_id_fkey"
            columns: ["business_unit_id"]
            isOneToOne: false
            referencedRelation: "business_units"
            referencedColumns: ["id"]
          },
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
          ai_extract: Json | null
          card_id: string
          created_at: string
          id: string
          meeting_external_id: string | null
          meeting_url: string | null
          occurred_at: string | null
          provider: Database["public"]["Enums"]["meeting_provider"]
          recording_url: string | null
          summary: string | null
          transcript_text: string | null
        }
        Insert: {
          ai_extract?: Json | null
          card_id: string
          created_at?: string
          id?: string
          meeting_external_id?: string | null
          meeting_url?: string | null
          occurred_at?: string | null
          provider: Database["public"]["Enums"]["meeting_provider"]
          recording_url?: string | null
          summary?: string | null
          transcript_text?: string | null
        }
        Update: {
          ai_extract?: Json | null
          card_id?: string
          created_at?: string
          id?: string
          meeting_external_id?: string | null
          meeting_url?: string | null
          occurred_at?: string | null
          provider?: Database["public"]["Enums"]["meeting_provider"]
          recording_url?: string | null
          summary?: string | null
          transcript_text?: string | null
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
      message_deliveries: {
        Row: {
          card_id: string
          channel: Database["public"]["Enums"]["message_channel"]
          error_message: string | null
          id: string
          provider_message_id: string | null
          sent_at: string | null
          status: string
          template_id: string | null
        }
        Insert: {
          card_id: string
          channel: Database["public"]["Enums"]["message_channel"]
          error_message?: string | null
          id?: string
          provider_message_id?: string | null
          sent_at?: string | null
          status?: string
          template_id?: string | null
        }
        Update: {
          card_id?: string
          channel?: Database["public"]["Enums"]["message_channel"]
          error_message?: string | null
          id?: string
          provider_message_id?: string | null
          sent_at?: string | null
          status?: string
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_deliveries_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_deliveries_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "message_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      message_templates: {
        Row: {
          active: boolean
          body: string
          business_unit_id: string | null
          category: Database["public"]["Enums"]["message_category"]
          channel: Database["public"]["Enums"]["message_channel"]
          created_at: string
          id: string
          name: string
          subject: string | null
          variables: Json | null
        }
        Insert: {
          active?: boolean
          body: string
          business_unit_id?: string | null
          category?: Database["public"]["Enums"]["message_category"]
          channel: Database["public"]["Enums"]["message_channel"]
          created_at?: string
          id?: string
          name: string
          subject?: string | null
          variables?: Json | null
        }
        Update: {
          active?: boolean
          body?: string
          business_unit_id?: string | null
          category?: Database["public"]["Enums"]["message_category"]
          channel?: Database["public"]["Enums"]["message_channel"]
          created_at?: string
          id?: string
          name?: string
          subject?: string | null
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "message_templates_business_unit_id_fkey"
            columns: ["business_unit_id"]
            isOneToOne: false
            referencedRelation: "business_units"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          parent_org_id: string | null
          type: Database["public"]["Enums"]["org_type"]
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          parent_org_id?: string | null
          type?: Database["public"]["Enums"]["org_type"]
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          parent_org_id?: string | null
          type?: Database["public"]["Enums"]["org_type"]
        }
        Relationships: [
          {
            foreignKeyName: "organizations_parent_org_id_fkey"
            columns: ["parent_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
          validation_rules: Json | null
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
          validation_rules?: Json | null
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
          validation_rules?: Json | null
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
          organization_id: string
        }
        Insert: {
          active?: boolean
          auth_user_id: string
          business_unit_id?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          organization_id: string
        }
        Update: {
          active?: boolean
          auth_user_id?: string
          business_unit_id?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          organization_id?: string
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
      start_forms: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          pipeline_id: string
          schema: Json
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          pipeline_id: string
          schema?: Json
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          pipeline_id?: string
          schema?: Json
        }
        Relationships: [
          {
            foreignKeyName: "start_forms_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
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
      get_user_profile: {
        Args: { _user_id: string }
        Returns: {
          business_unit_id: string
          organization_id: string
          profile_id: string
        }[]
      }
      has_any_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      user_belongs_to_org: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      user_can_access_bu: {
        Args: { _bu_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      activity_type:
        | "note"
        | "email"
        | "whatsapp"
        | "meeting"
        | "move"
        | "contract"
        | "system"
      app_role: "admin" | "enablement" | "head" | "closer" | "sdr" | "bdr"
      automation_run_status: "pending" | "running" | "success" | "failed"
      automation_trigger:
        | "card_created"
        | "phase_enter"
        | "delay_elapsed"
        | "meeting_finished"
      card_origin: "manual" | "automation" | "meeting" | "api"
      card_status: "open" | "won" | "lost" | "archived"
      contract_status: "draft" | "pending_signature" | "signed" | "cancelled"
      field_type:
        | "text"
        | "number"
        | "email"
        | "phone"
        | "date"
        | "select"
        | "multiselect"
        | "textarea"
        | "checkbox"
        | "url"
      integration_provider:
        | "brevo"
        | "whatsapp_official"
        | "google_meet"
        | "elephan"
        | "contracts"
      meeting_provider: "google_meet" | "elephan"
      message_category: "transactional" | "followup"
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
      activity_type: [
        "note",
        "email",
        "whatsapp",
        "meeting",
        "move",
        "contract",
        "system",
      ],
      app_role: ["admin", "enablement", "head", "closer", "sdr", "bdr"],
      automation_run_status: ["pending", "running", "success", "failed"],
      automation_trigger: [
        "card_created",
        "phase_enter",
        "delay_elapsed",
        "meeting_finished",
      ],
      card_origin: ["manual", "automation", "meeting", "api"],
      card_status: ["open", "won", "lost", "archived"],
      contract_status: ["draft", "pending_signature", "signed", "cancelled"],
      field_type: [
        "text",
        "number",
        "email",
        "phone",
        "date",
        "select",
        "multiselect",
        "textarea",
        "checkbox",
        "url",
      ],
      integration_provider: [
        "brevo",
        "whatsapp_official",
        "google_meet",
        "elephan",
        "contracts",
      ],
      meeting_provider: ["google_meet", "elephan"],
      message_category: ["transactional", "followup"],
      message_channel: ["email", "whatsapp"],
      org_type: ["hq", "franchise"],
      pipeline_audience: ["internal", "franchise"],
    },
  },
} as const

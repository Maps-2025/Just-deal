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
      deals: {
        Row: {
          asset_type: string
          bid_due_date: string | null
          broker: string | null
          broker_email: string | null
          broker_phone: string | null
          comments: string | null
          date_added: string
          date_modified: string
          deal_id: string
          deal_name: string
          deal_type: string | null
          due_diligence_date: string | null
          flags_h: boolean
          flags_m: boolean
          flags_r: boolean
          fund: string | null
          id: string
          is_starred: boolean
          organization_id: string
          status: string
        }
        Insert: {
          asset_type: string
          bid_due_date?: string | null
          broker?: string | null
          broker_email?: string | null
          broker_phone?: string | null
          comments?: string | null
          date_added?: string
          date_modified?: string
          deal_id: string
          deal_name: string
          deal_type?: string | null
          due_diligence_date?: string | null
          flags_h?: boolean
          flags_m?: boolean
          flags_r?: boolean
          fund?: string | null
          id?: string
          is_starred?: boolean
          organization_id: string
          status: string
        }
        Update: {
          asset_type?: string
          bid_due_date?: string | null
          broker?: string | null
          broker_email?: string | null
          broker_phone?: string | null
          comments?: string | null
          date_added?: string
          date_modified?: string
          deal_id?: string
          deal_name?: string
          deal_type?: string | null
          due_diligence_date?: string | null
          flags_h?: boolean
          flags_m?: boolean
          flags_r?: boolean
          fund?: string | null
          id?: string
          is_starred?: boolean
          organization_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "deals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      operating_statement_line_items: {
        Row: {
          account_code: string | null
          account_name: string
          amount: number
          category: string | null
          id: string
          is_income: boolean
          os_id: string
        }
        Insert: {
          account_code?: string | null
          account_name: string
          amount?: number
          category?: string | null
          id?: string
          is_income: boolean
          os_id: string
        }
        Update: {
          account_code?: string | null
          account_name?: string
          amount?: number
          category?: string | null
          id?: string
          is_income?: boolean
          os_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "operating_statement_line_items_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "operating_statements"
            referencedColumns: ["id"]
          },
        ]
      }
      operating_statements: {
        Row: {
          budget_type: string
          deal_pk: string
          id: string
          period_end: string
          period_start: string
          period_type: string
          uploaded_at: string
          uploaded_by_user_id: string | null
        }
        Insert: {
          budget_type: string
          deal_pk: string
          id?: string
          period_end: string
          period_start: string
          period_type: string
          uploaded_at?: string
          uploaded_by_user_id?: string | null
        }
        Update: {
          budget_type?: string
          deal_pk?: string
          id?: string
          period_end?: string
          period_start?: string
          period_type?: string
          uploaded_at?: string
          uploaded_by_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "operating_statements_deal_pk_fkey"
            columns: ["deal_pk"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operating_statements_uploaded_by_user_id_fkey"
            columns: ["uploaded_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      org_memberships: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          acres: number | null
          address: string | null
          affordability_status: string | null
          affordable_units_pct: number | null
          age_restricted: boolean | null
          amenities: Json
          asset_quality: string | null
          building_type: string | null
          buildings: number | null
          city: string | null
          deal_pk: string
          id: string
          location_quality: string | null
          market: string | null
          multifamily_housing_type: string | null
          parcel: string | null
          parking_spaces: number | null
          property_manager: string | null
          residential_sqft: number | null
          state: string | null
          stories: number | null
          total_units: number | null
          university_affiliation: string | null
          year_built: number | null
          year_renovated: number | null
          zip: string | null
        }
        Insert: {
          acres?: number | null
          address?: string | null
          affordability_status?: string | null
          affordable_units_pct?: number | null
          age_restricted?: boolean | null
          amenities?: Json
          asset_quality?: string | null
          building_type?: string | null
          buildings?: number | null
          city?: string | null
          deal_pk: string
          id?: string
          location_quality?: string | null
          market?: string | null
          multifamily_housing_type?: string | null
          parcel?: string | null
          parking_spaces?: number | null
          property_manager?: string | null
          residential_sqft?: number | null
          state?: string | null
          stories?: number | null
          total_units?: number | null
          university_affiliation?: string | null
          year_built?: number | null
          year_renovated?: number | null
          zip?: string | null
        }
        Update: {
          acres?: number | null
          address?: string | null
          affordability_status?: string | null
          affordable_units_pct?: number | null
          age_restricted?: boolean | null
          amenities?: Json
          asset_quality?: string | null
          building_type?: string | null
          buildings?: number | null
          city?: string | null
          deal_pk?: string
          id?: string
          location_quality?: string | null
          market?: string | null
          multifamily_housing_type?: string | null
          parcel?: string | null
          parking_spaces?: number | null
          property_manager?: string | null
          residential_sqft?: number | null
          state?: string | null
          stories?: number | null
          total_units?: number | null
          university_affiliation?: string | null
          year_built?: number | null
          year_renovated?: number | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_deal_pk_fkey"
            columns: ["deal_pk"]
            isOneToOne: true
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      rent_roll_units: {
        Row: {
          bathrooms: number | null
          bedrooms: number | null
          contractual_rent: number | null
          floor_plan: string | null
          id: string
          lease_end_date: string | null
          lease_start_date: string | null
          lease_term_months: number | null
          lease_type: string | null
          market_rent: number | null
          move_in_date: string | null
          move_out_date: string | null
          net_effective_rent: number | null
          net_sqft: number | null
          occupancy_status: string | null
          recurring_concessions: number | null
          renovation_status: string | null
          rent_roll_id: string
          tenant_name: string | null
          unit_no: string | null
          unit_type: string | null
        }
        Insert: {
          bathrooms?: number | null
          bedrooms?: number | null
          contractual_rent?: number | null
          floor_plan?: string | null
          id?: string
          lease_end_date?: string | null
          lease_start_date?: string | null
          lease_term_months?: number | null
          lease_type?: string | null
          market_rent?: number | null
          move_in_date?: string | null
          move_out_date?: string | null
          net_effective_rent?: number | null
          net_sqft?: number | null
          occupancy_status?: string | null
          recurring_concessions?: number | null
          renovation_status?: string | null
          rent_roll_id: string
          tenant_name?: string | null
          unit_no?: string | null
          unit_type?: string | null
        }
        Update: {
          bathrooms?: number | null
          bedrooms?: number | null
          contractual_rent?: number | null
          floor_plan?: string | null
          id?: string
          lease_end_date?: string | null
          lease_start_date?: string | null
          lease_term_months?: number | null
          lease_type?: string | null
          market_rent?: number | null
          move_in_date?: string | null
          move_out_date?: string | null
          net_effective_rent?: number | null
          net_sqft?: number | null
          occupancy_status?: string | null
          recurring_concessions?: number | null
          renovation_status?: string | null
          rent_roll_id?: string
          tenant_name?: string | null
          unit_no?: string | null
          unit_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rent_roll_units_rent_roll_id_fkey"
            columns: ["rent_roll_id"]
            isOneToOne: false
            referencedRelation: "rent_rolls"
            referencedColumns: ["id"]
          },
        ]
      }
      rent_rolls: {
        Row: {
          deal_pk: string
          has_anomalies: boolean
          id: string
          occupancy_pct: number | null
          occupied_units: number | null
          report_date: string
          total_units: number | null
          uploaded_at: string
          uploaded_by_user_id: string | null
        }
        Insert: {
          deal_pk: string
          has_anomalies?: boolean
          id?: string
          occupancy_pct?: number | null
          occupied_units?: number | null
          report_date: string
          total_units?: number | null
          uploaded_at?: string
          uploaded_by_user_id?: string | null
        }
        Update: {
          deal_pk?: string
          has_anomalies?: boolean
          id?: string
          occupancy_pct?: number | null
          occupied_units?: number | null
          report_date?: string
          total_units?: number | null
          uploaded_at?: string
          uploaded_by_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rent_rolls_deal_pk_fkey"
            columns: ["deal_pk"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rent_rolls_uploaded_by_user_id_fkey"
            columns: ["uploaded_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string | null
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

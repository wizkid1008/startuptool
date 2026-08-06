export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["organizations"]["Row"]> & {
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["organizations"]["Row"]>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          organization_id: string | null;
          full_name: string | null;
          role: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & { id: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [];
      };
      organization_invites: {
        Row: {
          id: string;
          organization_id: string;
          email: string;
          role: string;
          invited_by: string | null;
          created_at: string;
          expires_at: string;
          /** Set by handle_new_user when the invited address registers. */
          accepted_at: string | null;
          accepted_by: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["organization_invites"]["Row"]> & {
          organization_id: string;
          email: string;
        };
        Update: Partial<Database["public"]["Tables"]["organization_invites"]["Row"]>;
        Relationships: [];
      };
      companies: {
        Row: {
          id: string;
          organization_id: string | null;
          name: string;
          website: string | null;
          linkedin_url: string | null;
          crunchbase_url: string | null;
          industry: string | null;
          stage: string | null;
          geography: string | null;
          employee_count_range: string | null;
          description: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["companies"]["Row"]> & {
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["companies"]["Row"]>;
        Relationships: [];
      };
      assessments: {
        Row: {
          id: string;
          company_id: string;
          status: string;
          model_provider: string | null;
          model_name: string | null;
          executive_summary: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["assessments"]["Row"]> & {
          company_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["assessments"]["Row"]>;
        Relationships: [];
      };
      assessment_scores: {
        Row: {
          id: string;
          assessment_id: string;
          dimension_key: string;
          subdimension_key: string;
          maturity_score: number;
          impact_score: number;
          criticality_score: number;
          effort_score: number | null;
          time_score: number | null;
          cost_score: number | null;
          estimate_confidence: number | null;
          /** Generated in Postgres — criticality x (5 - effort). Read-only. */
          priority_score: number | null;
          confidence: number | null;
          source: string;
          rationale: string | null;
          reviewer_note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["assessment_scores"]["Row"]> & {
          assessment_id: string;
          dimension_key: string;
          subdimension_key: string;
          maturity_score: number;
          impact_score: number;
          criticality_score: number;
        };
        Update: Partial<Database["public"]["Tables"]["assessment_scores"]["Row"]>;
        Relationships: [];
      };
      assessment_evidence: {
        Row: {
          id: string;
          assessment_score_id: string | null;
          assessment_id: string;
          evidence_type: string;
          title: string | null;
          url: string | null;
          excerpt: string | null;
          confidence: number | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["assessment_evidence"]["Row"]> & {
          assessment_id: string;
          evidence_type: string;
        };
        Update: Partial<Database["public"]["Tables"]["assessment_evidence"]["Row"]>;
        Relationships: [];
      };
      company_documents: {
        Row: {
          id: string;
          company_id: string;
          storage_path: string;
          file_name: string;
          mime_type: string;
          size_bytes: number;
          document_type: string | null;
          parsed_text: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["company_documents"]["Row"]> & {
          company_id: string;
          storage_path: string;
          file_name: string;
          mime_type: string;
          size_bytes: number;
        };
        Update: Partial<Database["public"]["Tables"]["company_documents"]["Row"]>;
        Relationships: [];
      };
      assessment_answers: {
        Row: {
          id: string;
          assessment_id: string;
          dimension_key: string;
          subdimension_key: string;
          question_id: string;
          answer: string | null;
          /** The level a person chose. Never overwritten by a discovery run. */
          selected_level: number | null;
          /** The agent's suggestion, kept separate from the human's choice. */
          suggested_level: number | null;
          status: string;
          source: string;
          confidence: number | null;
          evidence: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["assessment_answers"]["Row"]> & {
          assessment_id: string;
          dimension_key: string;
          subdimension_key: string;
          question_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["assessment_answers"]["Row"]>;
        Relationships: [];
      };
      assessment_actions: {
        Row: {
          id: string;
          assessment_id: string;
          assessment_score_id: string | null;
          dimension_key: string | null;
          subdimension_key: string | null;
          title: string;
          detail: string | null;
          owner: string | null;
          due_date: string | null;
          status: string;
          source: string;
          /** Why the agent proposed it — the rubric gap it closes. */
          rationale: string | null;
          /** Null until a person accepts the proposal. */
          accepted_at: string | null;
          /** Schedule, for the Gantt. due_date is a commitment; these are a plan. */
          start_date: string | null;
          end_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["assessment_actions"]["Row"]> & {
          assessment_id: string;
          title: string;
        };
        Update: Partial<Database["public"]["Tables"]["assessment_actions"]["Row"]>;
        Relationships: [];
      };
      agent_runs: {
        Row: {
          id: string;
          assessment_id: string | null;
          run_type: string;
          status: string;
          input_payload: Json | null;
          output_payload: Json | null;
          error: string | null;
          model_provider: string | null;
          model_name: string | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["agent_runs"]["Row"]> & {
          run_type: string;
          status: string;
        };
        Update: Partial<Database["public"]["Tables"]["agent_runs"]["Row"]>;
        Relationships: [];
      };
    };
    // `Record<string, never>` looks equivalent but asserts that every possible
    // key maps to `never`, which fails supabase-js's schema constraint — the
    // client then resolves every table to `never`. This is the shape
    // `supabase gen types` emits for an empty section.
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

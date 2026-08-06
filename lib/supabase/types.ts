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

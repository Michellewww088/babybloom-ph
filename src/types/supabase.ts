/**
 * BabyBloom PH — Supabase Generated Types
 *
 * Normally produced by:
 *   supabase gen types typescript --local > src/types/supabase.ts
 *
 * Hand-maintained here because the Supabase CLI is not installed in this
 * environment. Re-generate after any schema changes once the CLI is available.
 *
 * Last updated: 2026-03-21 (migration: 20260321000000_pregnancy_tables)
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      // ── user_profiles ──────────────────────────────────────────────────
      user_profiles: {
        Row: {
          id: string;
          phone: string | null;
          email: string | null;
          name: string | null;
          language: 'en' | 'fil' | 'zh';
          onboarding_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          phone?: string | null;
          email?: string | null;
          name?: string | null;
          language?: 'en' | 'fil' | 'zh';
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          phone?: string | null;
          email?: string | null;
          name?: string | null;
          language?: 'en' | 'fil' | 'zh';
          onboarding_completed?: boolean;
          updated_at?: string;
        };
      };

      // ── children ───────────────────────────────────────────────────────
      children: {
        Row: {
          id: string;
          user_id: string;
          first_name: string;
          middle_name: string | null;
          last_name: string;
          nickname: string | null;
          gender: 'male' | 'female' | 'unknown';
          birthday: string;
          birth_time: string | null;
          blood_type: string | null;
          birth_type: 'vaginal' | 'csection' | null;
          baby_type: 'normal' | 'premature' | 'twins' | null;
          birth_weight_kg: number | null;
          birth_height_cm: number | null;
          gestational_age_weeks: number | null;
          allergies: string[] | null;
          photo_url: string | null;
          pediatrician_name: string | null;
          philhealth_number: string | null;
          mch_booklet_number: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          first_name: string;
          middle_name?: string | null;
          last_name: string;
          nickname?: string | null;
          gender: 'male' | 'female' | 'unknown';
          birthday: string;
          birth_time?: string | null;
          blood_type?: string | null;
          birth_type?: 'vaginal' | 'csection' | null;
          baby_type?: 'normal' | 'premature' | 'twins' | null;
          birth_weight_kg?: number | null;
          birth_height_cm?: number | null;
          gestational_age_weeks?: number | null;
          allergies?: string[] | null;
          photo_url?: string | null;
          pediatrician_name?: string | null;
          philhealth_number?: string | null;
          mch_booklet_number?: string | null;
          created_at?: string;
        };
        Update: {
          first_name?: string;
          middle_name?: string | null;
          last_name?: string;
          nickname?: string | null;
          gender?: 'male' | 'female' | 'unknown';
          birthday?: string;
          birth_time?: string | null;
          blood_type?: string | null;
          birth_type?: 'vaginal' | 'csection' | null;
          baby_type?: 'normal' | 'premature' | 'twins' | null;
          birth_weight_kg?: number | null;
          birth_height_cm?: number | null;
          gestational_age_weeks?: number | null;
          allergies?: string[] | null;
          photo_url?: string | null;
          pediatrician_name?: string | null;
          philhealth_number?: string | null;
          mch_booklet_number?: string | null;
        };
      };

      // ── vaccines ───────────────────────────────────────────────────────
      // Includes all new columns added in migration 20260316214019
      vaccines: {
        Row: {
          id: string;
          child_id: string;
          user_id: string;
          vaccine_code: string;
          vaccine_name: string;
          dose_number: number | null;
          scheduled_date: string | null;
          given_date: string | null;
          given_at_facility: string | null;
          is_epi_free: boolean;
          notes: string | null;
          created_at: string;
          // ── New fields (migration 20260316214019) ───────────────────
          brand: string | null;
          administered_by: string | null;
          administered_role: 'pediatrician' | 'nurse' | 'midwife' | null;
          clinic: string | null;
          lot_number: string | null;
          expiry_date: string | null;
          site: 'left_thigh' | 'right_thigh' | 'left_arm' | 'right_arm' | 'oral' | null;
          reactions: string | null;
          next_due_date: string | null;
          certificate_url: string | null;
        };
        Insert: {
          id?: string;
          child_id: string;
          user_id: string;
          vaccine_code: string;
          vaccine_name: string;
          dose_number?: number | null;
          scheduled_date?: string | null;
          given_date?: string | null;
          given_at_facility?: string | null;
          is_epi_free?: boolean;
          notes?: string | null;
          created_at?: string;
          brand?: string | null;
          administered_by?: string | null;
          administered_role?: 'pediatrician' | 'nurse' | 'midwife' | null;
          clinic?: string | null;
          lot_number?: string | null;
          expiry_date?: string | null;
          site?: 'left_thigh' | 'right_thigh' | 'left_arm' | 'right_arm' | 'oral' | null;
          reactions?: string | null;
          next_due_date?: string | null;
          certificate_url?: string | null;
        };
        Update: {
          vaccine_code?: string;
          vaccine_name?: string;
          dose_number?: number | null;
          scheduled_date?: string | null;
          given_date?: string | null;
          given_at_facility?: string | null;
          is_epi_free?: boolean;
          notes?: string | null;
          brand?: string | null;
          administered_by?: string | null;
          administered_role?: 'pediatrician' | 'nurse' | 'midwife' | null;
          clinic?: string | null;
          lot_number?: string | null;
          expiry_date?: string | null;
          site?: 'left_thigh' | 'right_thigh' | 'left_arm' | 'right_arm' | 'oral' | null;
          reactions?: string | null;
          next_due_date?: string | null;
          certificate_url?: string | null;
        };
      };

      // ── vaccines_schedule ──────────────────────────────────────────────
      // Reference table — DOH EPI Philippines schedule
      vaccines_schedule: {
        Row: {
          id: string;
          vaccine_name: string;
          age_weeks_min: number | null;
          age_weeks_max: number | null;
          dose_number: number | null;
          is_required: boolean;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          vaccine_name: string;
          age_weeks_min?: number | null;
          age_weeks_max?: number | null;
          dose_number?: number | null;
          is_required?: boolean;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          vaccine_name?: string;
          age_weeks_min?: number | null;
          age_weeks_max?: number | null;
          dose_number?: number | null;
          is_required?: boolean;
          notes?: string | null;
        };
      };

      // ── feeding_logs ───────────────────────────────────────────────────
      feeding_logs: {
        Row: {
          id: string;
          child_id: string;
          user_id: string;
          feed_type: 'breastfeed' | 'bottle' | 'solids';
          started_at: string;
          ended_at: string | null;
          breast_side: 'left' | 'right' | 'both' | null;
          volume_ml: number | null;
          formula_brand: string | null;
          food_item: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          child_id: string;
          user_id: string;
          feed_type: 'breastfeed' | 'bottle' | 'solids';
          started_at: string;
          ended_at?: string | null;
          breast_side?: 'left' | 'right' | 'both' | null;
          volume_ml?: number | null;
          formula_brand?: string | null;
          food_item?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          feed_type?: 'breastfeed' | 'bottle' | 'solids';
          started_at?: string;
          ended_at?: string | null;
          breast_side?: 'left' | 'right' | 'both' | null;
          volume_ml?: number | null;
          formula_brand?: string | null;
          food_item?: string | null;
          notes?: string | null;
        };
      };

      // ── sleep_logs ─────────────────────────────────────────────────────
      sleep_logs: {
        Row: {
          id: string;
          child_id: string;
          user_id: string;
          started_at: string;
          ended_at: string | null;
          sleep_type: 'night' | 'nap';
          quality: 'restful' | 'restless' | 'frequent_waking' | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          child_id: string;
          user_id: string;
          started_at: string;
          ended_at?: string | null;
          sleep_type: 'night' | 'nap';
          quality?: 'restful' | 'restless' | 'frequent_waking' | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          started_at?: string;
          ended_at?: string | null;
          sleep_type?: 'night' | 'nap';
          quality?: 'restful' | 'restless' | 'frequent_waking' | null;
          notes?: string | null;
        };
      };

      // ── growth_records ─────────────────────────────────────────────────
      growth_records: {
        Row: {
          id: string;
          child_id: string;
          user_id: string;
          measured_at: string;
          weight_kg: number | null;
          height_cm: number | null;
          head_circumference_cm: number | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          child_id: string;
          user_id: string;
          measured_at: string;
          weight_kg?: number | null;
          height_cm?: number | null;
          head_circumference_cm?: number | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          measured_at?: string;
          weight_kg?: number | null;
          height_cm?: number | null;
          head_circumference_cm?: number | null;
          notes?: string | null;
        };
      };
    };

      // ── pregnancy_profiles ─────────────────────────────────────────────
      pregnancy_profiles: {
        Row: {
          id: string;
          user_id: string;
          lmp_date: string;
          due_date: string;
          ob_name: string | null;
          clinic: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          lmp_date: string;
          due_date: string;
          ob_name?: string | null;
          clinic?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          lmp_date?: string;
          due_date?: string;
          ob_name?: string | null;
          clinic?: string | null;
          is_active?: boolean;
        };
      };

      // ── pregnancy_logs ─────────────────────────────────────────────────
      pregnancy_logs: {
        Row: {
          id: string;
          pregnancy_id: string;
          week: number;
          weight_kg: number | null;
          bp_systolic: number | null;
          bp_diastolic: number | null;
          symptoms: Json;
          notes: string | null;
          logged_at: string;
        };
        Insert: {
          id?: string;
          pregnancy_id: string;
          week: number;
          weight_kg?: number | null;
          bp_systolic?: number | null;
          bp_diastolic?: number | null;
          symptoms?: Json;
          notes?: string | null;
          logged_at?: string;
        };
        Update: {
          week?: number;
          weight_kg?: number | null;
          bp_systolic?: number | null;
          bp_diastolic?: number | null;
          symptoms?: Json;
          notes?: string | null;
        };
      };

      // ── prenatal_appointments ──────────────────────────────────────────
      prenatal_appointments: {
        Row: {
          id: string;
          pregnancy_id: string;
          appointment_date: string;
          clinic: string | null;
          ob_name: string | null;
          purpose: string | null;
          findings: string | null;
          next_appointment_date: string | null;
          results_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          pregnancy_id: string;
          appointment_date: string;
          clinic?: string | null;
          ob_name?: string | null;
          purpose?: string | null;
          findings?: string | null;
          next_appointment_date?: string | null;
          results_url?: string | null;
          created_at?: string;
        };
        Update: {
          appointment_date?: string;
          clinic?: string | null;
          ob_name?: string | null;
          purpose?: string | null;
          findings?: string | null;
          next_appointment_date?: string | null;
          results_url?: string | null;
        };
      };

      // ── kick_counts ────────────────────────────────────────────────────
      kick_counts: {
        Row: {
          id: string;
          pregnancy_id: string;
          logged_at: string;
          kicks_count: number;
          duration_minutes: number | null;
        };
        Insert: {
          id?: string;
          pregnancy_id: string;
          logged_at?: string;
          kicks_count: number;
          duration_minutes?: number | null;
        };
        Update: {
          kicks_count?: number;
          duration_minutes?: number | null;
        };
      };

      // ── contractions ───────────────────────────────────────────────────
      contractions: {
        Row: {
          id: string;
          pregnancy_id: string;
          started_at: string;
          ended_at: string | null;
          duration_seconds: number | null;
          interval_seconds: number | null;
        };
        Insert: {
          id?: string;
          pregnancy_id: string;
          started_at: string;
          ended_at?: string | null;
          duration_seconds?: number | null;
          interval_seconds?: number | null;
        };
        Update: {
          ended_at?: string | null;
          duration_seconds?: number | null;
          interval_seconds?: number | null;
        };
      };

      // ── pregnancy_weeks ────────────────────────────────────────────────
      pregnancy_weeks: {
        Row: {
          id: string;
          week: number;
          baby_size_name: string | null;
          baby_size_cm: number | null;
          baby_weight_g: number | null;
          baby_development: string | null;
          mama_symptoms: string | null;
          mama_tips: string | null;
          trimester: 'first' | 'second' | 'third' | null;
        };
        Insert: {
          id?: string;
          week: number;
          baby_size_name?: string | null;
          baby_size_cm?: number | null;
          baby_weight_g?: number | null;
          baby_development?: string | null;
          mama_symptoms?: string | null;
          mama_tips?: string | null;
          trimester?: 'first' | 'second' | 'third' | null;
        };
        Update: {
          baby_size_name?: string | null;
          baby_size_cm?: number | null;
          baby_weight_g?: number | null;
          baby_development?: string | null;
          mama_symptoms?: string | null;
          mama_tips?: string | null;
          trimester?: 'first' | 'second' | 'third' | null;
        };
      };
    };

    Views: Record<string, never>;

    Functions: Record<string, never>;

    Enums: {
      administered_role: 'pediatrician' | 'nurse' | 'midwife';
      vaccine_site: 'left_thigh' | 'right_thigh' | 'left_arm' | 'right_arm' | 'oral';
      pregnancy_trimester: 'first' | 'second' | 'third';
    };
  };
}

// ── Convenience row-type aliases ──────────────────────────────────────────
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type UserProfileRow          = Tables<'user_profiles'>;
export type ChildRow                = Tables<'children'>;
export type VaccineRow              = Tables<'vaccines'>;
export type VaccineScheduleRow      = Tables<'vaccines_schedule'>;
export type FeedingLogRow           = Tables<'feeding_logs'>;
export type SleepLogRow             = Tables<'sleep_logs'>;
export type GrowthRecordRow         = Tables<'growth_records'>;
export type PregnancyProfileRow     = Tables<'pregnancy_profiles'>;
export type PregnancyLogRow         = Tables<'pregnancy_logs'>;
export type PrenatalAppointmentRow  = Tables<'prenatal_appointments'>;
export type KickCountRow            = Tables<'kick_counts'>;
export type ContractionRow          = Tables<'contractions'>;
export type PregnancyWeekRow        = Tables<'pregnancy_weeks'>;

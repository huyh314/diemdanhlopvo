// =============================================
// DATABASE TYPES — Supabase Schema Mapping
// Matches 001_schema.sql exactly
// =============================================

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
            students: {
                Row: {
                    id: string;
                    name: string;
                    group_id: GroupId;
                    birth_year: string;
                    phone: string;
                    avatar_url: string;
                    schedule: number[];
                    is_active: boolean;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    name: string;
                    group_id?: GroupId;
                    birth_year?: string;
                    phone?: string;
                    avatar_url?: string;
                    schedule?: number[];
                    is_active?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    name?: string;
                    group_id?: GroupId;
                    birth_year?: string;
                    phone?: string;
                    avatar_url?: string;
                    schedule?: number[];
                    is_active?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: any[];
            };

            sessions: {
                Row: {
                    id: string;
                    session_date: string;
                    day_of_week: number;
                    group_id: GroupId;
                    notes: string;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    session_date: string;
                    day_of_week?: number;
                    group_id?: GroupId;
                    notes?: string;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    session_date?: string;
                    day_of_week?: number;
                    group_id?: GroupId;
                    notes?: string;
                    created_at?: string;
                };
                Relationships: any[];
            };

            attendance: {
                Row: {
                    id: string;
                    student_id: string;
                    session_id: string;
                    status: AttendanceStatus;
                    recorded_at: string;
                };
                Insert: {
                    id?: string;
                    student_id: string;
                    session_id: string;
                    status?: AttendanceStatus;
                    recorded_at?: string;
                };
                Update: {
                    id?: string;
                    student_id?: string;
                    session_id?: string;
                    status?: AttendanceStatus;
                    recorded_at?: string;
                };
                Relationships: any[];
            };

            scores: {
                Row: {
                    id: string;
                    student_id: string;
                    week_key: string;
                    total: number;
                    notes: string;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    student_id: string;
                    week_key: string;
                    total?: number;
                    notes?: string;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    student_id?: string;
                    week_key?: string;
                    total?: number;
                    notes?: string;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: any[];
            };

            score_criteria: {
                Row: {
                    id: string;
                    score_id: string;
                    category: ScoreCategory;
                    criterion_key: string;
                    label: string;
                    value: number;
                    max_value: number;
                    deductions: DeductionEntry[];
                };
                Insert: {
                    id?: string;
                    score_id: string;
                    category: ScoreCategory;
                    criterion_key: string;
                    label?: string;
                    value?: number;
                    max_value?: number;
                    deductions?: DeductionEntry[];
                };
                Update: {
                    id?: string;
                    score_id?: string;
                    category?: ScoreCategory;
                    criterion_key?: string;
                    label?: string;
                    value?: number;
                    max_value?: number;
                    deductions?: DeductionEntry[];
                };
                Relationships: any[];
            };

            app_config: {
                Row: {
                    key: string;
                    value: Json;
                    updated_at: string;
                };
                Insert: {
                    key: string;
                    value: Json;
                    updated_at?: string;
                };
                Update: {
                    key?: string;
                    value?: Json;
                    updated_at?: string;
                };
                Relationships: any[];
            };
        };

        Views: {
            [_ in never]: never;
        };
        Enums: {
            [_ in never]: never;
        };
        CompositeTypes: {
            [_ in never]: never;
        };

        Functions: {
            fn_attendance_stats: {
                Args: {
                    p_student_id?: string | null;
                    p_group_id?: string | null;
                    p_from_date?: string | null;
                    p_to_date?: string | null;
                };
                Returns: AttendanceStatsRow[];
            };
            fn_auto_chuyen_can: {
                Args: {
                    p_student_id: string;
                    p_from_date?: string | null;
                    p_to_date?: string | null;
                };
                Returns: number;
            };
            fn_student_rankings: {
                Args: {
                    p_week_key?: string | null;
                };
                Returns: StudentRankingRow[];
            };
            fn_upsert_attendance: {
                Args: {
                    p_session_id: string;
                    p_records: Json;
                };
                Returns: Database['public']['Tables']['attendance']['Row'][];
            };
            fn_get_or_create_session: {
                Args: {
                    p_date: string;
                    p_group_id?: string;
                };
                Returns: string;
            };
            fn_group_attendance_summary: {
                Args: {
                    p_date?: string;
                };
                Returns: GroupAttendanceSummaryRow[];
            };
        };
    };
}

// =============================================
// Enum-like Types
// =============================================

export type GroupId = 'nhom_1' | 'nhom_2' | 'nhom_3';
export type AttendanceStatus = 'present' | 'absent' | 'excused';
export type ScoreCategory = 'chuyen_can' | 'y_thuc' | 'chuyen_mon';

// =============================================
// JSONB sub-types
// =============================================

export interface DeductionEntry {
    reason: string;
    amount: number;
    date?: string;
}

// =============================================
// Function return types
// =============================================

export interface AttendanceStatsRow {
    student_id: string;
    student_name: string;
    group_id: GroupId;
    total_sessions: number;
    present_count: number;
    absent_count: number;
    excused_count: number;
    attendance_rate: number;
}

export interface StudentRankingRow {
    rank: number;
    student_id: string;
    student_name: string;
    group_id: GroupId;
    week_key: string;
    total: number;
    cat_chuyen_can: number;
    cat_y_thuc: number;
    cat_chuyen_mon: number;
    medal: string;
}

export interface GroupAttendanceSummaryRow {
    group_id: GroupId;
    total_students: number;
    present_count: number;
    absent_count: number;
    excused_count: number;
    rate: number;
}

// =============================================
// Shorthand aliases
// =============================================

export type StudentRow = Database['public']['Tables']['students']['Row'];
export type SessionRow = Database['public']['Tables']['sessions']['Row'];
export type AttendanceRow = Database['public']['Tables']['attendance']['Row'];
export type ScoreRow = Database['public']['Tables']['scores']['Row'];
export type ScoreCritRow = Database['public']['Tables']['score_criteria']['Row'];

export type StudentInsert = Database['public']['Tables']['students']['Insert'];
export type StudentUpdate = Database['public']['Tables']['students']['Update'];
export type ScoreInsert = Database['public']['Tables']['scores']['Insert'];
export type ScoreUpdate = Database['public']['Tables']['scores']['Update'];

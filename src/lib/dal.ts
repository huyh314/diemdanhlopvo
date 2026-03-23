// =============================================
// DATA ACCESS LAYER (DAL)
// Server-only module — wraps all Supabase queries
// =============================================

import 'server-only';
import { createClient } from '@/utils/supabase/server';
import type {
    Database,
    GroupId,
    StudentRow,
    StudentInsert,
    StudentUpdate,
    AttendanceStatsRow,
    StudentRankingRow,
    GroupAttendanceSummaryRow,
    ScoreCategory,
} from '@/types/database.types';
import type { AttendanceBulkInput } from '@/types/domain';
import { GROUP_IDS } from '@/lib/constants';

// =============================================
// STUDENTS
// =============================================

export async function getStudents(groupId?: GroupId) {
    const supabase = await createClient();
    let query = supabase
        .from('students')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

    if (groupId) {
        query = query.eq('group_id', groupId);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Failed to fetch students: ${error.message}`);
    return data as StudentRow[];
}

export async function getStudent(id: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw new Error(`Student not found: ${error.message}`);
    return data as StudentRow;
}

export async function createStudent(input: StudentInsert) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('students')
        .insert(input)
        .select()
        .single();

    if (error) throw new Error(`Failed to create student: ${error.message}`);
    return data as StudentRow;
}

export async function updateStudent(id: string, input: StudentUpdate) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('students')
        .update(input)
        .eq('id', id)
        .select()
        .single();

    if (error) throw new Error(`Failed to update student: ${error.message}`);
    return data as StudentRow;
}

export async function deleteStudent(id: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('students')
        .update({ is_active: false })
        .eq('id', id);

    if (error) throw new Error(`Failed to delete student: ${error.message}`);
}

// =============================================
// SESSIONS & ATTENDANCE
// =============================================

export async function getOrCreateSession(date: string, groupId: GroupId = GROUP_IDS[0]) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .rpc('fn_get_or_create_session', {
            p_date: date,
            p_group_id: groupId,
        });

    if (error) throw new Error(`Failed to get/create session: ${error.message}`);
    return data as string;
}

export async function getSessionAttendance(sessionId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('attendance')
        .select(`
      id,
      student_id,
      session_id,
      status,
      recorded_at,
      students (id, name, group_id, avatar_url)
    `)
        .eq('session_id', sessionId)
        .order('recorded_at', { ascending: true });

    if (error) throw new Error(`Failed to fetch attendance: ${error.message}`);
    return data;
}

export async function saveAttendance(
    sessionId: string,
    records: AttendanceBulkInput[]
) {
    const supabase = await createClient();
    const jsonRecords = records.map(r => ({
        studentId: r.studentId,
        status: r.status,
    }));

    const { data, error } = await supabase
        .rpc('fn_upsert_attendance', {
            p_session_id: sessionId,
            p_records: jsonRecords as unknown as Database['public']['Functions']['fn_upsert_attendance']['Args']['p_records'],
        });

    if (error) throw new Error(`Failed to save attendance: ${error.message}`);
    return data;
}

// =============================================
// STATISTICS & RANKINGS
// =============================================

export async function getAttendanceStats(params?: {
    studentId?: string;
    groupId?: GroupId;
    fromDate?: string;
    toDate?: string;
}) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .rpc('fn_attendance_stats', {
            p_student_id: params?.studentId ?? null,
            p_group_id: params?.groupId ?? null,
            p_from_date: params?.fromDate ?? null,
            p_to_date: params?.toDate ?? null,
        });

    if (error) throw new Error(`Failed to fetch attendance stats: ${error.message}`);
    return data as AttendanceStatsRow[];
}

export async function getStudentRankings(weekKey?: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .rpc('fn_student_rankings', {
            p_week_key: weekKey ?? null,
        });

    if (error) throw new Error(`Failed to fetch rankings: ${error.message}`);
    return data as StudentRankingRow[];
}

export interface StudentAverageRankingRow {
    rank: number;
    student_id: string;
    student_name: string;
    group_id: string;
    weeks_count: number;
    avg_total: number;
    avg_cc: number;
    avg_yt: number;
    avg_cm: number;
    medal: string;
}

export async function getAverageRankings(weeks: number = 4) {
    const supabase = await createClient();
    const { data, error } = await (supabase as any)
        .rpc('fn_student_average_rankings', {
            p_weeks: weeks,
        });

    if (error) throw new Error(`Failed to fetch average rankings: ${error.message}`);
    return data as unknown as StudentAverageRankingRow[];
}

export async function getGroupSummary(date?: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .rpc('fn_group_attendance_summary', {
            p_date: date ?? new Date().toISOString().slice(0, 10),
        });

    if (error) throw new Error(`Failed to fetch group summary: ${error.message}`);
    return data as GroupAttendanceSummaryRow[];
}

export async function getAutoChuyenCan(
    studentId: string,
    fromDate?: string,
    toDate?: string
) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .rpc('fn_auto_chuyen_can', {
            p_student_id: studentId,
            p_from_date: fromDate ?? null,
            p_to_date: toDate ?? null,
        });

    if (error) throw new Error(`Failed to compute chuyên cần: ${error.message}`);
    return data as number;
}

// =============================================
// EXPORT DATA
// =============================================

export async function getMonthlyExportData(year: number, month: number) {
    const supabase = await createClient();

    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const endDate = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01`;

    const { data, error } = await supabase
        .from('attendance')
        .select(`
            status,
            sessions!inner(session_date),
            students!inner(name, group_id)
        `)
        .gte('sessions.session_date', startDate)
        .lt('sessions.session_date', endDate)
        .order('session_date', { referencedTable: 'sessions', ascending: true });

    if (error) throw new Error(`Failed to fetch export data: ${error.message}`);
    return data;
}

// =============================================
// SCORES
// =============================================

export async function getScores(studentId: string, weekKey?: string) {
    const supabase = await createClient();
    let query = supabase
        .from('scores')
        .select(`
      *,
      score_criteria (*)
    `)
        .eq('student_id', studentId)
        .order('week_key', { ascending: false });

    if (weekKey) {
        query = query.eq('week_key', weekKey);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Failed to fetch scores: ${error.message}`);
    return data;
}

export async function saveScore(input: {
    studentId: string;
    weekKey: string;
    total: number;
    notes?: string;
    criteria: {
        category: ScoreCategory;
        criterionKey: string;
        label: string;
        value: number;
        maxValue: number;
        deductions?: { reason: string; amount: number; date?: string }[];
    }[];
}) {
    const client = await createClient();

    // 1. Upsert the score record
    const { data: score, error: scoreErr } = await client
        .from('scores')
        .upsert(
            {
                student_id: input.studentId,
                week_key: input.weekKey,
                total: input.total,
                notes: input.notes ?? '',
            },
            { onConflict: 'student_id,week_key' }
        )
        .select()
        .single();

    if (scoreErr) throw new Error(`Failed to save score: ${scoreErr.message}`);

    // 2. Delete old criteria and insert new
    await client
        .from('score_criteria')
        .delete()
        .eq('score_id', score.id);

    if (input.criteria.length > 0) {
        const criteriaRows = input.criteria.map(c => ({
            score_id: score.id,
            category: c.category,
            criterion_key: c.criterionKey,
            label: c.label,
            value: c.value,
            max_value: c.maxValue,
            deductions: c.deductions ?? [],
        }));

        const { error: critErr } = await client
            .from('score_criteria')
            .insert(criteriaRows);

        if (critErr) throw new Error(`Failed to save criteria: ${critErr.message}`);
    }

    return score;
}

// =============================================
// APP CONFIG
// =============================================

export async function getConfig(key: string) {
    const supabase = await createClient();
    const { data } = await supabase
        .from('app_config')
        .select('value')
        .eq('key', key)
        .single();

    return data?.value ?? null;
}

export async function setConfig(key: string, value: unknown) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('app_config')
        .upsert({ key, value: value as Database['public']['Tables']['app_config']['Insert']['value'] }, { onConflict: 'key' });

    if (error) throw new Error(`Failed to save config: ${error.message}`);
}

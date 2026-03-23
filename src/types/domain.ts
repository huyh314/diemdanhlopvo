// =============================================
// DOMAIN TYPES — Application-layer Interfaces
// Clean types for use in React components & server actions
// =============================================

import type {
    GroupId,
    AttendanceStatus,
    ScoreCategory,
    DeductionEntry,
} from './database.types';

// Re-export enums for convenience
export type { GroupId, AttendanceStatus, ScoreCategory, DeductionEntry };

// =============================================
// Student
// =============================================

export interface Student {
    id: string;
    name: string;
    groupId: GroupId;
    birthYear: string;
    phone: string;
    avatarUrl: string;
    /** Days of week the student trains: [2, 4, 6] = Mon, Wed, Fri */
    schedule: number[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface StudentFormData {
    name: string;
    groupId: GroupId;
    birthYear?: string;
    phone?: string;
    avatarUrl?: string;
    schedule?: number[];
}

// =============================================
// Session (buổi tập)
// =============================================

export interface Session {
    id: string;
    sessionDate: string;      // YYYY-MM-DD
    dayOfWeek: number;         // 1=Mon … 7=Sun (ISO)
    groupId: GroupId;
    notes: string;
    createdAt: Date;
}

// =============================================
// Attendance (điểm danh)
// =============================================

export interface AttendanceRecord {
    id: string;
    studentId: string;
    sessionId: string;
    status: AttendanceStatus;
    recordedAt: Date;
}

/** Input for bulk attendance */
export interface AttendanceBulkInput {
    studentId: string;
    status: AttendanceStatus;
}

// =============================================
// Score (điểm thi đua)
// =============================================

export interface Score {
    id: string;
    studentId: string;
    weekKey: string;            // e.g. '2026-W12'
    total: number;
    notes: string;
    criteria: ScoreCriterion[];
    createdAt: Date;
    updatedAt: Date;
}

export interface ScoreCriterion {
    id: string;
    scoreId: string;
    category: ScoreCategory;
    criterionKey: string;       // e.g. '1-1', '2-1', '3-2'
    label: string;
    value: number;
    maxValue: number;
    deductions: DeductionEntry[];
}

export interface ScoreFormData {
    studentId: string;
    weekKey: string;
    criteria: {
        category: ScoreCategory;
        criterionKey: string;
        label: string;
        value: number;
        maxValue: number;
        deductions?: DeductionEntry[];
    }[];
    notes?: string;
}

// =============================================
// Dashboard / Statistics
// =============================================

export interface AttendanceStats {
    studentId: string;
    studentName: string;
    groupId: GroupId;
    totalSessions: number;
    presentCount: number;
    absentCount: number;
    excusedCount: number;
    attendanceRate: number;       // 0–100
}

export interface GroupSummary {
    groupId: GroupId;
    totalStudents: number;
    presentCount: number;
    absentCount: number;
    excusedCount: number;
    rate: number;                  // 0–100
}

export interface StudentRanking {
    rank: number;
    studentId: string;
    studentName: string;
    groupId: GroupId;
    weekKey: string;
    total: number;
    catChuyenCan: number;
    catYThuc: number;
    catChuyenMon: number;
    medal: string;                 // '🥇' | '🥈' | '🥉' | ''
}

// =============================================
// Config
// =============================================

export interface AppConfig {
    key: string;
    value: unknown;
    updatedAt: Date;
}

// =============================================
// Utility: Group display metadata
// =============================================

export const GROUP_LABELS: Record<GroupId, string> = {
    nhom_1: 'Nhóm 1',
    nhom_2: 'Nhóm 2',
    nhom_3: 'Nhóm 3',
};

export const GROUP_SHORT: Record<GroupId, string> = {
    nhom_1: 'N1',
    nhom_2: 'N2',
    nhom_3: 'N3',
};

export const ATTENDANCE_STATUS_CONFIG: Record<
    AttendanceStatus,
    { label: string; icon: string; color: string }
> = {
    present: { label: 'Có mặt', icon: '🟢', color: 'text-emerald-400' },
    absent: { label: 'Vắng', icon: '🔴', color: 'text-red-400' },
    excused: { label: 'Có phép', icon: '🟡', color: 'text-yellow-400' },
};

export const SCORE_CATEGORY_CONFIG: Record<
    ScoreCategory,
    { label: string; icon: string; maxTotal: number }
> = {
    chuyen_can: { label: 'Chuyên Cần', icon: '🚀', maxTotal: 30 },
    y_thuc: { label: 'Ý Thức', icon: '⭐', maxTotal: 30 },
    chuyen_mon: { label: 'Chuyên Môn', icon: '🥋', maxTotal: 40 },
};

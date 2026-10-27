// =============================================
// VALIDATION SCHEMAS — Zod Runtime Validation
// =============================================

import { z } from 'zod';

import { GROUP_IDS } from '@/lib/constants';

// =============================================
// Enums
// =============================================

// Existence is enforced by foreign keys; this validates the identifier's shape.
export const GroupIdSchema = z.string().regex(/^(nhom_[1-9]\d*|group_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/, 'Nhóm không hợp lệ');
export const CreateGroupSchema = z.object({
    name: z.string().trim().min(1, 'Nhập tên nhóm').max(80, 'Tên nhóm tối đa 80 ký tự'),
    shortName: z.string().trim().max(12, 'Tên viết tắt tối đa 12 ký tự').default(''),
});
export const AttendanceStatusSchema = z.enum(['present', 'absent', 'excused']);
export const ScoreCategorySchema = z.enum(['chuyen_can', 'y_thuc', 'chuyen_mon']);

// =============================================
// Student
// =============================================

export const StudentFormSchema = z.object({
    name: z
        .string()
        .min(1, 'Tên không được để trống')
        .max(100, 'Tên quá dài')
        .trim(),
    groupId: GroupIdSchema.default(GROUP_IDS[0]),
    birthYear: z.string().max(4).optional().default(''),
    phone: z.string().max(20).optional().default(''),
    avatarUrl: z.string().url('URL ảnh không hợp lệ').or(z.literal('')).optional().default(''),
    schedule: z
        .array(z.number().int().min(1).max(7))
        .max(7)
        .optional()
        .default([]),
});

export type StudentFormInput = z.infer<typeof StudentFormSchema>;

// =============================================
// Attendance
// =============================================

export const AttendanceBulkInputSchema = z.object({
    studentId: z.string().uuid('ID học sinh không hợp lệ'),
    status: AttendanceStatusSchema,
});

export const SaveAttendanceSchema = z.object({
    sessionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày không hợp lệ (YYYY-MM-DD)'),
    groupId: GroupIdSchema,
    records: z.array(AttendanceBulkInputSchema).min(1, 'Cần ít nhất 1 bản ghi'),
});

export type SaveAttendanceInput = z.infer<typeof SaveAttendanceSchema>;

// =============================================
// Score
// =============================================

export const DeductionSchema = z.object({
    reason: z.string().min(1).max(200),
    amount: z.number().min(0),
    date: z.string().optional(),
});

export const ScoreCriterionInputSchema = z.object({
    category: ScoreCategorySchema,
    criterionKey: z.string().min(1).max(10),
    label: z.string().max(100).default(''),
    value: z.number().min(0).max(100),
    maxValue: z.number().min(0).max(100),
    deductions: z.array(DeductionSchema).optional().default([]),
});

export const SaveScoreSchema = z.object({
    studentId: z.string().uuid('ID học sinh không hợp lệ'),
    weekKey: z.string().regex(/^\d{4}-W\d{2}$/, 'Week key không hợp lệ (YYYY-Www)'),
    criteria: z.array(ScoreCriterionInputSchema).min(1),
    notes: z.string().max(500).optional().default(''),
});

export type SaveScoreInput = z.infer<typeof SaveScoreSchema>;

// =============================================
// Attendance Stats Query
// =============================================

export const AttendanceStatsQuerySchema = z.object({
    studentId: z.string().uuid().optional().nullable(),
    groupId: GroupIdSchema.optional().nullable(),
    fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
    toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
});

export type AttendanceStatsQuery = z.infer<typeof AttendanceStatsQuerySchema>;

// =============================================
// App Config
// =============================================

export const AppConfigSchema = z.object({
    key: z.string().min(1).max(100),
    value: z.unknown(),
});

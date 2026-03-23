// =============================================
// VALIDATION SCHEMAS — Unit Tests
// =============================================

import { describe, it, expect } from 'vitest';
import {
    StudentFormSchema,
    SaveAttendanceSchema,
    SaveScoreSchema,
    DeductionSchema,
    GroupIdSchema,
    AttendanceStatusSchema,
    ScoreCategorySchema,
} from '@/types/validation';

// =============================================
// ENUMS
// =============================================

describe('GroupIdSchema', () => {
    it('accepts valid group IDs', () => {
        expect(GroupIdSchema.safeParse('nhom_1').success).toBe(true);
        expect(GroupIdSchema.safeParse('nhom_2').success).toBe(true);
        expect(GroupIdSchema.safeParse('nhom_3').success).toBe(true);
    });

    it('rejects invalid group IDs', () => {
        expect(GroupIdSchema.safeParse('nhom_4').success).toBe(false);
        expect(GroupIdSchema.safeParse('').success).toBe(false);
        expect(GroupIdSchema.safeParse(123).success).toBe(false);
    });
});

describe('AttendanceStatusSchema', () => {
    it('accepts valid statuses', () => {
        expect(AttendanceStatusSchema.safeParse('present').success).toBe(true);
        expect(AttendanceStatusSchema.safeParse('absent').success).toBe(true);
        expect(AttendanceStatusSchema.safeParse('excused').success).toBe(true);
    });

    it('rejects invalid statuses', () => {
        expect(AttendanceStatusSchema.safeParse('late').success).toBe(false);
        expect(AttendanceStatusSchema.safeParse('').success).toBe(false);
    });
});

describe('ScoreCategorySchema', () => {
    it('accepts valid categories', () => {
        expect(ScoreCategorySchema.safeParse('chuyen_can').success).toBe(true);
        expect(ScoreCategorySchema.safeParse('y_thuc').success).toBe(true);
        expect(ScoreCategorySchema.safeParse('chuyen_mon').success).toBe(true);
    });

    it('rejects invalid categories', () => {
        expect(ScoreCategorySchema.safeParse('invalid').success).toBe(false);
    });
});

// =============================================
// STUDENT FORM
// =============================================

describe('StudentFormSchema', () => {
    const validStudent = {
        name: 'Nguyễn Văn A',
        groupId: 'nhom_1',
        birthYear: '2010',
        phone: '0909123456',
        avatarUrl: '',
        schedule: [2, 4, 6],
    };

    it('accepts valid student data', () => {
        const result = StudentFormSchema.safeParse(validStudent);
        expect(result.success).toBe(true);
    });

    it('applies defaults for optional fields', () => {
        const result = StudentFormSchema.safeParse({ name: 'Test' });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.groupId).toBe('nhom_1');
            expect(result.data.birthYear).toBe('');
            expect(result.data.phone).toBe('');
            expect(result.data.schedule).toEqual([]);
        }
    });

    it('rejects empty name', () => {
        const result = StudentFormSchema.safeParse({ ...validStudent, name: '' });
        expect(result.success).toBe(false);
    });

    it('rejects name over 100 characters', () => {
        const result = StudentFormSchema.safeParse({
            ...validStudent,
            name: 'A'.repeat(101),
        });
        expect(result.success).toBe(false);
    });

    it('trims whitespace from name', () => {
        const result = StudentFormSchema.safeParse({
            ...validStudent,
            name: '  Nguyễn Văn B  ',
        });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.name).toBe('Nguyễn Văn B');
        }
    });

    it('rejects invalid group ID', () => {
        const result = StudentFormSchema.safeParse({
            ...validStudent,
            groupId: 'nhom_99',
        });
        expect(result.success).toBe(false);
    });

    it('rejects invalid avatar URL', () => {
        const result = StudentFormSchema.safeParse({
            ...validStudent,
            avatarUrl: 'not-a-url',
        });
        expect(result.success).toBe(false);
    });

    it('accepts valid avatar URL', () => {
        const result = StudentFormSchema.safeParse({
            ...validStudent,
            avatarUrl: 'https://example.com/avatar.png',
        });
        expect(result.success).toBe(true);
    });

    it('rejects schedule with day > 7', () => {
        const result = StudentFormSchema.safeParse({
            ...validStudent,
            schedule: [1, 8],
        });
        expect(result.success).toBe(false);
    });

    it('rejects schedule with day < 1', () => {
        const result = StudentFormSchema.safeParse({
            ...validStudent,
            schedule: [0, 3],
        });
        expect(result.success).toBe(false);
    });
});

// =============================================
// SAVE ATTENDANCE
// =============================================

describe('SaveAttendanceSchema', () => {
    const validAttendance = {
        sessionDate: '2026-03-23',
        groupId: 'nhom_1',
        records: [
            { studentId: '550e8400-e29b-41d4-a716-446655440000', status: 'present' },
            { studentId: '550e8400-e29b-41d4-a716-446655440001', status: 'absent' },
        ],
    };

    it('accepts valid attendance data', () => {
        const result = SaveAttendanceSchema.safeParse(validAttendance);
        expect(result.success).toBe(true);
    });

    it('rejects invalid date format', () => {
        expect(
            SaveAttendanceSchema.safeParse({
                ...validAttendance,
                sessionDate: '23/03/2026',
            }).success
        ).toBe(false);

        expect(
            SaveAttendanceSchema.safeParse({
                ...validAttendance,
                sessionDate: '2026-3-23',
            }).success
        ).toBe(false);
    });

    it('rejects empty records array', () => {
        const result = SaveAttendanceSchema.safeParse({
            ...validAttendance,
            records: [],
        });
        expect(result.success).toBe(false);
    });

    it('rejects invalid UUID in records', () => {
        const result = SaveAttendanceSchema.safeParse({
            ...validAttendance,
            records: [{ studentId: 'not-a-uuid', status: 'present' }],
        });
        expect(result.success).toBe(false);
    });

    it('rejects invalid status in records', () => {
        const result = SaveAttendanceSchema.safeParse({
            ...validAttendance,
            records: [
                { studentId: '550e8400-e29b-41d4-a716-446655440000', status: 'late' },
            ],
        });
        expect(result.success).toBe(false);
    });
});

// =============================================
// DEDUCTION
// =============================================

describe('DeductionSchema', () => {
    it('accepts valid deduction', () => {
        const result = DeductionSchema.safeParse({
            reason: 'Đi trễ 10 phút',
            amount: 2,
        });
        expect(result.success).toBe(true);
    });

    it('accepts deduction with optional date', () => {
        const result = DeductionSchema.safeParse({
            reason: 'Nghỉ không phép',
            amount: 5,
            date: '2026-03-20',
        });
        expect(result.success).toBe(true);
    });

    it('rejects empty reason', () => {
        const result = DeductionSchema.safeParse({ reason: '', amount: 1 });
        expect(result.success).toBe(false);
    });

    it('rejects negative amount', () => {
        const result = DeductionSchema.safeParse({ reason: 'Test', amount: -1 });
        expect(result.success).toBe(false);
    });
});

// =============================================
// SAVE SCORE
// =============================================

describe('SaveScoreSchema', () => {
    const validScore = {
        studentId: '550e8400-e29b-41d4-a716-446655440000',
        weekKey: '2026-W12',
        criteria: [
            {
                category: 'chuyen_can',
                criterionKey: 'CC1',
                label: 'Đi học đầy đủ',
                value: 8,
                maxValue: 10,
            },
        ],
        notes: 'Học tốt',
    };

    it('accepts valid score data', () => {
        const result = SaveScoreSchema.safeParse(validScore);
        expect(result.success).toBe(true);
    });

    it('rejects invalid week key format', () => {
        expect(
            SaveScoreSchema.safeParse({ ...validScore, weekKey: '2026-12' }).success
        ).toBe(false);

        expect(
            SaveScoreSchema.safeParse({ ...validScore, weekKey: 'week-12' }).success
        ).toBe(false);
    });

    it('rejects empty criteria array', () => {
        const result = SaveScoreSchema.safeParse({
            ...validScore,
            criteria: [],
        });
        expect(result.success).toBe(false);
    });

    it('rejects criteria value exceeding max', () => {
        const result = SaveScoreSchema.safeParse({
            ...validScore,
            criteria: [
                {
                    category: 'chuyen_can',
                    criterionKey: 'CC1',
                    label: 'Test',
                    value: 101,  // exceeds max 100
                    maxValue: 10,
                },
            ],
        });
        expect(result.success).toBe(false);
    });

    it('rejects notes over 500 characters', () => {
        const result = SaveScoreSchema.safeParse({
            ...validScore,
            notes: 'A'.repeat(501),
        });
        expect(result.success).toBe(false);
    });

    it('accepts score with deductions in criteria', () => {
        const result = SaveScoreSchema.safeParse({
            ...validScore,
            criteria: [
                {
                    category: 'y_thuc',
                    criterionKey: 'YT1',
                    label: 'Ý thức tốt',
                    value: 7,
                    maxValue: 10,
                    deductions: [{ reason: 'Nói chuyện', amount: 3 }],
                },
            ],
        });
        expect(result.success).toBe(true);
    });
});

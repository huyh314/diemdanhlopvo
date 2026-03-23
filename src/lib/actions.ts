// =============================================
// SERVER ACTIONS — All mutation entry points
// =============================================

'use server';

import { revalidatePath } from 'next/cache';
import * as dal from '@/lib/dal';
import {
    StudentFormSchema,
    SaveAttendanceSchema,
    SaveScoreSchema,
} from '@/types/validation';
import type { GroupId } from '@/types/database.types';
import { type ActionResult, Success, Failure, ValidationError } from '@/types';

// =============================================
// STUDENT ACTIONS
// =============================================

export async function createStudentAction(formData: FormData): Promise<ActionResult<import('@/types/database.types').StudentRow>> {
    try {
        const raw = {
            name: formData.get('name'),
            groupId: formData.get('groupId'),
            birthYear: formData.get('birthYear'),
            phone: formData.get('phone'),
            avatarUrl: formData.get('avatarUrl'),
            schedule: formData.get('schedule')
                ? JSON.parse(formData.get('schedule') as string)
                : [],
        };

        const parsed = StudentFormSchema.safeParse(raw);
        if (!parsed.success) {
            throw new ValidationError('Dữ liệu không hợp lệ', parsed.error.flatten().fieldErrors);
        }

        const student = await dal.createStudent({
            name: parsed.data.name,
            group_id: parsed.data.groupId as GroupId,
            birth_year: parsed.data.birthYear,
            phone: parsed.data.phone,
            avatar_url: parsed.data.avatarUrl,
            schedule: parsed.data.schedule,
        });

        revalidatePath('/attendance');
        revalidatePath('/students');
        return Success(student);
    } catch (e) {
        return Failure(e);
    }
}

export async function updateStudentAction(id: string, formData: FormData): Promise<ActionResult<import('@/types/database.types').StudentRow>> {
    try {
        const raw = {
            name: formData.get('name'),
            groupId: formData.get('groupId'),
            birthYear: formData.get('birthYear'),
            phone: formData.get('phone'),
            avatarUrl: formData.get('avatarUrl'),
            schedule: formData.get('schedule')
                ? JSON.parse(formData.get('schedule') as string)
                : undefined,
        };

        const parsed = StudentFormSchema.safeParse(raw);
        if (!parsed.success) {
            throw new ValidationError('Dữ liệu không hợp lệ', parsed.error.flatten().fieldErrors);
        }

        const student = await dal.updateStudent(id, {
            name: parsed.data.name,
            group_id: parsed.data.groupId as GroupId,
            birth_year: parsed.data.birthYear,
            phone: parsed.data.phone,
            avatar_url: parsed.data.avatarUrl,
            schedule: parsed.data.schedule,
        });

        revalidatePath('/attendance');
        revalidatePath(`/students/${id}`);
        return Success(student);
    } catch (e) {
        return Failure(e);
    }
}

export async function deleteStudentAction(id: string): Promise<ActionResult<void>> {
    try {
        await dal.deleteStudent(id);
        revalidatePath('/attendance');
        revalidatePath('/students');
        return Success(undefined);
    } catch (e) {
        return Failure(e);
    }
}

// =============================================
// ATTENDANCE ACTIONS
// =============================================

export async function saveAttendanceAction(input: {
    sessionDate: string;
    groupId: GroupId;
    records: { studentId: string; status: string }[];
}): Promise<ActionResult<{ data: import('@/types/database.types').AttendanceRow[], sessionId: string }>> {
    try {
        const parsed = SaveAttendanceSchema.safeParse(input);
        if (!parsed.success) {
            throw new ValidationError('Dữ liệu điểm danh không hợp lệ', parsed.error.flatten().fieldErrors);
        }

        // 1. Get or create session
        const sessionId = await dal.getOrCreateSession(
            parsed.data.sessionDate,
            parsed.data.groupId as GroupId
        );

        // 2. Bulk upsert attendance
        const results = await dal.saveAttendance(sessionId, parsed.data.records);

        revalidatePath('/attendance');
        revalidatePath('/rankings');
        return Success({ data: results, sessionId });
    } catch (e) {
        return Failure(e);
    }
}

// =============================================
// SCORE ACTIONS
// =============================================

export async function saveScoreAction(input: {
    studentId: string;
    weekKey: string;
    criteria: {
        category: string;
        criterionKey: string;
        label: string;
        value: number;
        maxValue: number;
        deductions?: { reason: string; amount: number; date?: string }[];
    }[];
    notes?: string;
}): Promise<ActionResult<import('@/types/database.types').ScoreRow>> {
    try {
        const parsed = SaveScoreSchema.safeParse(input);
        if (!parsed.success) {
            throw new ValidationError('Dữ liệu điểm thi đua không hợp lệ', parsed.error.flatten().fieldErrors);
        }

        // Calculate total from criteria
        const total = parsed.data.criteria.reduce((sum, c) => sum + c.value, 0);

        const score = await dal.saveScore({
            studentId: parsed.data.studentId,
            weekKey: parsed.data.weekKey,
            total,
            notes: parsed.data.notes,
            criteria: parsed.data.criteria,
        });

        revalidatePath('/rankings');
        revalidatePath(`/students/${parsed.data.studentId}`);
        return Success(score);
    } catch (e) {
        return Failure(e);
    }
}

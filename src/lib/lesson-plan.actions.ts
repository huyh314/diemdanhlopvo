// =============================================
// LESSON PLAN SERVER ACTIONS
// =============================================

'use server';

import { revalidatePath } from 'next/cache';
import * as dal from '@/lib/dal';
import { type ActionResult, Success, Failure, ValidationError } from '@/types';
import type { LessonPlanRow, LessonPlanContent, GroupId } from '@/types/database.types';

// =============================================
// HELPERS
// =============================================

function getWeekKey(dateStr: string): string {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    // ISO week number
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${year}-W${String(weekNo).padStart(2, '0')}`;
}

function parseContent(rawContent: string): LessonPlanContent[] {
    try {
        const parsed = JSON.parse(rawContent);
        if (Array.isArray(parsed)) return parsed as LessonPlanContent[];
    } catch {
        // ignore
    }
    return [];
}

// =============================================
// CREATE
// =============================================

export async function createLessonPlanAction(input: {
    sessionDate: string;
    groupId: string;
    title: string;
    content: LessonPlanContent[];
    notes?: string;
    attachments?: string[];
    techniqueIds?: string[];
}): Promise<ActionResult<LessonPlanRow>> {
    try {
        if (!input.sessionDate || !input.title.trim()) {
            throw new ValidationError('Giáo án cần có ngày và tiêu đề', {});
        }

        const plan = await dal.createLessonPlan({
            session_date: input.sessionDate,
            week_key: getWeekKey(input.sessionDate),
            group_id: input.groupId as GroupId,
            title: input.title.trim(),
            content: input.content,
            notes: input.notes || null,
            attachments: input.attachments ?? [],
            technique_ids: input.techniqueIds ?? [],
        });

        revalidatePath('/lesson-plans');
        return Success(plan);
    } catch (e) {
        return Failure(e);
    }
}

// =============================================
// UPDATE
// =============================================

export async function updateLessonPlanAction(
    id: string,
    input: {
        sessionDate?: string;
        groupId?: string;
        title?: string;
        content?: LessonPlanContent[];
        notes?: string;
        attachments?: string[];
        techniqueIds?: string[];
    }
): Promise<ActionResult<LessonPlanRow>> {
    try {
        const updateData: Parameters<typeof dal.updateLessonPlan>[1] = {};

        if (input.sessionDate) {
            updateData.session_date = input.sessionDate;
            updateData.week_key = getWeekKey(input.sessionDate);
        }
        if (input.groupId) updateData.group_id = input.groupId as GroupId;
        if (input.title) updateData.title = input.title.trim();
        if (input.content !== undefined) updateData.content = input.content;
        if (input.notes !== undefined) updateData.notes = input.notes || null;
        if (input.attachments !== undefined) updateData.attachments = input.attachments;
        if (input.techniqueIds !== undefined) updateData.technique_ids = input.techniqueIds;

        const plan = await dal.updateLessonPlan(id, updateData);
        revalidatePath('/lesson-plans');
        return Success(plan);
    } catch (e) {
        return Failure(e);
    }
}

// =============================================
// DELETE
// =============================================

export async function deleteLessonPlanAction(id: string): Promise<ActionResult<void>> {
    try {
        await dal.deleteLessonPlan(id);
        revalidatePath('/lesson-plans');
        return Success(undefined);
    } catch (e) {
        return Failure(e);
    }
}

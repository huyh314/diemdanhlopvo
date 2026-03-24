'use server'

import { revalidatePath } from 'next/cache';
import { saveBatchCriterionScore } from '@/lib/dal';
import { ScoreCategory } from '@/types/database.types';

export async function saveBatchScoresAction(input: {
    weekKey: string;
    category: ScoreCategory;
    criterionKey: string;
    label: string;
    maxValue: number;
    studentValues: { studentId: string; value: number }[];
}) {
    try {
        await saveBatchCriterionScore(input);

        // Revalidate rankings
        revalidatePath('/rankings');
        revalidatePath('/rankings/batch-grade');
        revalidatePath('/'); // Dashboard

        return { success: true };
    } catch (e) {
        console.error('Lỗi khi lưu điểm hàng loạt:', e);
        return { error: e instanceof Error ? e.message : 'Có lỗi xảy ra khi lưu điểm' };
    }
}

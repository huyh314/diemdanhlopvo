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

function getWeekRange(weekKey: string) {
    const [yStr, wStr] = weekKey.split('-W');
    const y = parseInt(yStr, 10);
    const w = parseInt(wStr, 10);
    
    const simple = new Date(Date.UTC(y, 0, 1));
    const dayOfWeek = simple.getUTCDay() || 7;
    const firstMonday = new Date(Date.UTC(y, 0, 1 + (8 - dayOfWeek) % 7));
    if (dayOfWeek <= 4) firstMonday.setUTCDate(firstMonday.getUTCDate() - 7);
    
    const startOfWeek = new Date(firstMonday);
    startOfWeek.setUTCDate(startOfWeek.getUTCDate() + (w - 1) * 7);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setUTCDate(endOfWeek.getUTCDate() + 6);
    
    return {
        fromDate: startOfWeek.toISOString().split('T')[0],
        toDate: endOfWeek.toISOString().split('T')[0]
    };
}

import { getAutoChuyenCan } from '@/lib/dal';

export async function fetchAutoChuyenCanBatch(weekKey: string, studentIds: string[]) {
    try {
        const { fromDate, toDate } = getWeekRange(weekKey);
        const results: Record<string, number> = {};
        
        // Split array into chunks to avoid overwhelming the database
        const chunkSize = 10;
        for (let i = 0; i < studentIds.length; i += chunkSize) {
            const chunk = studentIds.slice(i, i + chunkSize);
            await Promise.all(
                chunk.map(async (id) => {
                    const score = await getAutoChuyenCan(id, fromDate, toDate);
                    results[id] = score || 0;
                })
            );
        }
        
        return { data: results };
    } catch (e) {
        console.error('Lỗi tính tự động chuyên cần:', e);
        return { error: 'Lỗi tính tự động chuyên cần' };
    }
}

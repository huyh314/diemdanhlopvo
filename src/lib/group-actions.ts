'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { CreateGroupSchema } from '@/types/validation';
import { Success, Failure, type ActionResult } from '@/types';
import type { StudentGroup } from '@/lib/constants';

export async function createGroupAction(input: { name: string; shortName?: string }): Promise<ActionResult<StudentGroup>> {
    const parsed = CreateGroupSchema.safeParse(input);
    if (!parsed.success) return Failure(new Error(parsed.error.issues[0].message));
    try {
        const client = await createClient();
        const { data, error } = await client.from('student_groups').insert({
            name: parsed.data.name,
            short_name: parsed.data.shortName || parsed.data.name.slice(0, 12),
        }).select().single();
        if (error) throw new Error(error.code === '23505'
            ? 'Tên nhóm đã tồn tại. Anh chọn tên khác nhé.'
            : 'Chưa tạo được nhóm. Kiểm tra kết nối và thử lại.');
        revalidatePath('/attendance');
        revalidatePath('/lesson-plans');
        return Success({ id: data.id, name: data.name, shortName: data.short_name });
    } catch (error) { return Failure(error); }
}

'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { bulkDeleteStudents } from '@/lib/dal';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function bulkDeleteStudentsAction(studentIds: string[]) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return { error: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' };

        if (!Array.isArray(studentIds) || studentIds.length === 0 || studentIds.length > 300) {
            return { error: 'Danh sách học sinh cần xóa không hợp lệ.' };
        }

        const uniqueIds = [...new Set(studentIds)];
        if (uniqueIds.length !== studentIds.length || uniqueIds.some((id) => !UUID_PATTERN.test(id))) {
            return { error: 'Danh sách học sinh cần xóa không hợp lệ.' };
        }

        const deleted = await bulkDeleteStudents(uniqueIds);
        revalidatePath('/students');
        revalidatePath('/');
        revalidatePath('/attendance');
        revalidatePath('/rankings');

        return { success: true as const, deleted };
    } catch (error) {
        console.error('Lỗi khi xóa nhiều học sinh:', error);
        return { error: error instanceof Error ? error.message : 'Có lỗi xảy ra khi xóa học sinh.' };
    }
}

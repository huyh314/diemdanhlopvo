'use server';

import { revalidatePath } from 'next/cache';
import { getStudent } from '@/lib/dal';
import { createClient } from '@/utils/supabase/server';
import { AVATAR_MAX_UPLOAD_BYTES, AVATAR_PATH_PATTERN, UUID_PATTERN, avatarMediaUrl } from './avatar';

export async function prepareAvatarUploadAction(id: string, size: number) {
    if (!UUID_PATTERN.test(id) || !Number.isFinite(size) || size <= 0 || size > AVATAR_MAX_UPLOAD_BYTES) {
        return { success: false as const, error: 'Thông tin ảnh không hợp lệ hoặc ảnh vượt quá 4 MB.' };
    }
    try {
        const student = await getStudent(id);
        if (!student.is_active) return { success: false as const, error: 'Học sinh không còn trong danh sách.' };
        const supabase = await createClient();
        const path = `${id}-${Date.now()}-${crypto.randomUUID()}.jpg`;
        const { data, error } = await supabase.storage.from('avatars').createSignedUploadUrl(path);
        if (error || !data) throw error ?? new Error('Missing upload token');
        return { success: true as const, path, token: data.token };
    } catch (error) {
        console.error('Prepare avatar upload:', error);
        return { success: false as const, error: 'Không thể chuẩn bị tải ảnh. Vui lòng thử lại.' };
    }
}

export async function completeAvatarUploadAction(id: string, path: string) {
    if (!UUID_PATTERN.test(id) || !AVATAR_PATH_PATTERN.test(path) || !path.startsWith(`${id}-`)) {
        return { success: false as const, error: 'Ảnh không thuộc học sinh này.' };
    }
    try {
        const supabase = await createClient();
        const { data: file, error: fileError } = await supabase.storage.from('avatars').info(path);
        if (fileError || !file || !file.size || file.size > AVATAR_MAX_UPLOAD_BYTES || file.contentType !== 'image/jpeg') {
            return { success: false as const, error: 'Ảnh chưa tải lên đầy đủ hoặc không hợp lệ. Vui lòng chọn lại ảnh.' };
        }
        const url = avatarMediaUrl(path);
        const { error } = await supabase.from('students')
            .update({ avatar_url: url }).eq('id', id).eq('is_active', true).select('id').single();
        if (error) throw error;

        for (const route of [`/students/${id}`, '/students', '/attendance', '/rankings/batch-grade', '/']) {
            revalidatePath(route);
        }
        return { success: true as const, url };
    } catch (error) {
        console.error('Save student avatar:', error);
        return { success: false as const, error: 'Không lưu được ảnh đại diện. Vui lòng thử lại.' };
    }
}

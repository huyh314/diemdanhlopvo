'use server'

import { revalidatePath } from 'next/cache';
import { updateStudent, deleteStudent } from '@/lib/dal';
import { GroupId } from '@/types/database.types';
import { createClient } from '@/utils/supabase/server';

export async function updateStudentAction(id: string, formData: FormData) {
    try {
        const name = formData.get('name') as string;
        const group_id = formData.get('group_id') as string;
        const birth_year = formData.get('birth_year') as string;
        const phone = formData.get('phone') as string;

        if (!name || !group_id) {
            return { error: 'Tên và nhóm không được để trống' };
        }

        await updateStudent(id, {
            name: name.trim(),
            group_id: group_id as GroupId,
            birth_year: birth_year ? birth_year.trim() : undefined,
            phone: phone ? phone.trim() : undefined,
        });

        // Revalidate affected pages
        revalidatePath(`/students/${id}`);
        revalidatePath('/students');
        revalidatePath('/'); // Dashboard might contain rankings

        return { success: true };
    } catch (e) {
        console.error('Lỗi khi cập nhật học sinh:', e);
        return { error: e instanceof Error ? e.message : 'Có lỗi xảy ra khi cập nhật' };
    }
}

export async function deleteStudentAction(id: string) {
    try {
        await deleteStudent(id);

        // Revalidate affected pages
        revalidatePath('/students');
        revalidatePath('/'); // Dashboard might contain rankings

        return { success: true };
    } catch (e) {
        console.error('Lỗi khi xóa học sinh:', e);
        return { error: e instanceof Error ? e.message : 'Có lỗi xảy ra khi xóa' };
    }
}

export async function uploadAvatarAction(id: string, formData: FormData) {
    try {
        const file = formData.get('avatar') as File | null;
        if (!file || file.size === 0) return { error: 'Vui lòng chọn một tệp ảnh hợp lệ' };

        if (file.size > 5 * 1024 * 1024) {
            return { error: 'Kích thước ảnh vượt quá 5MB. Vui lòng chọn ảnh nhỏ hơn.' };
        }

        const supabase = await createClient();
        const ext = file.name.split('.').pop() || 'jpg';
        const fileName = `${id}-${Date.now()}.${ext}`;

        const { data, error } = await supabase.storage
            .from('avatars')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false // Prevent accidentally overwriting a totally different file if names collide
            });

        if (error) {
            console.error('Lỗi upload Storage:', error);
            return { error: 'Lỗi tải ảnh lên: ' + error.message };
        }

        const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);

        // Lưu URL vào thông tin học sinh trong CSDL
        await updateStudent(id, { avatar_url: publicUrl });

        // Yêu cầu Next.js xóa cache và tải lại dữ liệu mới nhất
        revalidatePath(`/students/${id}`);
        revalidatePath('/students');
        revalidatePath('/');
        revalidatePath('/rankings/batch-grade');

        return { success: true, url: publicUrl };
    } catch (e) {
        console.error('Lỗi khi cập nhật ảnh đại diện:', e);
        return { error: e instanceof Error ? e.message : 'Có lỗi hệ thống xảy ra khi tải ảnh' };
    }
}

'use server'

import { revalidatePath } from 'next/cache';
import { updateStudent, deleteStudent } from '@/lib/dal';
import { GroupId } from '@/types/database.types';

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

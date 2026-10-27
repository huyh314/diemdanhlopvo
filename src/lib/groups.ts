import 'server-only';
import { cache } from 'react';
import { createClient } from '@/utils/supabase/server';
import type { StudentGroup } from '@/lib/constants';

export const getGroups = cache(async (): Promise<StudentGroup[]> => {
    const client = await createClient();
    const { data, error } = await client.from('student_groups').select('*')
        .order('sort_order').order('created_at').order('id');
    if (error) throw new Error('Chưa tải được danh sách nhóm. Vui lòng thử lại.');
    return data.map(group => ({ id: group.id, name: group.name, shortName: group.short_name }));
});

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GroupsProvider, useGroups } from '@/components/GroupsProvider';
import { GROUPS } from '@/lib/constants';
import { createGroupAction } from '@/lib/group-actions';
import { CreateGroupSchema, StudentFormSchema, SaveAttendanceSchema } from '@/types/validation';
import { readStudentsSnapshot, saveStudentsSnapshot } from '@/lib/students-snapshot';

const { insert, single, revalidatePath } = vi.hoisted(() => ({ insert: vi.fn(), single: vi.fn(), revalidatePath: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('@/utils/supabase/server', () => ({
    createClient: async () => ({ from: () => ({ insert }) }),
}));

const customGroup = { id: 'group_5edb0df9-289d-445d-aeac-cc4a3d938fc7', name: 'Nhóm nâng cao', shortName: 'NC' };
beforeEach(() => { vi.clearAllMocks(); insert.mockReturnValue({ select: () => ({ single }) }); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); localStorage.clear(); });

describe('custom groups', () => {
    it('validates names and accepts custom group IDs in student and attendance forms', () => {
        expect(CreateGroupSchema.safeParse({ name: '   ' }).success).toBe(false);
        expect(CreateGroupSchema.safeParse({ name: 'a'.repeat(81) }).success).toBe(false);
        expect(CreateGroupSchema.parse({ name: '  Nhóm nâng cao  ' }).name).toBe('Nhóm nâng cao');
        expect(StudentFormSchema.safeParse({ name: 'Học sinh mới', groupId: customGroup.id }).success).toBe(true);
        expect(SaveAttendanceSchema.safeParse({ sessionDate: '2026-10-27', groupId: customGroup.id, records: [{ studentId: 'eabb0df9-289d-445d-aeac-cc4a3d938fc7', status: 'present' }] }).success).toBe(true);
    });

    it('saves a custom group and returns its persistent ID and display labels', async () => {
        single.mockResolvedValue({ data: { ...customGroup, short_name: 'NC' }, error: null });
        const result = await createGroupAction({ name: '  Nhóm nâng cao  ', shortName: 'NC' });
        expect(result).toEqual({ success: true, data: customGroup });
        expect(insert).toHaveBeenCalledWith({ name: customGroup.name, short_name: 'NC' });
        expect(revalidatePath).toHaveBeenCalledWith('/attendance');
    });

    it('rejects blank names before writing and reports duplicate names clearly', async () => {
        expect((await createGroupAction({ name: '   ' })).success).toBe(false);
        expect(insert).not.toHaveBeenCalled();
        single.mockResolvedValue({ data: null, error: { code: '23505' } });
        const result = await createGroupAction({ name: 'Nhóm 1' });
        expect(result.success).toBe(false);
        if (!result.success) expect(result.error).toContain('đã tồn tại');
        expect(revalidatePath).not.toHaveBeenCalled();
    });

    it('refreshes the shared group list after returning to the app on another device', async () => {
        const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => GROUPS });
        vi.stubGlobal('fetch', fetchMock);
        vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
        function GroupList() {
            const { groups, getGroupName } = useGroups();
            return <ul>{groups.map(group => <li key={group.id}>{getGroupName(group.id)}</li>)}</ul>;
        }
        render(<GroupsProvider><GroupList /></GroupsProvider>);
        expect(screen.getByText('Nhóm 1')).toBeInTheDocument();
        fetchMock.mockResolvedValue({ ok: true, json: async () => [...GROUPS, customGroup] });
        fireEvent.focus(window);
        expect(await screen.findByText(customGroup.name)).toBeInTheDocument();
    });

    it('keeps students in custom groups in the fast-opening display snapshot', () => {
        saveStudentsSnapshot([{ id: 'eabb0df9-289d-445d-aeac-cc4a3d938fc7', name: 'Học sinh mới', group_id: customGroup.id, birth_year: '', phone: '', avatar_url: '', is_active: true, schedule: [], created_at: '', updated_at: '' }]);
        expect(readStudentsSnapshot()?.[0].group_id).toBe(customGroup.id);
    });
});

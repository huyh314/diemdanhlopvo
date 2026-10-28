import type { GroupId } from '@/types/database.types';

export interface StudentGroup { id: GroupId; name: string; shortName: string }

export const GROUPS: StudentGroup[] = [
    { id: 'nhom_1', name: 'Nhóm 1', shortName: 'N1' },
    { id: 'nhom_2', name: 'Nhóm 2', shortName: 'N2' },
    { id: 'nhom_3', name: 'Nhóm 3', shortName: 'N3' },
];

export const GROUP_IDS = GROUPS.map((g) => g.id);

export function getGroupName(id: string, groups: StudentGroup[] = GROUPS): string {
    return groups.find((g) => g.id === id)?.name ?? id;
}

export function getGroupShortName(id: string, groups: StudentGroup[] = GROUPS): string {
    return groups.find((g) => g.id === id)?.shortName ?? id;
}

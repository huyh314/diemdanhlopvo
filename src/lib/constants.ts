import { GroupId } from '@/types/database.types';

export const GROUPS: { id: GroupId; name: string; shortName: string }[] = [
    { id: 'nhom_1', name: 'Nhóm 1', shortName: 'N1' },
    { id: 'nhom_2', name: 'Nhóm 2', shortName: 'N2' },
    { id: 'nhom_3', name: 'Nhóm 3', shortName: 'N3' },
];

export const GROUP_IDS = GROUPS.map((g) => g.id);

export function getGroupName(id: string): string {
    const group = GROUPS.find((g) => g.id === id);
    return group ? group.name : 'Unknown Group';
}

export function getGroupShortName(id: string): string {
    const group = GROUPS.find((g) => g.id === id);
    return group ? group.shortName : 'N/A';
}

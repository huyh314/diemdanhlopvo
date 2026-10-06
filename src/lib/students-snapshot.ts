import type { StudentRow } from '@/types/database.types';
import { GROUP_IDS } from './constants';

const KEY = 'vo-duong:students-preview:v1';
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

/** A display-only snapshot; current server data is required before bulk deletion. */
export function readStudentsSnapshot(): StudentRow[] | null {
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw || raw.length > 512_000) return null;
        const snapshot = JSON.parse(raw);
        const age = Date.now() - snapshot.savedAt;
        if (!Number.isFinite(age) || age < 0 || age > MAX_AGE_MS || !Array.isArray(snapshot.students)) return null;
        if (!snapshot.students.every((student: StudentRow) => student &&
            typeof student.id === 'string' && /^[0-9a-f-]{36}$/i.test(student.id) &&
            typeof student.name === 'string' && GROUP_IDS.includes(student.group_id) &&
            typeof student.birth_year === 'string' && typeof student.phone === 'string' &&
            typeof student.avatar_url === 'string' && student.is_active === true)) return null;
        return snapshot.students;
    } catch {
        return null;
    }
}

export function saveStudentsSnapshot(students: StudentRow[]) {
    try {
        const snapshot = JSON.stringify({
            savedAt: Date.now(),
            students: students.map(student => ({
                ...student,
                birth_year: student.birth_year ?? '',
                phone: student.phone ?? '',
                avatar_url: student.avatar_url ?? '',
            })),
        });
        if (snapshot.length <= 512_000) localStorage.setItem(KEY, snapshot);
    } catch {
        // Private browsing or full storage must not prevent the live list from loading.
    }
}

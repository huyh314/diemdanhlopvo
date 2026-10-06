'use client';

import { useEffect, useState } from 'react';
import { GROUPS } from '@/lib/constants';
import { STUDENTS_CHANGED_EVENT } from '@/lib/students-events';
import type { StudentRow } from '@/types/database.types';
import { createClient } from '@/utils/supabase/client';
import StudentsList from './StudentsList';
import StudentsLoading from './loading';

export default function StudentsLoader() {
    const [students, setStudents] = useState<StudentRow[] | null>(null);
    const [error, setError] = useState('');
    const [pending, setPending] = useState(true);
    const [revision, setRevision] = useState(0);

    useEffect(() => {
        let disposed = false;
        let activeRequest: AbortController | undefined;

        async function refresh() {
            activeRequest?.abort();
            const request = new AbortController();
            activeRequest = request;
            const timeout = setTimeout(() => request.abort(), 15000);
            setPending(true);
            try {
                // Keep the entry page static and read fresh data under the existing RLS policies.
                if (disposed || activeRequest !== request) return;
                const { data, error: queryError } = await createClient().from('students')
                    .select('*').eq('is_active', true).order('name', { ascending: true })
                    .abortSignal(request.signal);
                if (disposed || activeRequest !== request) return;
                if (queryError) throw queryError;
                setStudents(data ?? []);
                setError('');
            } catch {
                if (!disposed && activeRequest === request) {
                    setError('Chưa tải được danh sách mới. Kiểm tra kết nối mạng và thử lại.');
                }
            } finally {
                clearTimeout(timeout);
                if (!disposed && activeRequest === request) setPending(false);
            }
        }

        const refreshVisible = () => { if (document.visibilityState === 'visible') void refresh(); };
        void refresh();
        window.addEventListener(STUDENTS_CHANGED_EVENT, refresh);
        window.addEventListener('focus', refreshVisible);
        window.addEventListener('online', refreshVisible);
        document.addEventListener('visibilitychange', refreshVisible);
        return () => {
            disposed = true;
            activeRequest?.abort();
            window.removeEventListener(STUDENTS_CHANGED_EVENT, refresh);
            window.removeEventListener('focus', refreshVisible);
            window.removeEventListener('online', refreshVisible);
            document.removeEventListener('visibilitychange', refreshVisible);
        };
    }, [revision]);

    const groups = GROUPS.map(group => ({
        ...group,
        students: (students ?? []).filter(student => student.group_id === group.id),
    })).filter(group => group.students.length > 0);

    return (
        <div className="space-y-3" data-students-ready={students !== null}>
            <div className="flex flex-wrap items-center justify-end gap-2 text-sm">
                {error && <p role="alert" className="mr-auto text-amber-400">{error}{students !== null ? ' Đang hiển thị danh sách đã tải trước đó.' : ''}</p>}
                <button type="button" onClick={() => setRevision(value => value + 1)} disabled={pending}
                    className="min-h-10 rounded-lg border border-[var(--border-primary)] px-3 disabled:opacity-50">
                    {pending ? 'Đang cập nhật…' : error ? 'Thử lại' : '↻ Cập nhật'}
                </button>
            </div>
            {students === null
                ? error && !pending ? <p className="py-8 text-center text-[var(--text-secondary)]">Chưa có danh sách để hiển thị.</p> : <StudentsLoading />
                : <StudentsList groups={groups} total={students.length} />}
        </div>
    );
}

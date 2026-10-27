'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { GROUPS, getGroupName, getGroupShortName, type StudentGroup } from '@/lib/constants';

const defaultContext = {
    groups: GROUPS,
    error: '',
    addGroup: (_group: StudentGroup) => { void _group; },
    refresh: () => {},
};
const GroupsContext = createContext(defaultContext);

export function GroupsProvider({ children }: { children: ReactNode }) {
    const [groups, setGroups] = useState(GROUPS);
    const [error, setError] = useState('');
    const [revision, setRevision] = useState(0);
    const refresh = useCallback(() => setRevision(value => value + 1), []);
    const addGroup = useCallback((group: StudentGroup) => {
        setGroups(current => [...current.filter(item => item.id !== group.id), group]);
        setRevision(value => value + 1);
    }, []);

    useEffect(() => {
        let disposed = false;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15_000);
        fetch('/api/groups', { cache: 'no-store', signal: controller.signal })
            .then(async response => {
                if (!response.ok) throw new Error('groups');
                const data: StudentGroup[] = await response.json();
                if (!Array.isArray(data) || !data.every(group => typeof group.id === 'string' && typeof group.name === 'string' && typeof group.shortName === 'string')) throw new Error('groups');
                if (!controller.signal.aborted) { setGroups(data); setError(''); }
            })
            .catch(() => { if (!disposed) setError('Chưa tải được nhóm mới.'); })
            .finally(() => clearTimeout(timeout));
        return () => { disposed = true; controller.abort(); clearTimeout(timeout); };
    }, [revision]);

    useEffect(() => {
        const onVisible = () => { if (document.visibilityState === 'visible') refresh(); };
        window.addEventListener('focus', onVisible);
        window.addEventListener('online', refresh);
        document.addEventListener('visibilitychange', onVisible);
        return () => {
            window.removeEventListener('focus', onVisible);
            window.removeEventListener('online', refresh);
            document.removeEventListener('visibilitychange', onVisible);
        };
    }, [refresh]);

    return <GroupsContext.Provider value={{ groups, error, addGroup, refresh }}>{children}</GroupsContext.Provider>;
}

export function useGroups() {
    const context = useContext(GroupsContext);
    return {
        ...context,
        getGroupName: (id: string) => getGroupName(id, context.groups),
        getGroupShortName: (id: string) => getGroupShortName(id, context.groups),
    };
}

export function GroupLabel({ id, short = false }: { id: string; short?: boolean }) {
    const groups = useGroups();
    return <>{short ? groups.getGroupShortName(id) : groups.getGroupName(id)}</>;
}

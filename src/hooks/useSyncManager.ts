'use client';

import { useEffect, useState } from 'react';
import { getSyncQueue, clearSyncAction } from '@/lib/offline-db';
import { saveAttendanceAction } from '@/lib/actions';
import { useToast } from '@/components/Toast';

export function useSyncManager() {
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const handleOnline = async () => {
      // Small delay to ensure connection is stable
      setTimeout(async () => {
        await flushQueue();
      }, 1000);
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  const flushQueue = async () => {
    if (isSyncing || typeof window === 'undefined') return;
    setIsSyncing(true);

    try {
      const queue = await getSyncQueue();
      if (!queue || queue.length === 0) {
        setIsSyncing(false);
        return;
      }

      toast(`Đang đồng bộ ${queue.length} tác vụ offline...`, 'info');
      let successCount = 0;

      for (const action of queue) {
        try {
          if (action.type === 'MARK_ATTENDANCE') {
            const { sessionDate, groupId, records } = action.payload;
            const res = await saveAttendanceAction({ sessionDate, groupId, records });
            if (res.success) {
              await clearSyncAction(action.id!);
              successCount++;
            }
          }
          // Add other action types here later (e.g. CREATE_LESSON_PLAN)
        } catch (err) {
          console.error(`Failed to sync action ${action.id}:`, err);
        }
      }

      if (successCount > 0) {
        toast(`Đã đồng bộ thành công ${successCount} tác vụ!`, 'success');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  return { flushQueue, isSyncing };
}

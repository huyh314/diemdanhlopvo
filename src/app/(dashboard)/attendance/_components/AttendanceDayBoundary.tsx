'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ATTENDANCE_DAY_CHECK_EVENT, getVietnamDate, millisecondsUntilVietnamMidnight } from '@/lib/attendance-date';

export default function AttendanceDayBoundary({ renderedDate, isHistory, children }: {
    renderedDate: string;
    isHistory: boolean;
    children: ReactNode;
}) {
    const router = useRouter();
    const [liveDate, setLiveDate] = useState(renderedDate);

    useEffect(() => {
        if (isHistory) return;
        let lastRefresh = -Infinity;
        let midnightTimer: ReturnType<typeof setTimeout>;

        const checkDay = () => {
            const today = getVietnamDate();
            setLiveDate(today);
            if (today !== renderedDate && navigator.onLine && Date.now() - lastRefresh >= 5000) {
                lastRefresh = Date.now();
                router.refresh();
            }
        };
        const scheduleMidnight = () => {
            midnightTimer = setTimeout(() => {
                checkDay();
                scheduleMidnight();
            }, millisecondsUntilVietnamMidnight());
        };
        const checkVisible = () => {
            if (document.visibilityState === 'visible') checkDay();
        };

        checkDay();
        scheduleMidnight();
        // Also catch suspended mobile apps, restored browser pages and changed device clocks.
        const interval = setInterval(checkDay, 30_000);
        window.addEventListener('focus', checkVisible);
        window.addEventListener('pageshow', checkDay);
        window.addEventListener('online', checkDay);
        window.addEventListener(ATTENDANCE_DAY_CHECK_EVENT, checkDay);
        document.addEventListener('visibilitychange', checkVisible);
        return () => {
            clearTimeout(midnightTimer);
            clearInterval(interval);
            window.removeEventListener('focus', checkVisible);
            window.removeEventListener('pageshow', checkDay);
            window.removeEventListener('online', checkDay);
            window.removeEventListener(ATTENDANCE_DAY_CHECK_EVENT, checkDay);
            document.removeEventListener('visibilitychange', checkVisible);
        };
    }, [renderedDate, isHistory, router]);

    if (!isHistory && liveDate !== renderedDate) {
        return (
            <div className="space-y-3 rounded-xl border border-[var(--border-primary)] p-6">
                <p role="status">Đã sang ngày mới. Đang mở danh sách điểm danh hôm nay…</p>
                <p className="text-sm text-[var(--text-secondary)]">Lịch sử và bản nháp ngày trước vẫn được giữ lại. Nếu chưa có mạng, hãy kết nối rồi thử lại.</p>
                <button type="button" onClick={() => router.refresh()} className="min-h-11 rounded-lg bg-[var(--bg-secondary)] px-4 font-medium">Thử lại</button>
            </div>
        );
    }
    return children;
}

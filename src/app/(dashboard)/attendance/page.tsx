// =============================================
// ATTENDANCE PAGE — Server Component with Client Grid
// =============================================

import { Suspense } from 'react';
import Link from 'next/link';
import GroupSummaryContent from './_components/GroupSummaryContent';
import { GROUP_IDS, getGroupName } from '@/lib/constants';
import AttendanceContent from './_components/AttendanceContent';
import { GroupSummarySkeleton, AttendanceGridSkeleton } from './_components/Skeletons';
import ExportButton from './_components/ExportButton';
import DateSelector from './_components/DateSelector';

export const metadata = {
    title: 'Điểm Danh — Võ Đường Manager',
    description: 'Quản lý điểm danh buổi tập võ thuật',
};

export default async function AttendancePage({
    searchParams,
}: {
    searchParams: Promise<{ group?: string; date?: string }>;
}) {
    const params = await searchParams;
    const groupId = (params.group as any) || GROUP_IDS[0];

    const today = new Date().toLocaleDateString('en-CA', {
        timeZone: 'Asia/Ho_Chi_Minh',
    });
    
    // Use date from searchParams if provided, otherwise default to today
    const selectedDate = params.date || today;

    // Display formatted
    const dateObj = new Date(selectedDate);
    // If invalid date, fallback to today
    if (isNaN(dateObj.getTime())) {
        dateObj.setTime(new Date().getTime());
    }
    const todayDisplay = dateObj.toLocaleDateString('vi-VN', {
        weekday: 'long',
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold">📋 Điểm Danh</h2>
                    <p className="text-sm text-[var(--text-muted)] mt-1">{todayDisplay}</p>
                </div>
                <div className="flex items-center gap-3">
                    <DateSelector defaultDate={today} />
                    <ExportButton />
                </div>
            </div>

            {/* Group Summary with Suspense */}
            <Suspense fallback={<GroupSummarySkeleton />}>
                <GroupSummaryContent />
            </Suspense>

            {/* Group Tabs */}
            <div className="flex gap-2">
                {GROUP_IDS.map((g) => (
                    <Link
                        key={g}
                            href={`/attendance?group=${g}&date=${selectedDate}`}
                            prefetch={true}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${g === groupId
                            ? 'bg-[var(--accent-from)]/20 text-blue-300 border border-[var(--accent-from)]/40 shadow-[var(--glass-shadow)]'
                            : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] border border-transparent hover:bg-white/5'
                            }`}
                    >
                        {getGroupName(g)}
                    </Link>
                ))}
            </div>

            {/* Interactive Attendance Grid with Suspense */}
            <Suspense fallback={<AttendanceGridSkeleton />}>
                <AttendanceContent groupId={groupId} selectedDate={selectedDate} />
            </Suspense>
        </div>
    );
}

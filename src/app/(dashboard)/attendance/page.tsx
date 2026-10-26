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
import DownloadStudentListButton from './_components/DownloadStudentListButton';
import DateSelector from './_components/DateSelector';
import AttendanceDayBoundary from './_components/AttendanceDayBoundary';
import { getVietnamDate, resolveAttendanceDate } from '@/lib/attendance-date';

export const metadata = {
    title: 'Điểm Danh — Võ Đường Manager',
    description: 'Quản lý điểm danh buổi tập võ thuật',
};

export default async function AttendancePage({
    searchParams,
}: {
    searchParams: Promise<{ group?: string; date?: string; mode?: string }>;
}) {
    const params = await searchParams;
    const groupId = GROUP_IDS.find(group => group === params.group) ?? GROUP_IDS[0];

    const today = getVietnamDate();
    const { selectedDate, isHistory } = resolveAttendanceDate(params, today);

    // Display formatted
    const dateObj = new Date(`${selectedDate}T00:00:00+07:00`);
    const todayDisplay = dateObj.toLocaleDateString('vi-VN', {
        weekday: 'long',
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
        timeZone: 'Asia/Ho_Chi_Minh',
    });

    return (
        <AttendanceDayBoundary key={`${groupId}-${selectedDate}-${isHistory}`} renderedDate={selectedDate} isHistory={isHistory}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold">📋 Điểm Danh</h2>
                        <p className="text-sm text-[var(--text-muted)] mt-1">{todayDisplay}</p>
                    </div>
                    <div className="flex flex-wrap items-start gap-3">
                        <DateSelector selectedDate={selectedDate} isHistory={isHistory} />
                        <DownloadStudentListButton />
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
                            href={isHistory ? `/attendance?group=${g}&mode=history&date=${selectedDate}` : `/attendance?group=${g}`}
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
                    <AttendanceContent groupId={groupId} selectedDate={selectedDate} isHistory={isHistory} />
                </Suspense>
            </div>
        </AttendanceDayBoundary>
    );
}

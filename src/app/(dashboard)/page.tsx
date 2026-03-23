// =============================================
// DASHBOARD HOME — Executive Overview
// =============================================

import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';
import {
    DashboardKPIs,
    DashboardKPIsSkeleton,
    DashboardRankings,
    DashboardRankingsSkeleton,
    DashboardGroupSummary,
    DashboardGroupSummarySkeleton
} from './_components/DashboardComponents';

export default function DashboardPage() {
    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                        🏠 Tổng Quan Hệ Thống
                    </h2>
                    <p className="text-[var(--text-muted)] mt-1 font-medium italic">
                        Chào mừng trở lại! Dưới đây là tóm tắt tình hình tập luyện.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link href="/attendance">
                        <Button variant="primary" size="sm">📋 Điểm Danh</Button>
                    </Link>
                    <Link href="/rankings">
                        <Button variant="ghost" size="sm">🏆 Xếp Hạng</Button>
                    </Link>
                </div>
            </div>

            {/* Top KPIs */}
            <Suspense fallback={<DashboardKPIsSkeleton />}>
                <DashboardKPIs />
            </Suspense>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Rankings Preview */}
                <Suspense fallback={<DashboardRankingsSkeleton />}>
                    <DashboardRankings />
                </Suspense>

                {/* Group Attendance */}
                <Suspense fallback={<DashboardGroupSummarySkeleton />}>
                    <DashboardGroupSummary />
                </Suspense>
            </div>
        </div>
    );
}

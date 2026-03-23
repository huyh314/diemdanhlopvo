// =============================================
// RANKINGS PAGE — Server Component
// =============================================

import { Suspense } from 'react';
import RankingsContent from './_components/RankingsContent';
import { RankingsSkeleton } from './_components/Skeletons';

export const metadata = {
    title: 'Xếp Hạng Thi Đua — Võ Đường Manager',
    description: 'Bảng xếp hạng điểm thi đua học sinh',
};

export default async function RankingsPage({
    searchParams,
}: {
    searchParams: Promise<{ week?: string; mode?: string; weeks?: string }>;
}) {
    const params = await searchParams;
    const week = params.week;
    const mode = params.mode === 'average' ? 'average' : 'weekly';
    const weeks = params.weeks ? parseInt(params.weeks, 10) : 4;

    return (
        <div className="space-y-6">
            <Suspense fallback={<RankingsSkeleton />}>
                <RankingsContent week={week} mode={mode} weeks={weeks} />
            </Suspense>
        </div>
    );
}

import { getStudents, getScoresByWeek } from '@/lib/dal';
import BatchGradingClient from './BatchGradingClient';
import Link from 'next/link';

export const metadata = {
    title: 'Chấm Điểm Hàng Loạt — Võ Đường Manager',
    description: 'Trang hỗ trợ tính năng ưu việt chấm điểm 1 lần cho toàn bộ học sinh',
};

function getCurrentWeekKey() {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
}

export default async function BatchGradePage({
    searchParams,
}: {
    searchParams: Promise<{ week?: string }>;
}) {
    const params = await searchParams;
    const weekKey = params.week || getCurrentWeekKey();

    const [students, existingScores] = await Promise.all([
        getStudents(),
        getScoresByWeek(weekKey)
    ]);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 border-b border-white/10 pb-4 mb-4">
                <Link href="/rankings" className="text-gray-400 hover:text-white transition group flex items-center justify-center border border-white/10 w-10 h-10 rounded-xl bg-white/5">
                    ←
                </Link>
                <div>
                    <h2 className="text-xl font-bold text-[var(--gold)] font-orbitron">Chấm điểm phân loại hàng loạt</h2>
                    <p className="text-xs text-gray-400">Tuần: {weekKey}</p>
                </div>
            </div>

            <BatchGradingClient
                students={students}
                existingScores={existingScores}
                weekKey={weekKey}
            />
        </div>
    );
}

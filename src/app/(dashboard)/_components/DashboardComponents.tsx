import Link from 'next/link';
import { getGroupSummary, getStudentRankings } from '@/lib/dal';
import { MetricCard, Card } from '@/components/ui';
import { getGroupName } from '@/lib/constants';

// ==========================================
// 1. KPI SUMMARY
// ==========================================

export async function DashboardKPIs() {
    const [groupSummary, rankings] = await Promise.all([
        getGroupSummary().catch(() => []),
        getStudentRankings().catch(() => []),
    ]);

    const totalStudents = groupSummary.reduce((sum, g) => sum + g.total_students, 0);
    const totalPresent = groupSummary.reduce((sum, g) => sum + g.present_count, 0);
    const overallRate = totalStudents > 0 ? Math.round((totalPresent / totalStudents) * 100) : 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
                title="Tổng Số Học Sinh"
                value={totalStudents}
                status="neutral"
                icon={<span className="text-xl">👥</span>}
            />
            <MetricCard
                title="Điểm Danh Hôm Nay"
                value={totalPresent}
                status="success"
                icon={<span className="text-xl">✅</span>}
                trend={{ value: overallRate, label: 'Tỉ lệ chuyên cần' }}
            />
            <MetricCard
                title="Học Sinh Xuất Sắc"
                value={rankings[0]?.student_name || 'N/A'}
                status="warning"
                icon={<span className="text-xl">👑</span>}
                trend={{ value: rankings[0]?.total || 0, label: 'Điểm cao nhất tuần' }}
            />
        </div>
    );
}

export function DashboardKPIsSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
                <Card key={i} variant="glass" className="h-32 flex flex-col justify-between">
                    <div className="flex justify-between items-center">
                        <div className="h-4 w-32 bg-white/10 rounded animate-pulse" />
                        <div className="h-8 w-8 bg-white/10 rounded-full animate-pulse" />
                    </div>
                    <div className="space-y-3">
                        <div className="h-8 w-16 bg-white/20 rounded animate-pulse" />
                        <div className="h-3 w-24 bg-white/5 rounded animate-pulse" />
                    </div>
                </Card>
            ))}
        </div>
    );
}

// ==========================================
// 2. RANKINGS PREVIEW
// ==========================================

export async function DashboardRankings() {
    const rankings = await getStudentRankings().catch(() => []);

    return (
        <Card variant="glass" className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                    <span>🏆</span> Top 3 Tuần Này
                </h3>
                <Link href="/rankings" className="text-sm text-[var(--accent-from)] hover:underline font-semibold">
                    Xem tất cả →
                </Link>
            </div>
            <div className="space-y-4">
                {rankings.slice(0, 3).map((r, i) => (
                    <div key={r.student_id} className="group flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 transition-all hover:bg-white/10 hover:scale-[1.01] hover:border-white/10">
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 flex items-center justify-center rounded-xl font-bold text-lg shadow-inner ${i === 0 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                                i === 1 ? 'bg-slate-300/20 text-slate-300 border border-slate-300/30' :
                                    'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                                }`}>
                                {i + 1}
                            </div>
                            <div>
                                <div className="font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-from)] transition-colors">{r.student_name}</div>
                                <div className="text-xs text-[var(--text-muted)] font-mono uppercase tracking-tighter">
                                    {getGroupName(r.group_id)}
                                </div>
                            </div>
                        </div>
                        <div className="text-xl font-black bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">{r.total}đ</div>
                    </div>
                ))}
                {rankings.length === 0 && (
                    <div className="text-center py-8 text-[var(--text-muted)] italic bg-white/5 rounded-2xl border border-dashed border-white/10">
                        Chưa có dữ liệu xếp hạng tuần này.
                    </div>
                )}
            </div>
        </Card>
    );
}

export function DashboardRankingsSkeleton() {
    return (
        <Card variant="glass" className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="h-6 w-40 bg-white/10 rounded animate-pulse" />
                <div className="h-4 w-20 bg-white/5 rounded animate-pulse" />
            </div>
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 h-20">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white/10 rounded-xl animate-pulse" />
                            <div className="space-y-2">
                                <div className="h-4 w-32 bg-white/20 rounded animate-pulse" />
                                <div className="h-3 w-16 bg-white/5 rounded animate-pulse" />
                            </div>
                        </div>
                        <div className="h-6 w-12 bg-white/10 rounded animate-pulse" />
                    </div>
                ))}
            </div>
        </Card>
    );
}

// ==========================================
// 3. GROUP ATTENDANCE
// ==========================================

export async function DashboardGroupSummary() {
    const groupSummary = await getGroupSummary().catch(() => []);

    return (
        <Card variant="glass" className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                    <span>📊</span> Tỉ Lệ Chuyên Cần Theo Nhóm
                </h3>
                <Link href="/attendance" className="text-sm text-[var(--accent-from)] hover:underline font-semibold">
                    Chi tiết →
                </Link>
            </div>
            <div className="space-y-6">
                {groupSummary.map((g) => (
                    <div key={g.group_id} className="space-y-2 relative group">
                        <div className="flex justify-between text-sm items-end">
                            <span className="font-bold text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
                                {getGroupName(g.group_id)}
                            </span>
                            <span className="text-xs font-mono bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                                <span className="text-[var(--text-primary)] font-bold">{g.present_count}</span>
                                <span className="text-[var(--text-muted)]">/{g.total_students} học sinh</span>
                            </span>
                        </div>
                        <div className="relative h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
                            <div
                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)] rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(var(--accent-rgb-from),0.5)]"
                                style={{ width: `${g.rate}%` }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                        </div>
                        <div className="flex justify-end pt-0.5">
                            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--accent-from)] opacity-80">{g.rate}% Hoàn thành</span>
                        </div>
                    </div>
                ))}
                {groupSummary.length === 0 && (
                    <div className="text-center py-8 text-[var(--text-muted)] italic bg-white/5 rounded-2xl border border-dashed border-white/10">
                        Chưa có dữ liệu điểm danh hôm nay.
                    </div>
                )}
            </div>
        </Card>
    );
}

export function DashboardGroupSummarySkeleton() {
    return (
        <Card variant="glass" className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="h-6 w-48 bg-white/10 rounded animate-pulse" />
                <div className="h-4 w-20 bg-white/5 rounded animate-pulse" />
            </div>
            <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-2">
                        <div className="flex justify-between items-end">
                            <div className="h-4 w-20 bg-white/20 rounded animate-pulse" />
                            <div className="h-5 w-24 bg-white/10 rounded-md animate-pulse" />
                        </div>
                        <div className="h-3 w-full bg-white/5 rounded-full animate-pulse" />
                        <div className="flex justify-end">
                            <div className="h-3 w-16 bg-white/10 rounded animate-pulse" />
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
}

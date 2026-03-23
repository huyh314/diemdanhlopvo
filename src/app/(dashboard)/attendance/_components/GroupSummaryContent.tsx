import { getGroupSummary } from '@/lib/dal';
import { MetricCard } from '@/components/ui';
import { getGroupName } from '@/lib/constants';

export default async function GroupSummaryContent() {
    const groupSummary = await getGroupSummary();

    if (!groupSummary || groupSummary.length === 0) {
        return <div className="text-sm text-[var(--text-muted)] p-4 bg-[var(--bg-secondary)] rounded-xl">Chưa có dữ liệu thống kê hôm nay.</div>;
    }

    const totalStudents = groupSummary.reduce((sum, g) => sum + g.total_students, 0);
    const totalPresent = groupSummary.reduce((sum, g) => sum + g.present_count, 0);
    const totalExcused = groupSummary.reduce((sum, g) => sum + g.excused_count, 0);
    const totalAbsent = totalStudents - totalPresent - totalExcused;
    const overallRate = totalStudents > 0 ? Math.round((totalPresent / totalStudents) * 100) : 0;

    return (
        <div className="space-y-6">
            {/* Executive KPI Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard
                    title="Tỉ lệ Chuyên Cần"
                    value={`${overallRate}%`}
                    status={overallRate >= 80 ? 'success' : overallRate >= 50 ? 'warning' : 'danger'}
                    trend={{ value: overallRate - 80, label: 'so với mục tiêu 80%' }}
                    icon={<span className="text-xl">📈</span>}
                />
                <MetricCard
                    title="Có Mặt Hôm Nay"
                    value={totalPresent}
                    status="success"
                    icon={<span className="text-xl">✅</span>}
                    trend={{ value: 0, label: `${totalAbsent} vắng • ${totalExcused} phép`, direction: 'neutral' }}
                />
                <MetricCard
                    title="Tổng Học Sinh"
                    value={totalStudents}
                    status="neutral"
                    icon={<span className="text-xl">👥</span>}
                />
                <MetricCard
                    title="Phân Bổ Nhóm"
                    value={groupSummary.length}
                    status="neutral"
                    icon={<span className="text-xl">🏷️</span>}
                    trend={{ value: 0, label: 'Đang hoạt động', direction: 'neutral' }}
                />
            </div>

            {/* Department Views / Group Breakdown */}
            <div>
                <h3 className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">Tỉ Lệ Chuyên Cần Theo Nhóm</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {groupSummary.map((g) => (
                        <div
                            key={g.group_id}
                            className="rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] shadow-[var(--glass-shadow)] p-4 backdrop-blur-[var(--glass-blur)] transition-all duration-[var(--transition-normal)] hover:-translate-y-1 hover:shadow-xl"
                        >
                            <div className="flex items-center justify-between mb-2">
                                {getGroupName(g.group_id)}
                                <span className="text-xs font-mono text-[var(--text-muted)]">
                                    {g.present_count}/{g.total_students}
                                </span>
                            </div>
                            <div className="text-2xl font-bold bg-gradient-to-br from-[var(--accent-from)] to-[var(--accent-to)] bg-clip-text text-transparent">
                                {g.rate}%
                            </div>
                            <div className="mt-2 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)] transition-all duration-1000 ease-out flex items-center justify-end pr-1 box-border"
                                    style={{ width: `${g.rate}%` }}
                                >
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

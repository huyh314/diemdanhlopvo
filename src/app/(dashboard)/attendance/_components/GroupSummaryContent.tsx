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

        </div>
    );
}

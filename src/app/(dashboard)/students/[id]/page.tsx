// =============================================
// STUDENT DETAIL PAGE — Server Component
// =============================================

import { notFound } from 'next/navigation';
import { getStudent, getAttendanceStats, getScores } from '@/lib/dal';
import { getGroupName } from '@/lib/constants';
import StudentProfile from './_components/StudentProfile';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    try {
        const student = await getStudent(id);
        return { title: `${student.name} — Võ Đường Manager` };
    } catch {
        return { title: 'Học sinh — Võ Đường Manager' };
    }
}

export default async function StudentDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    let student;
    try {
        student = await getStudent(id);
    } catch {
        notFound();
    }

    if (!student) return null;

    const [stats, scores] = await Promise.all([
        getAttendanceStats({ studentId: id }),
        getScores(id),
    ]);

    const studentStats = stats[0];

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Back link */}
            <a
                href="/students"
                className="text-sm text-gray-400 hover:text-white transition"
            >
                ← Danh sách học sinh
            </a>

            {/* Profile Header */}
            <StudentProfile student={student} />

            {/* Attendance Stats */}
            {studentStats && (
                <div className="rounded-xl bg-white/5 border border-white/10 p-5 backdrop-blur-sm">
                    <h3 className="text-sm font-bold text-gray-300 mb-4">📊 Thống Kê Chuyên Cần</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard label="Tổng buổi" value={studentStats.total_sessions} />
                        <StatCard label="Có mặt" value={studentStats.present_count} color="text-emerald-400" />
                        <StatCard label="Vắng" value={studentStats.absent_count} color="text-red-400" />
                        <StatCard label="Tỉ lệ" value={`${studentStats.attendance_rate}%`} color="text-sky-400" />
                    </div>
                </div>
            )}

            {/* Scores History */}
            <div className="rounded-xl bg-white/5 border border-white/10 p-5 backdrop-blur-sm">
                <h3 className="text-sm font-bold text-gray-300 mb-4">🏆 Lịch Sử Điểm Thi Đua</h3>
                {scores && scores.length > 0 ? (
                    <div className="space-y-3">
                        {scores.map((sc: { id: string; week_key: string; total: number; notes: string }) => (
                            <div
                                key={sc.id}
                                className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5"
                            >
                                <div>
                                    <span className="text-sm font-mono text-gray-400">{sc.week_key}</span>
                                    {sc.notes && <p className="text-xs text-gray-500 mt-0.5">{sc.notes}</p>}
                                </div>
                                <span className="text-lg font-bold text-yellow-400">{sc.total}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 text-sm">Chưa có dữ liệu điểm</p>
                )}
            </div>
        </div>
    );
}

function StatCard({
    label,
    value,
    color = 'text-white',
}: {
    label: string;
    value: number | string;
    color?: string;
}) {
    return (
        <div className="text-center">
            <div className={`text-xl font-bold ${color}`}>{value}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">{label}</div>
        </div>
    );
}

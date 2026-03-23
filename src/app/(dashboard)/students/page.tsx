// =============================================
// STUDENTS LIST PAGE — Server Component
// =============================================

import { getStudents } from '@/lib/dal';
import { GROUPS } from '@/lib/constants';

export const metadata = {
    title: 'Danh Sách Học Sinh — Võ Đường Manager',
    description: 'Quản lý thông tin học sinh võ đường',
};

export default async function StudentsPage() {
    const students = await getStudents();

    const groupedStudents = GROUPS.map(g => ({
        id: g.id,
        name: g.name,
        students: students.filter(s => s.group_id === g.id)
    })).filter(g => g.students.length > 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">👥 Danh Sách Học Sinh</h2>
                <span className="text-sm text-gray-400">
                    Tổng: {students.length} học sinh
                </span>
            </div>

            {groupedStudents.map((group) => {
                return (
                    <div key={group.id}>
                        <h3 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">
                            {group.name} ({group.students.length})
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {group.students.map((s) => (
                                <a
                                    key={s.id}
                                    href={`/students/${s.id}`}
                                    className="flex items-center gap-4 rounded-xl bg-white/5 border border-white/10 p-4 hover:bg-white/10 hover:border-blue-500/30 transition"
                                >
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-base font-bold text-white shrink-0">
                                        {s.avatar_url ? (
                                            <img
                                                src={s.avatar_url}
                                                alt={s.name}
                                                className="w-full h-full object-cover rounded-full"
                                            />
                                        ) : (
                                            s.name
                                                .split(' ')
                                                .map((w) => w[0])
                                                .slice(-2)
                                                .join('')
                                                .toUpperCase()
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold truncate">{s.name}</h4>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            {s.birth_year && <span>({s.birth_year})</span>}
                                            {s.phone && <span>📱 {s.phone}</span>}
                                        </div>
                                    </div>
                                    <span className="text-gray-600">→</span>
                                </a>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

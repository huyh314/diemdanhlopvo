// =============================================
// STUDENTS LIST PAGE — Server Component
// =============================================

import { getStudents } from '@/lib/dal';
import { GROUPS } from '@/lib/constants';
import StudentsList from './StudentsList';

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

    return <StudentsList groups={groupedStudents} total={students.length} />;
}

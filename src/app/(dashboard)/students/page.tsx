// =============================================
// STUDENTS LIST PAGE — Server Component
// =============================================

import StudentsLoader from './StudentsLoader';

export const metadata = {
    title: 'Danh Sách Học Sinh — Võ Đường Manager',
    description: 'Quản lý thông tin học sinh võ đường',
};

export default function StudentsPage() {
    return <StudentsLoader />;
}

import { getStudents, getTodayAttendance } from '@/lib/dal';
import type { AttendanceStatus, GroupId } from '@/types/database.types';
import AttendanceGrid from '@/components/AttendanceGrid';

export default async function AttendanceContent({
    groupId,
    today,
}: {
    groupId: GroupId;
    today: string;
}) {
    // Lấy danh sách học sinh và trạng thái điểm danh hôm nay song song
    const [students, todayMap] = await Promise.all([
        getStudents(groupId),
        getTodayAttendance(today, groupId),
    ]);

    // Chuyển map thành kiểu AttendanceStatus
    const initialStatuses: Record<string, AttendanceStatus> = {};
    students.forEach((s) => {
        const saved = todayMap[s.id];
        initialStatuses[s.id] = (saved as AttendanceStatus) || 'absent';
    });

    return (
        <AttendanceGrid
            initialStudents={students}
            initialStatuses={initialStatuses}
            groupId={groupId}
            sessionDate={today}
        />
    );
}

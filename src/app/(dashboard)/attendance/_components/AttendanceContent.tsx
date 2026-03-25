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

    // Tìm các bản ghi thực sự tồn tại trong DB cho ngày hôm nay
    const initialStatuses: Record<string, AttendanceStatus> = {};
    Object.entries(todayMap).forEach(([id, status]) => {
        initialStatuses[id] = status as AttendanceStatus;
    });

    return (
        <AttendanceGrid
            key={`${groupId}-${today}`}
            initialStudents={students}
            initialStatuses={initialStatuses}
            groupId={groupId}
            sessionDate={today}
        />
    );
}

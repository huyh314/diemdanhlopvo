import { getStudents, getTodayAttendance } from '@/lib/dal';
import type { AttendanceStatus, GroupId } from '@/types/database.types';
import AttendanceGrid from '@/components/AttendanceGrid';

export default async function AttendanceContent({
    groupId,
    selectedDate,
}: {
    groupId: GroupId;
    selectedDate: string;
}) {
    // Lấy danh sách học sinh và trạng thái điểm danh ngày đã chọn song song
    const [students, todayMap] = await Promise.all([
        getStudents(groupId),
        getTodayAttendance(selectedDate, groupId),
    ]);

    // Tìm các bản ghi thực sự tồn tại trong DB cho ngày đã chọn
    const initialStatuses: Record<string, AttendanceStatus> = {};
    Object.entries(todayMap).forEach(([id, status]) => {
        initialStatuses[id] = status as AttendanceStatus;
    });

    return (
        <AttendanceGrid
            key={`${groupId}-${selectedDate}`}
            initialStudents={students}
            initialStatuses={initialStatuses}
            groupId={groupId}
            sessionDate={selectedDate}
        />
    );
}

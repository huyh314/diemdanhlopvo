import { getStudents } from '@/lib/dal';
import type { GroupId } from '@/types/database.types';
import AttendanceGrid from '@/components/AttendanceGrid';

export default async function AttendanceContent({
    groupId,
    today,
}: {
    groupId: GroupId;
    today: string;
}) {
    const students = await getStudents(groupId);

    return (
        <AttendanceGrid
            initialStudents={students}
            groupId={groupId}
            sessionDate={today}
        />
    );
}

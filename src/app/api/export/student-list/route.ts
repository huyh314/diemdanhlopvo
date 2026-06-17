import { NextResponse } from 'next/server';
import { getStudents } from '@/lib/dal';
import * as XLSX from 'xlsx';
import { getGroupName } from '@/lib/constants';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const monthParam = searchParams.get('month');
        const yearParam = searchParams.get('year');

        const now = new Date();
        const month = monthParam ? parseInt(monthParam) : now.getMonth() + 1;
        const year = yearParam ? parseInt(yearParam) : now.getFullYear();

        const students = await getStudents();

        if (!students || students.length === 0) {
            return NextResponse.json({ error: 'Không có học sinh nào.' }, { status: 404 });
        }

        // Group students by group
        const grouped = new Map<string, typeof students>();
        for (const s of students) {
            const g = s.group_id;
            if (!grouped.has(g)) grouped.set(g, []);
            grouped.get(g)!.push(s);
        }

        const workbook = XLSX.utils.book_new();

        // Days in month
        const daysInMonth = new Date(year, month, 0).getDate();

        for (const [groupId, groupStudents] of grouped) {
            const groupName = getGroupName(groupId);
            const headerRow: Record<string, string> = { 'STT': 'STT', 'Họ Tên': 'Họ Tên' };
            for (let d = 1; d <= daysInMonth; d++) {
                const dateStr = `${String(d).padStart(2, '0')}/${String(month).padStart(2, '0')}`;
                headerRow[dateStr] = dateStr;
            }
            headerRow['Ghi Chú'] = 'Ghi Chú';

            const data = groupStudents.map((s, i) => {
                const row: Record<string, string | number> = { 'STT': i + 1, 'Họ Tên': s.name };
                for (let d = 1; d <= daysInMonth; d++) {
                    const dateStr = `${String(d).padStart(2, '0')}/${String(month).padStart(2, '0')}`;
                    row[dateStr] = '';
                }
                row['Ghi Chú'] = '';
                return row;
            });

            const worksheet = XLSX.utils.json_to_sheet(data);

            // Column widths
            const wscols: { wch: number }[] = [
                { wch: 6 },
                { wch: 25 },
                ...Array(daysInMonth).fill({ wch: 6 }),
                { wch: 20 },
            ];
            worksheet['!cols'] = wscols;

            // Freeze top row + first 2 columns
            worksheet['!freeze'] = { xSplit: 2, ySplit: 1 };

            XLSX.utils.book_append_sheet(workbook, worksheet, groupName);
        }

        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        const filename = `BangDiemDanh_T${month}_${year}.xlsx`;

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            }
        });

    } catch (error: any) {
        console.error('Student List Export Error:', error);
        return NextResponse.json({ error: 'Lỗi xuất file: ' + error.message }, { status: 500 });
    }
}

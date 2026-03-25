import { NextResponse } from 'next/server';
import { getMonthlyExportData } from '@/lib/dal';
import * as XLSX from 'xlsx';
import { getGroupShortName } from '@/lib/constants';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const monthParam = searchParams.get('month');
        const yearParam = searchParams.get('year');
        const isJsonMode = request.headers.get('Accept') === 'application/json';

        const now = new Date();
        const month = monthParam ? parseInt(monthParam) : now.getMonth() + 1;
        const year = yearParam ? parseInt(yearParam) : now.getFullYear();

        const rawData = await getMonthlyExportData(year, month);

        if (!rawData || rawData.length === 0) {
            return NextResponse.json({ error: 'Không có dữ liệu điểm danh trong tháng này.' }, { status: 404 });
        }

        // Process data into a Pivot structure
        // Row: Student Name + Group
        // Column: Dates
        // Value: Status (V, CM, P)

        const studentMap = new Map<string, any>();
        const dateSet = new Set<string>();

        rawData.forEach((record: any) => {
            const studentName = record.students.name;
            const groupId = record.students.group_id;
            const date = record.sessions.session_date;
            const status = record.status === 'present' ? 'CM' : record.status === 'excused' ? 'P' : 'V';

            const key = `${studentName}_${groupId}`;

            if (!studentMap.has(key)) {
                studentMap.set(key, {
                    'Họ Tên': studentName,
                    'Nhóm': getGroupShortName(groupId),
                    'Tổng CM': 0,
                    'Tổng Vắng': 0,
                    'Tổng Phép': 0
                });
            }

            const row = studentMap.get(key);
            row[date] = status;

            if (status === 'CM') row['Tổng CM']++;
            if (status === 'V') row['Tổng Vắng']++;
            if (status === 'P') row['Tổng Phép']++;

            dateSet.add(date);
        });

        const sortedDates = Array.from(dateSet).sort();
        const rows = Array.from(studentMap.values()).sort((a, b) => a['Họ Tên'].localeCompare(b['Họ Tên']));

        // Order the object keys: Họ Tên, Nhóm, [Dates...], Tổng CM, Tổng Phép, Tổng Vắng
        const finalData = rows.map(row => {
            const ordered: any = {
                'Họ Tên': row['Họ Tên'],
                'Nhóm': row['Nhóm']
            };
            sortedDates.forEach(d => {
                ordered[d] = row[d] || '';
            });
            ordered['Tổng CM'] = row['Tổng CM'];
            ordered['Tổng Phép'] = row['Tổng Phép'];
            ordered['Tổng Vắng'] = row['Tổng Vắng'];
            return ordered;
        });

        // JSON mode: return preview data without generating file
        if (isJsonMode) {
            return NextResponse.json({ rows: finalData, dates: sortedDates, month, year });
        }

        // Create Excel Workbook
        const worksheet = XLSX.utils.json_to_sheet(finalData);

        // Auto-size columns loosely
        const wscols = [
            { wch: 25 }, // Name
            { wch: 8 },  // Group
            ...sortedDates.map(() => ({ wch: 12 })), // Dates
            { wch: 10 }, { wch: 10 }, { wch: 10 } // Totals
        ];
        worksheet['!cols'] = wscols;

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, `T${month}-${year}`);

        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        const filename = `DiemDanh_T${month}_${year}.xlsx`;

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            }
        });

    } catch (error: any) {
        console.error('Excel Export Error:', error);
        return NextResponse.json({ error: 'Lỗi xuất file: ' + error.message }, { status: 500 });
    }
}

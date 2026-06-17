import { NextResponse } from 'next/server';
import { getStudents } from '@/lib/dal';
import * as XLSX from 'xlsx';
import { getGroupName } from '@/lib/constants';

export async function GET() {
    try {
        const students = await getStudents();

        if (!students || students.length === 0) {
            return NextResponse.json({ error: 'Không có học sinh nào.' }, { status: 404 });
        }

        const data = students.map((s, i) => ({
            'STT': i + 1,
            'Họ Tên': s.name,
            'Nhóm': getGroupName(s.group_id),
            'Ghi Chú': '',
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const wscols = [
            { wch: 6 },
            { wch: 25 },
            { wch: 10 },
            { wch: 20 },
        ];
        worksheet['!cols'] = wscols;

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'DanhSach');

        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        const filename = `DanhSachHocSinh_${new Date().toISOString().slice(0, 10)}.xlsx`;

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

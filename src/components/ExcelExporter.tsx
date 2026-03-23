'use client';

import { useState } from 'react';
import { useToast } from './Toast';
import { getGroupName, getGroupShortName } from '@/lib/constants';

// =============================================
// EXCEL EXPORTER — Client-side SheetJS
// =============================================

interface ExcelExporterProps {
    students: { id: string; name: string; groupId: string; total?: number; attendanceRate?: number }[];
    groupSummary?: { groupId: string; totalStudents: number; presentCount: number; rate: number }[];
}

export default function ExcelExporter({ students, groupSummary }: ExcelExporterProps) {
    const [isExporting, setIsExporting] = useState(false);
    const { toast } = useToast();

    async function exportExcel() {
        setIsExporting(true);
        try {
            // Dynamic import SheetJS
            const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.mjs' as string);

            const wb = XLSX.utils.book_new();

            // Sheet 1: Student List
            const studentData = students.map((s, i) => ({
                'STT': i + 1,
                'Ho Ten': s.name,
                'Nhom': getGroupName(s.groupId),
                'Diem': s.total || 0,
                'Ti Le (%)': s.attendanceRate || 0,
            }));
            const ws1 = XLSX.utils.json_to_sheet(studentData);
            XLSX.utils.book_append_sheet(wb, ws1, 'DANH_SACH');

            // Sheet 2: Group Stats
            if (groupSummary) {
                const groupData = groupSummary.map((g) => ({
                    'Nhom': getGroupName(g.groupId),
                    'Tong So': g.totalStudents,
                    'Co Mat': g.presentCount,
                    'Ti Le (%)': g.rate,
                }));
                const ws2 = XLSX.utils.json_to_sheet(groupData);
                XLSX.utils.book_append_sheet(wb, ws2, 'THONG_KE');
            }

            // Sheet 3: Ranking
            const rankData = [...students]
                .sort((a, b) => (b.total || 0) - (a.total || 0))
                .map((s, i) => ({
                    'Hang': i + 1,
                    'Ho Ten': s.name,
                    'Nhom': getGroupShortName(s.groupId),
                    'Diem': s.total || 0,
                    'Huy Chuong': i === 0 ? 'Vang' : i === 1 ? 'Bac' : i === 2 ? 'Dong' : '',
                }));
            const ws3 = XLSX.utils.json_to_sheet(rankData);
            XLSX.utils.book_append_sheet(wb, ws3, 'XEP_HANG');

            // Save
            const now = new Date();
            const filename = `VoDuong_BaoCao_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}.xlsx`;
            XLSX.writeFile(wb, filename);
            toast(`Đã xuất: ${filename}`, 'success');
        } catch (err) {
            toast('Lỗi xuất Excel: ' + (err as Error).message, 'error');
        } finally {
            setIsExporting(false);
        }
    }

    return (
        <button
            onClick={exportExcel}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 transition text-sm font-medium disabled:opacity-50"
        >
            {isExporting ? '⏳' : '📊'} Xuất Excel
        </button>
    );
}

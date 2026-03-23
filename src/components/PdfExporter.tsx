'use client';

import { useState } from 'react';
import { useToast } from './Toast';
import { StudentReportData } from './pdf/SemesterReportTemplate';

interface PdfExporterProps {
    rankings: StudentReportData[];
    weekKey?: string;
}

const BACKEND_URL = 'http://127.0.0.1:8000';

export default function PdfExporter({ rankings, weekKey }: PdfExporterProps) {
    const [isExporting, setIsExporting] = useState(false);
    const { toast } = useToast();

    const mapStudentToPython = (student: StudentReportData) => ({
        ho_ten: student.student_name,
        gioi_tinh: 'Nam',
        ngay_sinh: student.birthYear || 'N/A',
        ngay_tham_gia: 'N/A',
        dai_cap: student.rank <= 5 ? 'Đai Xanh' : 'Đai Vàng',
        lop: 'Hệ Thống Võ Đường Phan Phu Tiên',
        lop_ngan: 'Võ Đường',
        hoc_ky: weekKey || 'Học kỳ I · 2024-2025',
        ngay_cap: new Date().toLocaleDateString('vi-VN'),
        diem_thanh_phan: [
            ['🏃 Chuyên cần', student.cat_chuyen_can, '30%', student.cat_chuyen_can >= 8 ? '#1D9E75' : '#BA7517'],
            ['🧘 Ý thức', student.cat_y_thuc, '30%', student.cat_y_thuc >= 8 ? '#1D9E75' : '#BA7517'],
            ['🥋 Trình độ', student.cat_chuyen_mon, '40%', student.cat_chuyen_mon >= 8 ? '#1D9E75' : '#BA7517'],
        ],
        diem_tong: student.total,
        xep_loai: student.total >= 40 ? 'Xuất sắc' : student.total >= 30 ? 'Giỏi' : student.total >= 20 ? 'Khá' : 'Trung bình',
        xep_hang: student.rank,
        si_so: rankings.length,
        co_mat: Math.round((student.cat_chuyen_can / 10) * 44),
        vang_kp: Math.max(0, 4 - Math.floor(student.cat_chuyen_can / 2.5)),
        vang_cp: 0,
        ti_le_cc: (student.cat_chuyen_can * 10).toFixed(0),
        nhan_xet: student.total >= 40 ? 'Học sinh ưu tú, kỹ thuật tốt và rất chuyên cần.' : 'Cần cố gắng tập luyện đều đặn hơn để nâng cao kỹ thuật.'
    });

    const mapRankingToPython = () => ({
        lop: 'Võ Đường Phan Phu Tiên',
        hoc_ky: weekKey || 'Học kỳ I · 2024-2025',
        ngay: new Date().toLocaleDateString('vi-VN'),
        tong_hs: rankings.length,
        cc_tb: 88,
        diem_tb: (rankings.reduce((acc, r) => acc + r.total, 0) / (rankings.length || 1)).toFixed(2),
        can_chu_y: rankings.filter(r => r.total < 25).length,
        hs: rankings.map(r => ({
            ho_ten: r.student_name,
            dai: r.rank <= 5 ? 'Đai Xanh' : 'Đai Vàng',
            chuyen_can: Math.round(r.cat_chuyen_can * 10),
            diem: r.total
        }))
    });

    async function downloadPdf(url: string, body: any, filename: string) {
        const response = await fetch(`${BACKEND_URL}${url}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(error || 'Lỗi từ server');
        }

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(downloadUrl);
    }

    async function exportRankingPdf() {
        setIsExporting(true);
        try {
            await downloadPdf('/api/export/ranking', { ranking: mapRankingToPython() }, `BangXepHang_${weekKey || 'latest'}.pdf`);
            toast('Đã xuất PDF Bảng Xếp Hạng', 'success');
        } catch (err) {
            toast('Lỗi xuất PDF: ' + (err as Error).message, 'error');
        } finally {
            setIsExporting(false);
        }
    }

    async function exportAllReportsPdf() {
        if (rankings.length === 0) return;
        setIsExporting(true);
        toast('Đang xử lý xuất các phiếu kết quả...', 'info');
        try {
            const mappedStudents = rankings.map(mapStudentToPython);
            await downloadPdf('/api/export/report', { student: mappedStudents }, `PhieuKetQua_Hang_Loat.pdf`);

            toast(`Đã xuất PDF Phiếu Kết Quả`, 'success');
        } catch (err) {
            toast('Lỗi xuất Phiếu KQ: ' + (err as Error).message, 'error');
        } finally {
            setIsExporting(false);
        }
    }

    return (
        <div className="flex items-center gap-2">
            <button
                onClick={exportRankingPdf}
                disabled={isExporting}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-600/20 text-orange-300 border border-orange-500/30 hover:bg-orange-600/30 transition text-sm font-medium disabled:opacity-50"
            >
                {isExporting ? '⏳' : '📄'} BXH
            </button>
            <button
                onClick={exportAllReportsPdf}
                disabled={isExporting || rankings.length === 0}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sky-600/20 text-sky-300 border border-sky-500/30 hover:bg-sky-600/30 transition text-sm font-medium disabled:opacity-50"
            >
                {isExporting ? '⏳' : '📋'} Phiếu Kết Quả
            </button>
        </div>
    );
}

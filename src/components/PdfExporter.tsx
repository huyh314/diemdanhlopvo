'use client';

import { useState } from 'react';
import { useToast } from './Toast';
import { StudentReportData, SemesterReportTemplate } from './pdf/SemesterReportTemplate';
import { RankingTemplate } from './pdf/RankingTemplate';

interface PdfExporterProps {
    rankings: StudentReportData[];
    weekKey?: string;
}

export default function PdfExporter({ rankings, weekKey }: PdfExporterProps) {
    const [isExporting, setIsExporting] = useState(false);
    const { toast } = useToast();

    // Tìm tất cả các nhóm hiện có
    const groups = Array.from(new Set(rankings.map(r => r.group_id))).sort();

    async function exportRankingPdf() {
        if (rankings.length === 0) return;
        setIsExporting(true);
        toast('Đang xử lý xuất Bảng Xếp Hạng...', 'info');
        try {
            // Lazy load thư viện nặng
            const html2canvas = (await import('html2canvas')).default;
            const { jsPDF } = await import('jspdf');

            const pdf = new jsPDF('p', 'mm', 'a4');
            let isFirstPage = true;

            for (let i = 0; i < groups.length; i++) {
                const groupId = groups[i];
                const element = document.getElementById(`pdf-ranking-template-${groupId}`);
                if (!element) continue;

                // Capture canvas
                const canvas = await html2canvas(element, { scale: 1.5, useCORS: true, logging: false });
                const imgData = canvas.toDataURL('image/jpeg', 0.8);

                if (!isFirstPage) {
                    pdf.addPage();
                }

                // Giữ nguyên tỷ lệ khung hình thực tế để chữ không bị bóp méo
                const imgWidth = 210;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;

                pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
                isFirstPage = false;

                await new Promise(resolve => setTimeout(resolve, 100)); // Nghỉ một chút tránh treo máy
            }

            pdf.save(`BangXepHang_${weekKey || 'latest'}.pdf`);

            toast('Đã tải xuống Bảng Xếp Hạng', 'success');
        } catch (err) {
            console.error(err);
            toast('Lỗi xuất PDF: ' + (err as Error).message, 'error');
        } finally {
            setIsExporting(false);
        }
    }

    async function exportAllReportsPdf() {
        if (rankings.length === 0) return;
        setIsExporting(true);
        toast(`Đang xử lý ${rankings.length} phiếu kết quả... Vui lòng đợi!`, 'info');

        try {
            // Lazy load thư viện nặng
            const html2canvas = (await import('html2canvas')).default;
            const { jsPDF } = await import('jspdf');

            const pdf = new jsPDF('p', 'mm', 'a4');
            let isFirstPage = true;

            for (let i = 0; i < rankings.length; i++) {
                const student = rankings[i];
                const element = document.getElementById(`pdf-report-${student.student_id}`);
                if (!element) continue;

                // Render và chụp từng trang, dùng scale 1.5 để tiết kiệm RAM thay vì scale 2.0 dễ bị out of memory với 71 ảnh
                const canvas = await html2canvas(element, { scale: 1.5, useCORS: true, logging: false });
                const imgData = canvas.toDataURL('image/jpeg', 0.6); // Dùng chất lượng 0.6 để PDF nhẹ, tải nhanh

                if (!isFirstPage) {
                    pdf.addPage();
                }
                pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
                isFirstPage = false;

                // Nghỉ 100ms cho mỗi trang để máy tính không bị đơ giật do quá tải
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            pdf.save(`PhieuKetQua_HangLoat_${weekKey || 'latest'}.pdf`);
            toast(`Đã tải xuống ${rankings.length} Phiếu Kết Quả`, 'success');
        } catch (err) {
            console.error(err);
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

            {/* Hidden Templates for HTML2Canvas */}
            <div style={{ position: 'absolute', top: 0, left: '-20000px', width: '210mm' }} aria-hidden="true">
                {/* Export từng nhóm cho Ranking */}
                {groups.map(g => (
                    <div key={`ranking-${g}`} id={`pdf-ranking-template-${g}`} className="bg-white">
                        <RankingTemplate rankings={rankings as any} week={weekKey} groupId={g} />
                    </div>
                ))}

                {/* Tất cả con đặt absolute để xếp chồng nhau, không làm dài container quá mức */}
                {rankings.map(s => (
                    <div key={s.student_id} id={`pdf-report-${s.student_id}`} className="bg-white" style={{ position: 'absolute', top: 0, left: 0, width: '210mm', height: '297mm' }}>
                        <SemesterReportTemplate student={s} week={weekKey} />
                    </div>
                ))}
            </div>
        </div>
    );
}

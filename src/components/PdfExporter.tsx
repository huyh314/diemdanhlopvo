'use client';

import { useState } from 'react';
import { useToast } from './Toast';
import { StudentReportData, SemesterReportTemplate } from './pdf/SemesterReportTemplate';
import { RankingTemplate } from './pdf/RankingTemplate';
import ReportPreviewModal from './ReportPreviewModal';
import { getGroupShortName } from '@/lib/constants';

interface PdfExporterProps {
    rankings: StudentReportData[];
    weekKey?: string;
}

export default function PdfExporter({ rankings, weekKey }: PdfExporterProps) {
    const [isExporting, setIsExporting] = useState(false);
    const [showBxhPreview, setShowBxhPreview] = useState(false);
    const [showPhieuPreview, setShowPhieuPreview] = useState(false);
    const { toast } = useToast();

    const groups = Array.from(new Set(rankings.map(r => r.group_id))).sort();

    // --- BXH Export (PDF) ---
    async function exportRankingPdf() {
        if (rankings.length === 0) return;
        setIsExporting(true);
        toast('Đang xử lý xuất Bảng Xếp Hạng...', 'info');
        try {
            const html2canvas = (await import('html2canvas')).default;
            const { jsPDF } = await import('jspdf');

            const pdf = new jsPDF('p', 'mm', 'a4');
            let isFirstPage = true;

            for (let i = 0; i < groups.length; i++) {
                const groupId = groups[i];
                const element = document.getElementById(`pdf-ranking-template-${groupId}`);
                if (!element) continue;

                const canvas = await html2canvas(element, { scale: 1.5, useCORS: true, logging: false });
                const imgData = canvas.toDataURL('image/jpeg', 0.8);

                if (!isFirstPage) pdf.addPage();

                const imgWidth = 210;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
                isFirstPage = false;

                await new Promise(resolve => setTimeout(resolve, 100));
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

    // --- Phiếu Kết Quả Export (PDF) ---
    async function exportAllReportsPdf() {
        if (rankings.length === 0) return;
        setIsExporting(true);
        toast(`Đang xử lý ${rankings.length} phiếu kết quả... Vui lòng đợi!`, 'info');

        try {
            const html2canvas = (await import('html2canvas')).default;
            const { jsPDF } = await import('jspdf');

            const pdf = new jsPDF('p', 'mm', 'a4');
            let isFirstPage = true;

            for (let i = 0; i < rankings.length; i++) {
                const student = rankings[i];
                const element = document.getElementById(`pdf-report-${student.student_id}`);
                if (!element) continue;

                const canvas = await html2canvas(element, { scale: 1.5, useCORS: true, logging: false });
                const imgData = canvas.toDataURL('image/jpeg', 0.6);

                if (!isFirstPage) pdf.addPage();
                pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
                isFirstPage = false;

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
        <>
            {/* Trigger Buttons */}
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setShowBxhPreview(true)}
                    disabled={rankings.length === 0}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-600/20 text-orange-300 border border-orange-500/30 hover:bg-orange-600/30 transition text-sm font-medium disabled:opacity-50"
                >
                    📄 BXH
                </button>
                <button
                    onClick={() => setShowPhieuPreview(true)}
                    disabled={rankings.length === 0}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sky-600/20 text-sky-300 border border-sky-500/30 hover:bg-sky-600/30 transition text-sm font-medium disabled:opacity-50"
                >
                    📋 Phiếu Kết Quả
                </button>
            </div>

            {/* BXH Preview Modal */}
            {showBxhPreview && (
                <ReportPreviewModal
                    title="📄 Xem trước Bảng Xếp Hạng Thi Đua"
                    onClose={() => setShowBxhPreview(false)}
                    onDownload={exportRankingPdf}
                    isDownloading={isExporting}
                    downloadLabel="⬇️ Tải về PDF"
                >
                    <BxhPreviewTable rankings={rankings as any} weekKey={weekKey} />
                </ReportPreviewModal>
            )}

            {/* Phiếu Kết Quả Preview Modal */}
            {showPhieuPreview && (
                <ReportPreviewModal
                    title="📋 Xem trước Phiếu Kết Quả Học Sinh"
                    onClose={() => setShowPhieuPreview(false)}
                    onDownload={exportAllReportsPdf}
                    isDownloading={isExporting}
                    downloadLabel={`⬇️ Tải về PDF (${rankings.length} phiếu)`}
                >
                    <PhieuPreviewTable rankings={rankings as any} weekKey={weekKey} />
                </ReportPreviewModal>
            )}

            {/* Hidden Templates for HTML2Canvas — luôn tồn tại trong DOM */}
            <div style={{ position: 'absolute', top: 0, left: '-20000px', width: '210mm' }} aria-hidden="true">
                {groups.map(g => (
                    <div key={`ranking-${g}`} id={`pdf-ranking-template-${g}`} className="bg-white">
                        <RankingTemplate rankings={rankings as any} week={weekKey} groupId={g} />
                    </div>
                ))}
                {rankings.map(s => (
                    <div key={s.student_id} id={`pdf-report-${s.student_id}`} className="bg-white" style={{ position: 'absolute', top: 0, left: 0, width: '210mm', height: '297mm' }}>
                        <SemesterReportTemplate student={s} week={weekKey} />
                    </div>
                ))}
            </div>
        </>
    );
}

// ----- Preview Tables -----

function BxhPreviewTable({ rankings, weekKey }: { rankings: any[]; weekKey?: string }) {
    if (rankings.length === 0) {
        return <div className="text-center py-12 text-[var(--text-muted)]"><p className="text-4xl mb-2">📭</p><p>Chưa có dữ liệu xếp hạng.</p></div>;
    }

    const sorted = [...rankings].sort((a, b) => b.total - a.total);

    return (
        <div className="space-y-4">
            <p className="text-sm text-[var(--text-muted)]">
                {weekKey ? `Tuần: ${weekKey}` : `Ngày xem: ${new Date().toLocaleDateString('vi-VN')}`} — {sorted.length} học sinh
            </p>
            <div className="rounded-xl border border-[var(--border-primary)] overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-white/5 border-b border-[var(--border-primary)]">
                            <th className="px-4 py-2.5 text-center text-xs font-bold text-[var(--text-muted)] uppercase w-14">Hạng</th>
                            <th className="px-4 py-2.5 text-left text-xs font-bold text-[var(--text-muted)] uppercase">Họ Tên</th>
                            <th className="px-4 py-2.5 text-center text-xs font-bold text-[var(--text-muted)] uppercase w-20">Nhóm</th>
                            <th className="px-4 py-2.5 text-center text-xs font-bold text-[var(--text-muted)] uppercase w-24">Chuyên Cần</th>
                            <th className="px-4 py-2.5 text-center text-xs font-bold text-[var(--text-muted)] uppercase w-20">Ý Thức</th>
                            <th className="px-4 py-2.5 text-center text-xs font-bold text-[var(--text-muted)] uppercase w-24">Chuyên Môn</th>
                            <th className="px-4 py-2.5 text-center text-xs font-bold text-[var(--text-muted)] uppercase w-16">Tổng</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sorted.map((r, i) => {
                            const rank = i + 1;
                            const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank;
                            return (
                                <tr key={r.student_id} className={`border-b border-white/5 hover:bg-white/5 ${rank <= 3 ? 'bg-yellow-500/5' : ''}`}>
                                    <td className="px-4 py-2.5 text-center">{typeof medal === 'string' ? <span className="text-lg">{medal}</span> : <span className="text-sm text-gray-500">{medal}</span>}</td>
                                    <td className="px-4 py-2.5 font-semibold">{r.student_name}</td>
                                    <td className="px-4 py-2.5 text-center text-xs text-[var(--text-muted)]">{getGroupShortName(r.group_id)}</td>
                                    <td className="px-4 py-2.5 text-center font-mono text-[var(--text-muted)]">{r.cat_chuyen_can}</td>
                                    <td className="px-4 py-2.5 text-center font-mono text-[var(--text-muted)]">{r.cat_y_thuc}</td>
                                    <td className="px-4 py-2.5 text-center font-mono text-[var(--text-muted)]">{r.cat_chuyen_mon}</td>
                                    <td className="px-4 py-2.5 text-center font-bold text-emerald-400">{r.total}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function PhieuPreviewTable({ rankings, weekKey }: { rankings: any[]; weekKey?: string }) {
    if (rankings.length === 0) {
        return <div className="text-center py-12 text-[var(--text-muted)]"><p className="text-4xl mb-2">📭</p><p>Chưa có dữ liệu.</p></div>;
    }

    return (
        <div className="space-y-4">
            <p className="text-sm text-[var(--text-muted)]">
                {weekKey ? `Tuần: ${weekKey}` : `Ngày xem: ${new Date().toLocaleDateString('vi-VN')}`} — {rankings.length} học sinh
            </p>
            <div className="rounded-xl border border-[var(--border-primary)] overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-white/5 border-b border-[var(--border-primary)]">
                            <th className="px-4 py-2.5 text-left text-xs font-bold text-[var(--text-muted)] uppercase">Họ Tên</th>
                            <th className="px-4 py-2.5 text-center text-xs font-bold text-[var(--text-muted)] uppercase w-20">Nhóm</th>
                            <th className="px-4 py-2.5 text-center text-xs font-bold text-[var(--text-muted)] uppercase w-24">Chuyên Cần</th>
                            <th className="px-4 py-2.5 text-center text-xs font-bold text-[var(--text-muted)] uppercase w-20">Ý Thức</th>
                            <th className="px-4 py-2.5 text-center text-xs font-bold text-[var(--text-muted)] uppercase w-24">Chuyên Môn</th>
                            <th className="px-4 py-2.5 text-center text-xs font-bold text-[var(--text-muted)] uppercase w-16">Tổng</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rankings.map((r: any) => (
                            <tr key={r.student_id} className="border-b border-white/5 hover:bg-white/5">
                                <td className="px-4 py-2.5 font-semibold">{r.student_name}</td>
                                <td className="px-4 py-2.5 text-center text-xs text-[var(--text-muted)]">{getGroupShortName(r.group_id)}</td>
                                <td className="px-4 py-2.5 text-center font-mono text-[var(--text-muted)]">{r.cat_chuyen_can}</td>
                                <td className="px-4 py-2.5 text-center font-mono text-[var(--text-muted)]">{r.cat_y_thuc}</td>
                                <td className="px-4 py-2.5 text-center font-mono text-[var(--text-muted)]">{r.cat_chuyen_mon}</td>
                                <td className="px-4 py-2.5 text-center font-bold text-emerald-400">{r.total}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

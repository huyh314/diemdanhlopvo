'use client';

import { useState, useEffect } from 'react';
import { Button, InputField } from '@/components/ui';
import ReportPreviewModal from '@/components/ReportPreviewModal';

interface ExcelPreviewData {
    rows: Record<string, any>[];
    dates: string[];
    month: number;
    year: number;
}

export default function ExportButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [preview, setPreview] = useState<ExcelPreviewData | null>(null);

    const [selectedMonthStr, setSelectedMonthStr] = useState(() => {
        const now = new Date();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        return `${now.getFullYear()}-${m}`;
    });

    const getParams = () => {
        const [yyyy, mm] = selectedMonthStr.split('-');
        return { month: parseInt(mm, 10) || new Date().getMonth() + 1, year: parseInt(yyyy, 10) || new Date().getFullYear() };
    };

    useEffect(() => {
        if (!isOpen) {
            setPreview(null);
            return;
        }

        async function fetchPreview() {
            setIsLoading(true);
            try {
                const { month, year } = getParams();
                const res = await fetch(`/api/export/excel?month=${month}&year=${year}`, {
                    headers: { Accept: 'application/json' },
                });
                if (!res.ok) {
                    const err = await res.json();
                    alert(err.error || 'Không thể tải dữ liệu');
                    setPreview(null);
                    return;
                }
                const data: ExcelPreviewData = await res.json();
                setPreview(data);
            } catch (error) {
                console.error('Preview Error:', error);
                alert('Lỗi khi tải dữ liệu!');
            } finally {
                setIsLoading(false);
            }
        }

        fetchPreview();
    }, [isOpen, selectedMonthStr]);

    const handleDownload = async () => {
        if (!preview) return;
        setIsDownloading(true);
        try {
            const { month, year } = getParams();
            const res = await fetch(`/api/export/excel?month=${month}&year=${year}`);
            if (!res.ok) throw new Error('Không thể xuất file');

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `DiemDanh_T${month}_${year}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download Error:', error);
            alert('Lỗi tải file Excel!');
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(true)}
                className="gap-2"
            >
                <span>📊</span>
                Xuất Excel
            </Button>

            {isOpen && (
                <ReportPreviewModal
                    title={
                        <div className="flex items-center gap-3">
                            <span>📊 Báo Cáo Điểm Danh</span>
                            <InputField 
                                type="month"
                                value={selectedMonthStr}
                                onChange={(e: any) => setSelectedMonthStr(e.target.value)}
                                className="w-auto py-1 px-2 text-sm rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)]"
                            />
                        </div>
                    }
                    onClose={() => setIsOpen(false)}
                    onDownload={handleDownload}
                    isDownloading={isDownloading}
                    downloadLabel="⬇️ Tải về Excel"
                >
                    {isLoading || !preview ? (
                        <div className="text-center py-12 text-[var(--text-muted)]">
                            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                            <p>Đang tải dữ liệu báo cáo...</p>
                        </div>
                    ) : (
                        <ExcelPreviewTable data={preview} />
                    )}
                </ReportPreviewModal>
            )}
        </>
    );
}

function ExcelPreviewTable({ data }: { data: ExcelPreviewData }) {
    const STATUS_COLORS: Record<string, string> = {
        CM: 'text-emerald-400 font-bold',
        P: 'text-yellow-400 font-medium',
        V: 'text-red-400',
    };

    if (data.rows.length === 0) {
        return (
            <div className="text-center py-12 text-[var(--text-muted)]">
                <p className="text-4xl mb-2">📭</p>
                <p>Không có dữ liệu điểm danh trong tháng này.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-xl border border-[var(--border-primary)]">
            <table className="w-full text-xs min-w-max">
                <thead>
                    <tr className="bg-white/5 border-b border-[var(--border-primary)]">
                        <th className="px-3 py-2 text-left font-bold sticky left-0 bg-[var(--bg-secondary)] z-10 min-w-[140px]">Họ Tên</th>
                        <th className="px-3 py-2 text-center font-bold w-14">Nhóm</th>
                        {data.dates.map(d => (
                            <th key={d} className="px-2 py-2 text-center font-mono text-[var(--text-muted)] w-12">
                                {d.slice(5)} {/* MM-DD */}
                            </th>
                        ))}
                        <th className="px-3 py-2 text-center font-bold text-emerald-400 w-16">CM</th>
                        <th className="px-3 py-2 text-center font-bold text-yellow-400 w-14">Phép</th>
                        <th className="px-3 py-2 text-center font-bold text-red-400 w-14">Vắng</th>
                    </tr>
                </thead>
                <tbody>
                    {data.rows.map((row, i) => (
                        <tr
                            key={i}
                            className="border-b border-white/5 hover:bg-white/5 transition"
                        >
                            <td className="px-3 py-2 font-semibold sticky left-0 bg-[var(--bg-primary)] z-10 whitespace-nowrap">{row['Họ Tên']}</td>
                            <td className="px-3 py-2 text-center text-[var(--text-muted)]">{row['Nhóm']}</td>
                            {data.dates.map(d => {
                                const val = row[d] || '';
                                return (
                                    <td key={d} className={`px-2 py-2 text-center ${STATUS_COLORS[val] || 'text-[var(--text-muted)]'}`}>
                                        {val || '·'}
                                    </td>
                                );
                            })}
                            <td className="px-3 py-2 text-center font-bold text-emerald-400">{row['Tổng CM']}</td>
                            <td className="px-3 py-2 text-center text-yellow-400">{row['Tổng Phép']}</td>
                            <td className="px-3 py-2 text-center text-red-400">{row['Tổng Vắng']}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

import React from 'react';
import { getGroupName } from '@/lib/constants';

interface RankingData {
    student_id: string;
    student_name: string;
    group_id: string;
    cat_chuyen_can: number;
    cat_y_thuc: number;
    cat_chuyen_mon: number;
    total: number;
    rank: number;
    medal?: string;
}

interface RankingTemplateProps {
    rankings: RankingData[];
    week?: string;
    groupId?: string;
}

export const RankingTemplate = React.forwardRef<HTMLDivElement, RankingTemplateProps>(({ rankings, week, groupId }, ref) => {
    // Lọc theo nhóm nếu có groupId
    const filteredRankings = groupId ? rankings.filter(r => r.group_id === groupId) : rankings;

    // Sort bằng JavaScript để chắc chắn đúng thứ tự điểm số
    const sortedRankings = [...filteredRankings].sort((a, b) => b.total - a.total);

    const displayTitle = groupId ? `BẢNG XẾP HẠNG THI ĐUA - ${getGroupName(groupId).toUpperCase()}` : 'BẢNG XẾP HẠNG THI ĐUA TỔNG HỢP';

    return (
        <div ref={ref} className="p-8 w-[210mm] min-h-[297mm]" style={{ backgroundColor: '#ffffff', color: '#1e293b', fontFamily: 'sans-serif' }}>
            {/* Header */}
            <div className="pb-4 mb-6" style={{ borderBottom: '4px solid #2563eb' }}>
                <h1 className="text-2xl font-bold text-center uppercase tracking-wide" style={{ color: '#1e40af' }}>
                    Võ Đường Phan Phu Tiên
                </h1>
                <p className="text-center text-sm mt-1" style={{ color: '#64748b' }}>
                    Hệ Thống Quản Lý Điểm Danh & Thi Đua
                </p>
            </div>

            {/* Title */}
            <div className="text-center mb-8">
                <h2 className="text-xl font-bold uppercase" style={{ color: '#0f172a' }}>{displayTitle}</h2>
                <p className="text-sm mt-2" style={{ color: '#64748b' }}>
                    {week ? `Tuần: ${week}` : `Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`}
                </p>
                <p className="text-sm" style={{ color: '#64748b' }}>Tổng số học sinh thuộc bảng này: {sortedRankings.length}</p>
            </div>

            {/* Table */}
            <table className="w-full text-sm border-collapse" style={{ border: '1px solid #cbd5e1' }}>
                <thead>
                    <tr style={{ backgroundColor: '#2563eb', color: '#ffffff' }}>
                        <th className="px-3 py-2 text-center w-12" style={{ border: '1px solid #cbd5e1' }}>Hạng</th>
                        <th className="px-3 py-2 text-left" style={{ border: '1px solid #cbd5e1' }}>Họ Tên</th>
                        <th className="px-3 py-2 text-center w-16" style={{ border: '1px solid #cbd5e1' }}>Nhóm</th>
                        <th className="px-3 py-2 text-center w-20" style={{ border: '1px solid #cbd5e1' }}>Chuyên Cần</th>
                        <th className="px-3 py-2 text-center w-20" style={{ border: '1px solid #cbd5e1' }}>Ý Thức</th>
                        <th className="px-3 py-2 text-center w-24" style={{ border: '1px solid #cbd5e1' }}>Chuyên Môn</th>
                        <th className="px-3 py-2 text-center w-16 font-bold" style={{ border: '1px solid #cbd5e1' }}>Tổng</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedRankings.map((r, i) => {
                        const rankNumber = i + 1;
                        const rowBg = rankNumber === 1 ? '#fefce8' : rankNumber === 2 ? '#f8fafc' : rankNumber === 3 ? '#fff7ed' : rankNumber % 2 === 0 ? '#f8fafc' : '#ffffff';
                        const totalColor = r.total >= 30 ? '#16a34a' : r.total < 10 ? '#ef4444' : '#2563eb';

                        return (
                            <tr key={r.student_id} style={{ backgroundColor: rowBg }}>
                                <td className="px-3 py-2 text-center font-bold" style={{ border: '1px solid #cbd5e1' }}>
                                    {rankNumber === 1 ? '🥇 1' : rankNumber === 2 ? '🥈 2' : rankNumber === 3 ? '🥉 3' : rankNumber}
                                </td>
                                <td className="px-3 py-2 font-semibold" style={{ border: '1px solid #cbd5e1' }}>
                                    {r.student_name}
                                </td>
                                <td className="px-3 py-2 text-center" style={{ border: '1px solid #cbd5e1' }}>
                                    {getGroupName(r.group_id)}
                                </td>
                                <td className="px-3 py-2 text-center" style={{ border: '1px solid #cbd5e1', color: '#475569' }}>
                                    {r.cat_chuyen_can > 0 ? `+${r.cat_chuyen_can}` : r.cat_chuyen_can}
                                </td>
                                <td className="px-3 py-2 text-center" style={{ border: '1px solid #cbd5e1', color: '#475569' }}>
                                    {r.cat_y_thuc > 0 ? `+${r.cat_y_thuc}` : r.cat_y_thuc}
                                </td>
                                <td className="px-3 py-2 text-center" style={{ border: '1px solid #cbd5e1', color: '#475569' }}>
                                    {r.cat_chuyen_mon > 0 ? `+${r.cat_chuyen_mon}` : r.cat_chuyen_mon}
                                </td>
                                <td className="px-3 py-2 text-center font-bold" style={{ border: '1px solid #cbd5e1', color: totalColor }}>
                                    {r.total}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {/* Footer */}
            <div className="mt-12 text-center text-xs pt-4" style={{ color: '#94a3b8', borderTop: '1px solid #e2e8f0' }}>
                Xuất bởi hệ thống VoDuongManager • {new Date().toLocaleString('vi-VN')}
            </div>
        </div>
    );
});

RankingTemplate.displayName = 'RankingTemplate';

import React from 'react';
import { getGroupName } from '@/lib/constants';

export interface StudentReportData {
    student_id: string;
    student_name: string;
    group_id: string;
    cat_chuyen_can: number;
    cat_y_thuc: number;
    cat_chuyen_mon: number;
    total: number;
    rank: number;
    medal?: string;
    birthYear?: string;
}

interface SemesterReportTemplateProps {
    student: StudentReportData;
    week?: string;
}

export const SemesterReportTemplate = React.forwardRef<HTMLDivElement, SemesterReportTemplateProps>(({ student, week }, ref) => {
    // Generate comment based on total score
    const generateComment = (total: number) => {
        if (total >= 40) return 'Xuất sắc! Học sinh có thành tích thi đua vượt trội, thể hiện tinh thần chuyên cần, kỷ luật rất tốt và trình độ cao. Cần tiếp tục phát huy.';
        if (total >= 30) return 'Tốt! Học sinh có điểm thi đua cao, chăm chỉ tập luyện và có ý thức kỷ luật tốt. Cần cố gắng thêm để đạt mức xuất sắc.';
        if (total >= 20) return 'Khá! Học sinh có tinh thần tập luyện đều đặn. Cần chú ý cải thiện thêm về kỷ luật và trình độ kỹ thuật.';
        if (total >= 10) return 'Trung bình. Học sinh cần nỗ lực hơn trong việc tập luyện đều đặn, giữ kỷ luật tốt hơn và cải thiện trình độ.';
        return 'Cần cải thiện. Điểm thi đua còn thấp, học sinh cần tích cực tham gia tập luyện, chấp hành nội quy và nâng cao trình độ.';
    };

    const pct = Math.min(Math.max((student.total || 0) / 50, 0), 1) * 100;
    const progressColor = pct >= 60 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444';

    return (
        <div ref={ref} className="p-8 w-[210mm] min-h-[297mm] mx-auto" style={{ backgroundColor: '#ffffff', color: '#1e293b', fontFamily: 'sans-serif' }}>
            {/* Header */}
            <div className="pb-4 mb-6" style={{ borderBottom: '4px solid #0ea5e9' }}>
                <h1 className="text-2xl font-bold text-center uppercase tracking-wide" style={{ color: '#0369a1' }}>
                    Võ Đường Phan Phu Tiên
                </h1>
                <p className="text-center text-sm mt-1" style={{ color: '#64748b' }}>
                    Hệ Thống Quản Lý Điểm Danh & Thi Đua
                </p>
            </div>

            {/* Student Info Box */}
            <div className="rounded-lg p-6 mb-8" style={{ backgroundColor: '#f8fafc', border: '1px solid #f1f5f9' }}>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm mb-1" style={{ color: '#64748b' }}>Họ và Tên</p>
                        <p className="text-xl font-bold" style={{ color: '#0f172a' }}>{student.student_name}</p>
                    </div>
                    <div>
                        <p className="text-sm mb-1" style={{ color: '#64748b' }}>Năm Sinh</p>
                        <p className="text-lg font-semibold" style={{ color: '#334155' }}>{student.birthYear || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-sm mb-1" style={{ color: '#64748b' }}>Nhóm</p>
                        <p className="text-lg font-semibold" style={{ color: '#334155' }}>
                            {getGroupName(student.group_id)}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm mb-1" style={{ color: '#64748b' }}>Kỳ Đánh Giá</p>
                        <p className="text-lg font-semibold" style={{ color: '#334155' }}>{week || 'Hiện tại'}</p>
                    </div>
                </div>
            </div>

            {/* Title */}
            <div className="text-center mb-6">
                <h2 className="text-xl font-bold uppercase" style={{ color: '#0369a1' }}>Bảng Điểm Thi Đua</h2>
            </div>

            {/* Score Table */}
            <table className="w-full text-sm border-collapse mb-8" style={{ border: '1px solid #e2e8f0' }}>
                <thead>
                    <tr style={{ backgroundColor: '#0ea5e9', color: '#ffffff' }}>
                        <th className="px-4 py-3 text-left w-1/3" style={{ border: '1px solid #e2e8f0' }}>Tiêu Chí</th>
                        <th className="px-4 py-3 text-left" style={{ border: '1px solid #e2e8f0' }}>Mô Tả</th>
                        <th className="px-4 py-3 text-center w-24" style={{ border: '1px solid #e2e8f0' }}>Điểm</th>
                    </tr>
                </thead>
                <tbody>
                    <tr style={{ backgroundColor: '#ffffff' }}>
                        <td className="px-4 py-4 font-bold" style={{ border: '1px solid #e2e8f0' }}>🏃 Chuyên Cần</td>
                        <td className="px-4 py-4" style={{ border: '1px solid #e2e8f0', color: '#64748b' }}>Tập đều, đúng giờ</td>
                        <td className="px-4 py-4 text-center font-bold text-lg" style={{ border: '1px solid #e2e8f0' }}>
                            {student.cat_chuyen_can > 0 ? `+${student.cat_chuyen_can}` : student.cat_chuyen_can}
                        </td>
                    </tr>
                    <tr style={{ backgroundColor: '#f8fafc' }}>
                        <td className="px-4 py-4 font-bold" style={{ border: '1px solid #e2e8f0' }}>🧘 Ý Thức</td>
                        <td className="px-4 py-4" style={{ border: '1px solid #e2e8f0', color: '#64748b' }}>Thái độ, kỷ luật</td>
                        <td className="px-4 py-4 text-center font-bold text-lg" style={{ border: '1px solid #e2e8f0' }}>
                            {student.cat_y_thuc > 0 ? `+${student.cat_y_thuc}` : student.cat_y_thuc}
                        </td>
                    </tr>
                    <tr style={{ backgroundColor: '#ffffff' }}>
                        <td className="px-4 py-4 font-bold" style={{ border: '1px solid #e2e8f0' }}>🥋 Trình Độ</td>
                        <td className="px-4 py-4" style={{ border: '1px solid #e2e8f0', color: '#64748b' }}>Thuộc bài, thể lực</td>
                        <td className="px-4 py-4 text-center font-bold text-lg" style={{ border: '1px solid #e2e8f0' }}>
                            {student.cat_chuyen_mon > 0 ? `+${student.cat_chuyen_mon}` : student.cat_chuyen_mon}
                        </td>
                    </tr>
                </tbody>
            </table>

            {/* Total Score Box */}
            <div className="flex justify-center mb-8">
                <div className="rounded-lg py-4 px-10 text-center shadow-md" style={{ backgroundColor: '#0ea5e9' }}>
                    <p className="text-sm mb-1 uppercase tracking-wider font-semibold" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Tổng Điểm Tích Lũy</p>
                    <p className="text-white text-4xl font-bold">{student.total} <span className="text-xl font-normal opacity-80">PT</span></p>
                </div>
            </div>

            {/* Comment Section */}
            <div className="mb-10">
                <h3 className="font-bold mb-2 text-lg" style={{ color: '#1e293b' }}>Nhận xét:</h3>
                <p className="leading-relaxed p-4 rounded-lg" style={{ color: '#475569', backgroundColor: '#f8fafc', border: '1px solid #f1f5f9' }}>
                    {generateComment(student.total)}
                </p>
            </div>

            {/* Progress Bar */}
            <div className="mb-12">
                <div className="flex justify-between text-sm mb-2" style={{ color: '#64748b' }}>
                    <span>Tiến trình: {student.total}/50 PT ({Math.round(pct)}%)</span>
                    <span>Mục tiêu: 50 PT</span>
                </div>
                <div className="h-4 w-full rounded-full overflow-hidden relative" style={{ backgroundColor: '#e2e8f0' }}>
                    <div className="h-full transition-all" style={{ width: `${pct}%`, backgroundColor: progressColor }}></div>
                    {/* Markers */}
                    <div className="absolute top-0 bottom-0 left-[40%] w-[1px]" style={{ backgroundColor: 'rgba(255, 255, 255, 0.5)' }}></div>
                    <div className="absolute top-0 bottom-0 left-[60%] w-[1px]" style={{ backgroundColor: 'rgba(255, 255, 255, 0.5)' }}></div>
                    <div className="absolute top-0 bottom-0 left-[80%] w-[1px]" style={{ backgroundColor: 'rgba(255, 255, 255, 0.5)' }}></div>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-auto text-center text-xs pt-6" style={{ color: '#94a3b8', borderTop: '1px solid #e2e8f0' }}>
                Xuất bởi hệ thống VoDuongManager • {new Date().toLocaleString('vi-VN')}
            </div>
        </div>
    );
});

SemesterReportTemplate.displayName = 'SemesterReportTemplate';

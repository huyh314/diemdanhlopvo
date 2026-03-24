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
        if (total >= 40) return 'Học sinh có thành tích thi đua vượt trội, thể hiện tinh thần chuyên cần, kỷ luật tốt và trình độ cao. Cần tiếp tục phát huy trong các kỳ đánh giá tiếp theo.';
        if (total >= 30) return 'Học sinh có điểm thi đua tốt, chăm chỉ tập luyện và có ý thức kỷ luật. Cần cố gắng thêm để đạt mức xuất sắc.';
        if (total >= 20) return 'Học sinh có tinh thần tập luyện đều đặn. Cần chú ý cải thiện thêm về kỷ luật và trình độ kỹ thuật.';
        if (total >= 10) return 'Học sinh cần nỗ lực hơn trong việc tập luyện đều đặn, giữ kỷ luật tốt hơn và cải thiện trình độ.';
        return 'Học sinh cần tích cực tham gia tập luyện, chấp hành nội quy và nâng cao trình độ để cải thiện điểm số.';
    };

    const getBadge = (total: number) => {
        if (total >= 40) return 'Xuất sắc';
        if (total >= 30) return 'Giỏi';
        if (total >= 20) return 'Khá';
        return 'Trung bình';
    };

    const pct = Math.min(Math.max((student.total || 0) / 50, 0), 1) * 100;

    return (
        <div ref={ref} className="w-[210mm] h-[297mm] box-border p-[6mm]" style={{ background: '#eef3f8', color: '#1f2937', fontFamily: '"Segoe UI", Arial, sans-serif' }}>
            <div className="bg-white rounded-[22px] overflow-hidden flex flex-col h-full" style={{ boxShadow: '0 12px 35px rgba(15, 94, 156, 0.12)', border: '1px solid #e5edf5' }}>
                {/* Header */}
                <div style={{ background: 'linear-gradient(135deg, #0f5e9c, #1fa7e1)', color: 'white', padding: '30px 36px 26px', textAlign: 'center' }}>
                    <h1 style={{ fontSize: '34px', fontWeight: 800, letterSpacing: '1px', marginBottom: '8px', textTransform: 'uppercase', margin: 0 }}>VÕ ĐƯỜNG PHAN PHU TIÊN</h1>
                    <p style={{ fontSize: '16px', opacity: 0.95, margin: 0 }}>Hệ thống quản lý điểm danh & thi đua</p>
                </div>

                {/* Section 1 */}
                <div style={{ padding: '26px 32px' }}>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f5e9c', marginBottom: '18px', textTransform: 'uppercase' }}>Phiếu đánh giá thi đua</div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                        <div style={{ background: '#f8fbfe', border: '1px solid #dce8f3', borderRadius: '16px', padding: '18px 20px' }}>
                            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Họ và tên</div>
                            <div style={{ fontSize: '30px', fontWeight: 800, color: '#111827' }}>{student.student_name}</div>
                        </div>

                        <div style={{ background: '#f8fbfe', border: '1px solid #dce8f3', borderRadius: '16px', padding: '18px 20px' }}>
                            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Năm sinh</div>
                            <div style={{ fontSize: '20px', fontWeight: 800, color: '#111827' }}>{student.birthYear || 'N/A'}</div>
                        </div>

                        <div style={{ background: '#f8fbfe', border: '1px solid #dce8f3', borderRadius: '16px', padding: '18px 20px' }}>
                            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Nhóm</div>
                            <div style={{ fontSize: '20px', fontWeight: 800, color: '#111827' }}>{getGroupName(student.group_id)}</div>
                        </div>

                        <div style={{ background: '#f8fbfe', border: '1px solid #dce8f3', borderRadius: '16px', padding: '18px 20px' }}>
                            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Kỳ đánh giá</div>
                            <div style={{ fontSize: '20px', fontWeight: 800, color: '#111827' }}>{week || 'Hiện tại'}</div>
                        </div>
                    </div>
                </div>

                {/* Section 2 */}
                <div style={{ padding: '0 32px 26px 32px', flex: 1 }}>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f5e9c', marginBottom: '18px', textTransform: 'uppercase' }}>Bảng điểm thi đua</div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '22px', alignItems: 'start' }}>
                        <div style={{ border: '1px solid #dce8f3', borderRadius: '18px', overflow: 'hidden', background: 'white' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ background: '#0f5e9c', color: 'white' }}>
                                    <tr>
                                        <th style={{ padding: '16px 18px', textAlign: 'left', borderBottom: '1px solid #e7eef5', fontSize: '15px', fontWeight: 700 }}>Tiêu chí</th>
                                        <th style={{ padding: '16px 18px', textAlign: 'left', borderBottom: '1px solid #e7eef5', fontSize: '15px', fontWeight: 700 }}>Mô tả</th>
                                        <th style={{ padding: '16px 18px', textAlign: 'center', borderBottom: '1px solid #e7eef5', fontSize: '15px', fontWeight: 700, width: '120px', whiteSpace: 'nowrap' }}>Điểm</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td style={{ padding: '16px 18px', textAlign: 'left', borderBottom: '1px solid #e7eef5', fontSize: '16px' }}>🏃 Chuyên cần</td>
                                        <td style={{ padding: '16px 18px', textAlign: 'left', borderBottom: '1px solid #e7eef5', fontSize: '16px' }}>Tập đều, đúng giờ</td>
                                        <td style={{ padding: '16px 18px', textAlign: 'center', borderBottom: '1px solid #e7eef5', fontWeight: 800, fontSize: '26px', color: '#0f5e9c' }}>
                                            {student.cat_chuyen_can > 0 ? `+${student.cat_chuyen_can}` : student.cat_chuyen_can}
                                        </td>
                                    </tr>
                                    <tr style={{ background: '#f8fbfe' }}>
                                        <td style={{ padding: '16px 18px', textAlign: 'left', borderBottom: '1px solid #e7eef5', fontSize: '16px' }}>💡 Ý thức</td>
                                        <td style={{ padding: '16px 18px', textAlign: 'left', borderBottom: '1px solid #e7eef5', fontSize: '16px' }}>Thái độ, kỷ luật</td>
                                        <td style={{ padding: '16px 18px', textAlign: 'center', borderBottom: '1px solid #e7eef5', fontWeight: 800, fontSize: '26px', color: '#0f5e9c' }}>
                                            {student.cat_y_thuc > 0 ? `+${student.cat_y_thuc}` : student.cat_y_thuc}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: '16px 18px', textAlign: 'left', borderBottom: '1px solid #e7eef5', fontSize: '16px' }}>🥋 Trình độ</td>
                                        <td style={{ padding: '16px 18px', textAlign: 'left', borderBottom: '1px solid #e7eef5', fontSize: '16px' }}>Thuộc bài, thể lực</td>
                                        <td style={{ padding: '16px 18px', textAlign: 'center', borderBottom: '1px solid #e7eef5', fontWeight: 800, fontSize: '26px', color: '#0f5e9c' }}>
                                            {student.cat_chuyen_mon > 0 ? `+${student.cat_chuyen_mon}` : student.cat_chuyen_mon}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div style={{ background: 'linear-gradient(180deg, #f8fbfe, #eef7fd)', border: '1px solid #d9e9f5', borderRadius: '22px', padding: '24px 20px', textAlign: 'center', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7)', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f5e9c', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px' }}>Tổng điểm tích lũy</div>
                            <div>
                                <span style={{ fontSize: '58px', fontWeight: 900, color: '#0f5e9c', lineHeight: 1 }}>{student.total}</span>
                                <span style={{ fontSize: '22px', fontWeight: 700, color: '#1fa7e1', marginLeft: '4px' }}>PT</span>
                            </div>
                            <div style={{ display: 'inline-block', marginTop: '14px', padding: '8px 16px', borderRadius: '999px', background: '#19b97a', color: 'white', fontWeight: 700, fontSize: '14px', textTransform: 'uppercase' }}>
                                {getBadge(student.total)}
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '22px', background: '#f8fbfe', border: '1px solid #dce8f3', borderRadius: '18px', padding: '20px' }}>
                        <div style={{ fontSize: '20px', fontWeight: 800, marginBottom: '12px', color: '#0f5e9c' }}>Nhận xét</div>
                        <div style={{ fontSize: '17px', lineHeight: 1.7, color: '#334155', marginBottom: '18px' }}>
                            {generateComment(student.total)}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', fontWeight: 700, fontSize: '15px', color: '#475569', marginBottom: '10px', flexWrap: 'wrap' }}>
                            <span>Tiến trình: {student.total}/50 PT ({Math.round(pct)}%)</span>
                            <span>Mục tiêu: 50 PT</span>
                        </div>

                        <div style={{ width: '100%', height: '16px', background: '#dbe7f1', borderRadius: '999px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #19b97a, #29cc8b)', borderRadius: '999px' }}></div>
                        </div>
                    </div>
                </div>

                <div style={{ padding: '20px 32px 28px', textAlign: 'center', fontSize: '14px', color: '#94a3b8' }}>
                    Xuất bởi hệ thống VoDuongManager • {new Date().toLocaleTimeString('vi-VN')} {new Date().toLocaleDateString('vi-VN')}
                </div>
            </div>
        </div>
    );
});

SemesterReportTemplate.displayName = 'SemesterReportTemplate';

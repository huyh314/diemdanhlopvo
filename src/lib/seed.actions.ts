'use server';

import { createClient } from '@/utils/supabase/server';
import * as dal from '@/lib/dal';
import type { GroupId } from '@/types/database.types';
import { GROUP_IDS } from '@/lib/constants';

const STATUSES = ['present', 'absent', 'excused'];

export async function run10DaySeedAction() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const studentsData = await dal.getStudents();
        if (!studentsData || studentsData.length === 0) {
            throw new Error('Không có học sinh nào trong hệ thống.');
        }

        const now = new Date();

        console.log("Bắt đầu tạo dữ liệu 10 ngày (Tối ưu hóa)...");

        // 1. Tạo tất cả Sessions trước bằng 1 lệnh RPC hoặc bulk insert
        // Vì DAL chưa có bulk session, ta sẽ tạo tuần tự nhưng giới hạn số lượng ngày nếu cần
        const daysToSeed = 10; // Thay đổi thành 10 ngày theo yêu cầu

        for (let i = daysToSeed; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            for (const groupId of GROUP_IDS) {
                const session_id = await dal.getOrCreateSession(dateStr, groupId);

                const studentsInGroup = studentsData.filter(s => s.group_id === groupId);
                const records = studentsInGroup.map(s => ({
                    studentId: s.id,
                    status: STATUSES[Math.floor(Math.random() * STATUSES.length)] as any
                }));

                if (records.length > 0) {
                    await dal.saveAttendance(session_id, records);
                }
            }
        }

        // 2. Tạo dữ liệu chấm điểm - TỐI ƯU CỰC ĐẠI
        const w = getWeekNumber(now);
        const weekKey = `${now.getFullYear()}-W${w.toString().padStart(2, '0')}`;

        console.log(`Đang tạo điểm mẫu cho tuần ${weekKey}...`);

        // CHỈ tạo điểm mẫu cho 3 học sinh đầu tiên để tránh bị Timeout của Netlify (10s limit)
        // Hệ thống sẽ TỰ ĐỘNG tính điểm chuyên cần cho 77 học sinh còn lại nhờ tính năng Lazy Evaluation trong DB!
        const sampleStudents = studentsData.slice(0, 3);
        for (const student of sampleStudents) {
            const criteria = [
                { category: 'chuyen_can' as const, criterionKey: '1-1', label: 'CC', value: 30, maxValue: 30, deductions: [] },
                { category: 'y_thuc' as const, criterionKey: '2-1', label: 'YT', value: 25, maxValue: 30, deductions: [] },
                { category: 'chuyen_mon' as const, criterionKey: '3-1', label: 'CM', value: 35, maxValue: 40, deductions: [] },
            ];
            await dal.saveScore({
                studentId: student.id,
                weekKey,
                total: 90,
                criteria,
                notes: 'Auto-seeded sample'
            });
        }

        return { success: true, message: `Thành công! Đã tạo dữ liệu ${daysToSeed} ngày và 1 tuần thi đua.` };
    } catch (e) {
        console.error(e);
        return { success: false, error: (e as Error).message };
    }
}

function getWeekNumber(date: Date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

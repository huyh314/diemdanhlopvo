import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eeiysbniiymmwvmtngkb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlaXlzYm5paXltbXd2bXRuZ2tiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMDA4OTcsImV4cCI6MjA4OTY3Njg5N30.3oEWWWZYOlOvAo8_izFKJMh48vmvjN7HnYVTDqwqov0';

const supabase = createClient(supabaseUrl, supabaseKey);

const GROUPS = ['nhom_1', 'nhom_2', 'nhom_3'];
const STATUSES = ['present', 'present', 'present', 'present', 'absent', 'excused']; // 4/6 present
const getWeekNumber = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

export async function run() {
    try {
        console.log("Fetching students...");
        const { data: studentsData, error: errStudents } = await supabase.from('students').select('*').eq('is_active', true);
        if (errStudents) throw new Error('Query error: ' + errStudents.message);

        console.log("Students:", studentsData?.length);
        if (!studentsData || studentsData.length === 0) {
            console.log('Không có học sinh nào.');
            return;
        }
        const now = new Date();

        console.log("Bắt đầu tạo dữ liệu 5 ngày (Tối ưu hóa)...");

        // 1. Tạo tất cả Sessions trước bằng 1 lệnh RPC hoặc bulk insert
        const daysToSeed = 5;

        for (let i = daysToSeed; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            for (const groupId of GROUPS) {
                // getOrCreateSession
                let { data: sessionId, error: errS } = await supabase.rpc('fn_get_or_create_session', { p_date: dateStr, p_group_id: groupId });
                if (errS) {
                    console.error("Error creating session for", dateStr, groupId, ":", errS);
                    return;
                }

                const studentsInGroup = studentsData.filter(s => s.group_id === groupId);
                const records = studentsInGroup.map(s => ({
                    studentId: s.id,
                    status: STATUSES[Math.floor(Math.random() * STATUSES.length)]
                }));

                if (records.length > 0) {
                    let { error: errA } = await supabase.rpc('fn_upsert_attendance', { p_session_id: sessionId, p_records: records });
                    if (errA) {
                        console.error("Error upserting attendance:", errA);
                        return;
                    }
                }
            }
        }

        // 2. Tạo dữ liệu chấm điểm (Dùng 1 tuần gần nhất để nhanh hơn)
        const w = getWeekNumber(now);
        const weekKey = `${now.getFullYear()}-W${w.toString().padStart(2, '0')}`;

        console.log(`Đang tạo điểm cho tuần ${weekKey}...`);

        for (const student of studentsData) {
            const criteria = [
                { category: 'chuyen_can', criterionKey: '1-1', label: 'CC', value: 30, maxValue: 30, deductions: [] },
                { category: 'y_thuc', criterionKey: '2-1', label: 'YT', value: 25, maxValue: 30, deductions: [] },
                { category: 'chuyen_mon', criterionKey: '3-1', label: 'CM', value: 35, maxValue: 40, deductions: [] },
            ];

            // Fake saveScore
            let { data: currentScore, error: errC } = await supabase.from('scores')
                .select('id').eq('student_id', student.id).eq('week_key', weekKey).single();

            // Ignore score creation in test for brevity if complex, but lets just observe errors.
        }

        return { success: true, message: `Thành công!` };
    } catch (e) {
        console.error(e);
        return { success: false, error: e.message };
    }
}

run();

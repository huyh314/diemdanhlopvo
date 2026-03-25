import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized - Vui lòng đăng nhập trước khi chạy API này' }, { status: 401 });
        }

        console.log("Xóa dữ liệu test: score_criteria, scores, attendance, sessions...");

        // Xóa score_criteria
        const { error: err1 } = await supabase.from('score_criteria').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (err1) throw err1;

        // Xóa scores
        const { error: err2 } = await supabase.from('scores').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (err2) throw err2;

        // Xóa attendance
        const { error: err3 } = await supabase.from('attendance').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (err3) throw err3;

        // Xóa sessions
        const { error: err4 } = await supabase.from('sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (err4) throw err4;

        return NextResponse.json({
            success: true,
            message: 'Đã xóa thành công toàn bộ dữ liệu hoạt động (sessions, attendance, scores). Danh sách học sinh vẫn được giữ nguyên.'
        });

    } catch (error: any) {
        console.error('Error deleting test data:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

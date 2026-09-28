import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

const BUCKET = 'lesson-attachments';
const MAX_SIZE_BYTES = 50 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
    'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif',
    'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
};

// Issues a short-lived upload token. The browser sends the file directly to Supabase,
// avoiding Netlify's small buffered request limit for serverless functions.
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body: unknown = await req.json();
        if (!body || typeof body !== 'object') {
            return NextResponse.json({ error: 'Thông tin file không hợp lệ' }, { status: 400 });
        }
        const { contentType, size } = body as { contentType?: unknown; size?: unknown };
        if (typeof contentType !== 'string' || !ALLOWED_TYPES[contentType]) {
            return NextResponse.json({ error: 'Loại file không được hỗ trợ' }, { status: 400 });
        }
        if (typeof size !== 'number' || !Number.isFinite(size) || size <= 0 || size > MAX_SIZE_BYTES) {
            return NextResponse.json({ error: 'File phải nhỏ hơn hoặc bằng 50MB' }, { status: 400 });
        }

        const path = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${ALLOWED_TYPES[contentType]}`;
        const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(path);
        if (error || !data) {
            console.error('Create signed upload URL error:', error);
            return NextResponse.json({ error: 'Không thể chuẩn bị tải file lên' }, { status: 500 });
        }

        const url = `/api/media?bucket=${BUCKET}&path=${encodeURIComponent(path)}`;
        return NextResponse.json({ path, token: data.token, url });
    } catch (error) {
        console.error('Upload URL route error:', error);
        return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
    }
}

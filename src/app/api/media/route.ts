import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

const BUCKETS = new Set(['lesson-attachments', 'avatars']);
const SIGNED_URL_TTL_SECONDS = 60 * 60;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const AVATAR_PATH_PATTERN = /^[0-9a-f-]{36}-\d+\.[a-z0-9]{1,10}$/i;

export async function GET(request: NextRequest) {
    const supabase = await createClient();
    const bucket = request.nextUrl.searchParams.get('bucket') ?? 'lesson-attachments';
    const path = request.nextUrl.searchParams.get('path') ?? '';
    const segments = path.split('/');
    const isValidPath = bucket === 'avatars'
        ? AVATAR_PATH_PATTERN.test(path)
        : segments.length >= 2 && UUID_PATTERN.test(segments[0]) &&
            segments.every((segment) => segment && segment !== '.' && segment !== '..' && !segment.includes('\\'));
    if (!BUCKETS.has(bucket) || path.length > 512 || !isValidPath) {
        return NextResponse.json({ error: 'Đường dẫn file không hợp lệ' }, { status: 400 });
    }

    const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

    if (error || !data?.signedUrl) {
        return NextResponse.json({ error: 'Không tìm thấy file' }, { status: 404 });
    }

    const response = NextResponse.redirect(data.signedUrl);
    response.headers.set('Cache-Control', 'private, no-store');
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return response;
}

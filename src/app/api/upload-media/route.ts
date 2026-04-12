// =============================================
// API ROUTE: Upload Media lên Supabase Storage
// POST /api/upload-media
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

const BUCKET = 'lesson-attachments';
const MAX_SIZE_MB = 50; // Increased to 50MB for videos
const ALLOWED_TYPES = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/webm', 'video/quicktime',
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.ms-excel', // .xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // .xlsx
];

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();

        // Check auth
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Parse form data
        const formData = await req.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'Không tìm thấy file' }, { status: 400 });
        }

        // Validate type
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: 'Chỉ hỗ trợ Ảnh (JPG, PNG...), Video (MP4, MOV...) và Tài liệu (Word, Excel)' },
                { status: 400 }
            );
        }

        // Validate size
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
            return NextResponse.json(
                { error: `File không được vượt quá ${MAX_SIZE_MB}MB` },
                { status: 400 }
            );
        }

        // Build unique path
        const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
        const timestamp = Date.now();
        const random = Math.random().toString(36).slice(2, 8);
        const path = `${user.id}/${timestamp}-${random}.${ext}`;

        // Upload
        const arrayBuffer = await file.arrayBuffer();
        const { error: uploadError } = await supabase.storage
            .from(BUCKET)
            .upload(path, arrayBuffer, {
                contentType: file.type,
                cacheControl: '3600',
                upsert: false,
            });

        if (uploadError) {
            console.error('Upload error:', uploadError);
            return NextResponse.json(
                { error: 'Upload thất bại: ' + uploadError.message },
                { status: 500 }
            );
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from(BUCKET)
            .getPublicUrl(path);

        return NextResponse.json({ url: urlData.publicUrl, path });
    } catch (err) {
        console.error('Upload route error:', err);
        return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { path } = await req.json();
        if (!path) {
            return NextResponse.json({ error: 'Thiếu path' }, { status: 400 });
        }

        const { error } = await supabase.storage.from(BUCKET).remove([path]);
        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
    }
}

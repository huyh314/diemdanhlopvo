import { createClient } from '@/utils/supabase/client';

export async function uploadLessonMedia(file: File): Promise<{ url: string; path: string }> {
    const response = await fetch('/api/upload-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType: file.type, size: file.size }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error ?? 'Không thể chuẩn bị tải file lên');

    const supabase = createClient();
    const { error } = await supabase.storage
        .from('lesson-attachments')
        .uploadToSignedUrl(payload.path, payload.token, file, {
            contentType: file.type,
            cacheControl: '3600',
        });
    if (error) throw new Error(`Upload thất bại: ${error.message}`);
    return { url: payload.url, path: payload.path };
}

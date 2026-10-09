import { createClient } from '@/utils/supabase/client';
import { AVATAR_MAX_INPUT_BYTES, AVATAR_MAX_UPLOAD_BYTES } from './avatar';
import { prepareAvatarUploadAction, completeAvatarUploadAction } from './avatar.actions';
import { notifyStudentsChanged } from './students-events';

/** Decode on the device and upload a small, static JPEG instead of a full camera photo. */
export async function prepareAvatarImage(file: File): Promise<File> {
    if (!file.size) throw new Error('Ảnh trống. Vui lòng chọn ảnh khác.');
    if (file.size > AVATAR_MAX_INPUT_BYTES) throw new Error('Vui lòng chọn ảnh nhỏ hơn hoặc bằng 20 MB.');
    if (!/^image\/(jpeg|png|webp|gif|heic|heif)$/i.test(file.type) &&
        !(file.type === '' && /\.(jpe?g|png|webp|gif|heic|heif)$/i.test(file.name))) {
        throw new Error('Vui lòng chọn ảnh JPG, PNG, WebP, GIF hoặc HEIC.');
    }

    const source = URL.createObjectURL(file);
    try {
        const image = new Image();
        await new Promise<void>((resolve, reject) => {
            image.onload = () => resolve();
            image.onerror = () => reject(new Error('Không đọc được ảnh này. Với ảnh HEIC, hãy chuyển sang JPG hoặc chọn ảnh khác.'));
            image.src = source;
        });
        if (!image.naturalWidth || !image.naturalHeight) throw new Error('Ảnh không hợp lệ.');
        const scale = Math.min(1, 512 / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Trình duyệt không xử lý được ảnh. Vui lòng thử trình duyệt khác.');
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
        if (!blob || blob.size > AVATAR_MAX_UPLOAD_BYTES) throw new Error('Không thu nhỏ được ảnh. Vui lòng chọn ảnh khác.');
        return new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
    } finally {
        URL.revokeObjectURL(source);
    }
}

export async function uploadStudentAvatar(id: string, file: File): Promise<string> {
    const prepared = await prepareAvatarImage(file);
    const ticket = await prepareAvatarUploadAction(id, prepared.size);
    if (!ticket.success) throw new Error(ticket.error);

    const { error } = await createClient().storage.from('avatars')
        .uploadToSignedUrl(ticket.path, ticket.token, prepared, { contentType: 'image/jpeg', cacheControl: '3600' });
    if (error) throw new Error('Tải ảnh chưa thành công. Kiểm tra kết nối mạng rồi thử lại.');

    const saved = await completeAvatarUploadAction(id, ticket.path);
    if (!saved.success) throw new Error(saved.error);
    notifyStudentsChanged();
    return saved.url;
}

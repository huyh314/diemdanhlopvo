'use client';

import { useRef, useState } from 'react';
import { AVATAR_ACCEPT } from '@/lib/avatar';
import { mediaAccessUrl } from '@/lib/media-url';
import { useToast } from './Toast';

interface StudentAvatarProps {
    studentId: string;
    name: string;
    avatarUrl: string;
    size?: 'card' | 'profile';
}

export default function StudentAvatar({ studentId, name, avatarUrl, size = 'card' }: StudentAvatarProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const busyRef = useRef(false);
    const [isUploading, setIsUploading] = useState(false);
    const [localAvatar, setLocalAvatar] = useState<{ original: string; url: string } | null>(null);
    const [failedImage, setFailedImage] = useState<string | null>(null);
    const { toast } = useToast();
    const currentAvatar = localAvatar?.original === avatarUrl ? localAvatar.url : avatarUrl;
    const imageUrl = currentAvatar ? mediaAccessUrl(currentAvatar) : '';

    async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.currentTarget.files?.[0];
        event.currentTarget.value = '';
        if (!file || busyRef.current) return;
        busyRef.current = true;
        setIsUploading(true);
        try {
            const { uploadStudentAvatar } = await import('@/lib/avatar-upload');
            const url = await uploadStudentAvatar(studentId, file);
            setLocalAvatar({ original: avatarUrl, url });
            toast(`Đã cập nhật ảnh của ${name}`, 'success');
        } catch (error) {
            toast(error instanceof Error ? error.message : 'Không thể tải ảnh. Vui lòng thử lại.', 'error');
        } finally {
            busyRef.current = false;
            setIsUploading(false);
        }
    }

    return (
        <div className="flex shrink-0 flex-col items-center gap-1" aria-busy={isUploading}>
            <div className={`${size === 'profile' ? 'h-28 w-28 text-3xl' : 'h-24 w-24 text-2xl'} flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 font-bold text-white shadow-lg`}>
                {imageUrl && failedImage !== imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imageUrl} alt={name} width={size === 'profile' ? 112 : 96} height={size === 'profile' ? 112 : 96}
                        loading={size === 'profile' ? 'eager' : 'lazy'} decoding="async"
                        className="h-full w-full object-cover" onError={() => setFailedImage(imageUrl)} />
                ) : name.trim().split(/\s+/).map(word => word[0]).slice(-2).join('').toUpperCase()}
            </div>
            <input ref={inputRef} type="file" accept={AVATAR_ACCEPT} className="hidden" disabled={isUploading}
                aria-label={`Chọn ảnh đại diện cho ${name}`} onChange={handleFileChange} />
            <button type="button" disabled={isUploading} onClick={() => inputRef.current?.click()}
                aria-label={`Đổi ảnh đại diện của ${name}`}
                className="min-h-10 rounded-lg px-2 py-1 text-xs font-medium text-[var(--text-primary)] hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-[var(--accent-from)] disabled:opacity-60">
                <span aria-hidden="true">📷 </span>{isUploading ? 'Đang tải ảnh…' : currentAvatar ? 'Đổi ảnh' : 'Thêm ảnh'}
            </button>
        </div>
    );
}

export const AVATAR_MAX_INPUT_BYTES = 20 * 1024 * 1024;
export const AVATAR_MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
export const AVATAR_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,.heic,.heif';
export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
// Accept existing filenames as well as collision-resistant filenames from new uploads.
export const AVATAR_PATH_PATTERN = /^[0-9a-f-]{36}-\d+(?:-[0-9a-f-]{36})?\.(?:jpg|jpeg|png|webp|gif)$/i;

export function avatarMediaUrl(path: string) {
    return `/api/media?bucket=avatars&path=${encodeURIComponent(path)}`;
}

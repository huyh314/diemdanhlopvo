const PRIVATE_BUCKETS = ['lesson-attachments', 'avatars'] as const;

/** Route private Supabase media through the authenticated signed-URL endpoint. */
export function mediaAccessUrl(reference: string): string {
    if (reference.startsWith('/api/media?')) return reference;

    try {
        const url = new URL(reference);
        for (const bucket of PRIVATE_BUCKETS) {
            const publicPath = `/storage/v1/object/public/${bucket}/`;
            const markerIndex = url.pathname.indexOf(publicPath);
            if (markerIndex < 0) continue;

            const encodedPath = url.pathname.slice(markerIndex + publicPath.length);
            const path = decodeURIComponent(encodedPath);
            if (!path) return reference;

            return `/api/media?bucket=${bucket}&path=${encodeURIComponent(path)}`;
        }
        return reference;
    } catch {
        return reference;
    }
}

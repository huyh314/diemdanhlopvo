// =============================================
// GLOBAL ERROR BOUNDARY
// =============================================

'use client';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4 font-sans text-[var(--text-primary)]">
            <div className="glass rounded-3xl p-8 md:p-10 border border-[var(--glass-border)] shadow-[0_30px_60px_rgba(0,0,0,0.5)] max-w-md text-center">
                <div className="text-5xl mb-4">⚠️</div>
                <h2 className="text-xl font-bold mb-2">Có lỗi xảy ra</h2>
                <p className="text-gray-400 text-sm mb-6">
                    {error.message || 'Không thể tải trang. Vui lòng thử lại.'}
                </p>
                <button
                    onClick={reset}
                    className="px-6 py-3 bg-gradient-to-br from-[var(--accent-from)] to-[var(--accent-to)] text-white shadow-[0_4px_20px_rgba(var(--accent-rgb-from),0.4)] hover:shadow-[0_8px_30px_rgba(var(--accent-rgb-from),0.6)] hover:brightness-110 rounded-xl font-semibold transition"
                >
                    Thử lại
                </button>
            </div>
        </div>
    );
}

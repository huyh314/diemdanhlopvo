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
        <html>
            <body className="min-h-screen bg-gray-900 flex items-center justify-center p-4 text-white font-sans">
                <div className="max-w-md text-center">
                    <div className="text-5xl mb-4">⚠️</div>
                    <h2 className="text-xl font-bold mb-2">Có lỗi xảy ra</h2>
                    <p className="text-gray-400 text-sm mb-6">
                        {error.message || 'Không thể tải trang. Vui lòng thử lại.'}
                    </p>
                    <button
                        onClick={reset}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-semibold transition"
                    >
                        Thử lại
                    </button>
                </div>
            </body>
        </html>
    );
}

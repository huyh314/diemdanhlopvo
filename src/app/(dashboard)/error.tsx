'use client';

import { useEffect } from 'react';
import { Card, Button } from '@/components/ui';

export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service in real life
        console.error('Dashboard Error Boundary caught:', error);
    }, [error]);

    return (
        <div className="flex h-[70vh] items-center justify-center p-4">
            <Card variant="glass" className="max-w-md w-full text-center space-y-6 p-8 border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.1)]">
                <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                    <span className="text-2xl">⚠️</span>
                </div>

                <div className="space-y-2">
                    <h2 className="text-xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                        Đã Xảy Ra Lỗi Bất Ngờ
                    </h2>
                    <p className="text-sm text-[var(--text-muted)] italic">
                        {error.message || 'Hệ thống gặp sự cố khi tải dữ liệu. Vui lòng thử lại sau.'}
                    </p>
                </div>

                <div className="pt-2">
                    <Button
                        variant="primary"
                        onClick={() => reset()}
                        className="w-full bg-gradient-to-r from-red-600/80 to-rose-500/80 hover:from-red-600 hover:to-rose-500 border-red-500/30"
                    >
                        🔄 Thử Lại
                    </Button>
                </div>
            </Card>
        </div>
    );
}

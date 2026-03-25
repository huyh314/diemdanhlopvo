'use client';

import { useEffect, useRef } from 'react';
import { Button } from './ui';

interface ReportPreviewModalProps {
    title: string;
    onDownload: () => void;
    onClose: () => void;
    isDownloading?: boolean;
    downloadLabel?: string;
    children: React.ReactNode;
}

export default function ReportPreviewModal({
    title,
    onDownload,
    onClose,
    isDownloading = false,
    downloadLabel = '⬇️ Tải về',
    children,
}: ReportPreviewModalProps) {
    const backdropRef = useRef<HTMLDivElement>(null);

    // Close on Escape key
    useEffect(() => {
        function handleKey(e: KeyboardEvent) {
            if (e.key === 'Escape') onClose();
        }
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [onClose]);

    // Prevent body scroll while modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    function handleBackdropClick(e: React.MouseEvent) {
        if (e.target === backdropRef.current) onClose();
    }

    return (
        <div
            ref={backdropRef}
            onClick={handleBackdropClick}
            className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 bg-black/70 backdrop-blur-sm"
        >
            <div className="relative w-full max-w-5xl max-h-[85vh] flex flex-col rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-primary)] shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] shrink-0">
                    <h2 className="text-lg font-bold">{title}</h2>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={onDownload}
                            disabled={isDownloading}
                            loading={isDownloading}
                            className="gap-2"
                        >
                            {isDownloading ? 'Đang xuất...' : downloadLabel}
                        </Button>
                        <button
                            onClick={onClose}
                            aria-label="Đóng"
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-white/10 hover:text-white transition text-lg"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Content — scrollable */}
                <div className="overflow-y-auto flex-1 p-6">
                    {children}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-3 border-t border-[var(--border-primary)] bg-[var(--bg-secondary)] shrink-0 text-xs text-[var(--text-muted)]">
                    <span>Nhấn Esc hoặc click bên ngoài để đóng</span>
                    <Button variant="ghost" size="sm" onClick={onDownload} disabled={isDownloading} loading={isDownloading}>
                        {isDownloading ? 'Đang xuất...' : downloadLabel}
                    </Button>
                </div>
            </div>
        </div>
    );
}

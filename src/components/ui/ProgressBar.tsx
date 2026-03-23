'use client';

// =============================================
// PROGRESS BAR — Shared UI Component
// =============================================

type ProgressVariant = 'default' | 'success' | 'warning' | 'danger';

interface ProgressBarProps {
    value: number;       // 0-100
    variant?: ProgressVariant;
    height?: string;     // Tailwind height class, e.g. 'h-2'
    className?: string;
}

const FILL_CLASSES: Record<ProgressVariant, string> = {
    default: 'bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)]',
    success: 'bg-gradient-to-r from-emerald-500 to-emerald-400',
    warning: 'bg-gradient-to-r from-amber-500 to-yellow-400',
    danger: 'bg-gradient-to-r from-red-500 to-red-400',
};

export default function ProgressBar({
    value,
    variant = 'default',
    height = 'h-2',
    className = '',
}: ProgressBarProps) {
    const clamped = Math.max(0, Math.min(100, value));

    return (
        <div className={`w-full ${height} bg-[var(--bg-tertiary)] rounded-full overflow-hidden ${className}`}>
            <div
                className={`h-full rounded-full transition-[width] duration-600 ease-[cubic-bezier(0.4,0,0.2,1)] ${FILL_CLASSES[variant]}`}
                style={{ width: `${clamped}%` }}
            />
        </div>
    );
}

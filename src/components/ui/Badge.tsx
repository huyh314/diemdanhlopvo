'use client';

import { type ReactNode } from 'react';

// =============================================
// BADGE — Shared UI Component
// =============================================

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'gold' | 'silver' | 'bronze';

interface BadgeProps {
    variant?: BadgeVariant;
    children: ReactNode;
    className?: string;
}

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
    success:
        'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 backdrop-blur-md shadow-[0_4px_10px_rgba(16,185,129,0.15)]',
    warning:
        'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 backdrop-blur-md shadow-[0_4px_10px_rgba(234,179,8,0.15)]',
    danger:
        'bg-red-500/10 text-red-400 border border-red-500/20 backdrop-blur-md shadow-[0_4px_10px_rgba(239,68,68,0.15)]',
    info:
        'bg-[rgba(var(--accent-rgb-from),0.1)] text-[var(--accent-from)] border border-[rgba(var(--accent-rgb-from),0.2)] backdrop-blur-md shadow-[0_4px_10px_rgba(var(--accent-rgb-from),0.2)]',
    gold:
        'bg-gradient-to-br from-yellow-400/20 to-orange-400/10 text-yellow-300 border border-yellow-400/30 backdrop-blur-md shadow-[0_4px_10px_rgba(250,204,21,0.2)]',
    silver:
        'bg-slate-400/10 text-slate-300 border border-slate-400/20 backdrop-blur-md shadow-[0_4px_10px_rgba(148,163,184,0.15)]',
    bronze:
        'bg-amber-700/15 text-amber-500 border border-amber-700/20 backdrop-blur-md shadow-[0_4px_10px_rgba(180,83,9,0.15)]',
};

export default function Badge({ variant = 'info', className = '', children }: BadgeProps) {
    return (
        <span
            className={`
                inline-flex items-center gap-1.5 px-2.5 py-0.5
                rounded-full text-[11px] font-bold tracking-wide leading-none
                ${VARIANT_CLASSES[variant]}
                ${className}
            `}
        >
            {children}
        </span>
    );
}

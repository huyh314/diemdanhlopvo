'use client';

import { type ButtonHTMLAttributes, type ReactNode } from 'react';

// =============================================
// BUTTON — Shared UI Component
// =============================================

type ButtonVariant = 'primary' | 'danger' | 'success' | 'ghost' | 'icon';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    children: ReactNode;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
    primary:
        'bg-gradient-to-br from-[var(--accent-from)] to-[var(--accent-to)] text-white shadow-[0_4px_15px_rgba(var(--accent-rgb-from),0.35)] hover:shadow-[0_6px_20px_rgba(var(--accent-rgb-from),0.5)] hover:brightness-110',
    danger:
        'bg-gradient-to-br from-red-500 to-red-700 text-white shadow-[0_4px_15px_rgba(239,68,68,0.3)] hover:shadow-[0_6px_20px_rgba(239,68,68,0.5)]',
    success:
        'bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-[0_4px_15px_rgba(16,185,129,0.3)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.5)]',
    ghost:
        'bg-transparent text-[var(--text-secondary)] border border-[var(--border-primary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]',
    icon:
        'bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] !p-2',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
    sm: 'px-3.5 py-1.5 text-xs rounded-lg gap-1',
    md: 'px-5 py-2.5 text-sm rounded-xl gap-1.5',
    lg: 'px-7 py-3.5 text-base rounded-2xl gap-2',
};

export default function Button({
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled,
    className = '',
    children,
    ...rest
}: ButtonProps) {
    return (
        <button
            disabled={disabled || loading}
            className={`
                relative inline-flex items-center justify-center font-semibold
                border border-transparent cursor-pointer select-none overflow-hidden
                transition-all duration-[var(--transition-normal)] ease-out
                hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.95]
                disabled:opacity-50 disabled:pointer-events-none disabled:hover:transform-none
                whitespace-nowrap z-10
                before:absolute before:inset-0 before:opacity-0 before:transition-opacity before:duration-500 hover:before:opacity-100 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:-translate-x-full hover:before:animate-[shimmer_1.5s_infinite]
                ${VARIANT_CLASSES[variant]}
                ${SIZE_CLASSES[size]}
                ${className}
            `}
            {...rest}
        >
            {loading && <span className="animate-spin mr-1">⏳</span>}
            <span className="relative z-10 flex items-center gap-inherit">{children}</span>
        </button>
    );
}

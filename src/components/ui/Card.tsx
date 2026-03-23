'use client';

import { type HTMLAttributes, type ReactNode } from 'react';

// =============================================
// CARD — Shared UI Component
// =============================================

type CardVariant = 'default' | 'glass' | 'stat' | 'kpi';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: CardVariant;
    children: ReactNode;
    /** For stat card: accent stripe color override */
    accentGradient?: string;
}

const VARIANT_CLASSES: Record<CardVariant, string> = {
    default:
        'bg-[var(--bg-card)] border border-[var(--border-secondary)] rounded-2xl p-5 backdrop-blur-xl transition-all duration-[var(--transition-normal)] ease-out hover:bg-[var(--bg-card-hover)] hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.2)]',
    glass:
        'bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] border border-[var(--glass-border)] rounded-2xl p-5 shadow-[var(--glass-shadow)] transition-all duration-[var(--transition-normal)] ease-out hover:-translate-y-1.5 hover:shadow-[0_40px_80px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] relative overflow-hidden',
    stat:
        'bg-[var(--bg-card)] border border-[var(--border-secondary)] rounded-2xl p-4 backdrop-blur-xl relative overflow-hidden transition-all duration-[var(--transition-normal)] ease-out hover:-translate-y-1 hover:shadow-[0_15px_30px_rgba(0,0,0,0.2)]',
    kpi:
        'bg-gradient-to-br from-[rgba(var(--accent-rgb-from),0.08)] to-[rgba(var(--accent-rgb-to),0.03)] border border-[rgba(var(--accent-rgb-from),0.15)] rounded-2xl p-6 relative overflow-hidden transition-all duration-[var(--transition-normal)] ease-out hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(var(--accent-rgb-from),0.15)]',
};

export default function Card({
    variant = 'default',
    accentGradient,
    className = '',
    children,
    ...rest
}: CardProps) {
    return (
        <div className={`${VARIANT_CLASSES[variant]} ${className}`} {...rest}>
            {/* Top accent bar for stat cards */}
            {variant === 'stat' && (
                <div
                    className="absolute top-0 left-0 right-0 h-[3px] opacity-80"
                    style={{
                        background: accentGradient || 'linear-gradient(to right, var(--accent-from), var(--accent-to))',
                    }}
                />
            )}

            {/* Decorative glow for KPI cards */}
            {variant === 'kpi' && (
                <div className="absolute -top-[30%] -right-[20%] w-[120px] h-[120px] rounded-full bg-[radial-gradient(circle,rgba(var(--accent-rgb-from),0.15),transparent_70%)] pointer-events-none" />
            )}

            {children}
        </div>
    );
}

// =============================================
// STAT HELPERS
// =============================================

export function StatValue({ children, className = '' }: { children: ReactNode; className?: string }) {
    return (
        <div className={`text-2xl font-extrabold leading-none tabular-nums text-[var(--text-primary)] ${className}`}>
            {children}
        </div>
    );
}

export function StatLabel({ children, className = '' }: { children: ReactNode; className?: string }) {
    return (
        <div className={`text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mt-1 ${className}`}>
            {children}
        </div>
    );
}

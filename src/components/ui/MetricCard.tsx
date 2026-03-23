import React from 'react';
import Card from './Card';

interface MetricCardProps {
    title: string;
    value: string | number;
    trend?: {
        value: number;
        label: string;
        direction?: 'up' | 'down' | 'neutral';
    };
    icon?: React.ReactNode;
    status?: 'success' | 'warning' | 'danger' | 'neutral';
    className?: string;
}

export function MetricCard({ title, value, trend, icon, status = 'neutral', className = '' }: MetricCardProps) {
    const statusColors = {
        success: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
        warning: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
        danger: 'text-rose-400 bg-rose-400/10 border-rose-400/20',
        neutral: 'text-sky-400 bg-sky-400/10 border-sky-400/20',
    };

    const getTrendColor = (val: number, dir?: 'up' | 'down' | 'neutral') => {
        if (dir === 'neutral' || val === 0) return 'text-gray-400';
        if (dir === 'up') return val > 0 ? 'text-emerald-400' : 'text-rose-400';
        if (dir === 'down') return val < 0 ? 'text-emerald-400' : 'text-rose-400';
        return val > 0 ? 'text-emerald-400' : 'text-rose-400';
    };

    const getTrendIcon = (val: number) => {
        if (val > 0) return '▲';
        if (val < 0) return '▼';
        return '−';
    };

    return (
        <Card className={`relative overflow-hidden group ${className}`}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-white/5 to-transparent rounded-bl-full -mr-4 -mt-4 opacity-50 pointer-events-none" />
            <div className="p-5 flex flex-col h-full justify-between gap-4 relative z-10">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm font-semibold tracking-wider text-[var(--text-muted)] uppercase mb-1">{title}</p>
                        <h4 className={`text-3xl font-bold tracking-tight drop-shadow-sm ${statusColors[status].split(' ')[0]}`}>
                            {value}
                        </h4>
                    </div>
                    {icon && (
                        <div className={`p-3 rounded-xl shadow-inner border backdrop-blur-md ${statusColors[status]}`}>
                            {icon}
                        </div>
                    )}
                </div>

                {trend && (
                    <div className="flex items-center gap-2 text-sm mt-auto pt-2 border-t border-[var(--border-primary)]">
                        <span className={`font-semibold shrink-0 flex items-center gap-1 ${getTrendColor(trend.value, trend.direction)}`}>
                            {getTrendIcon(trend.value)} {Math.abs(trend.value)}%
                        </span>
                        <span className="text-[var(--text-muted)] truncate" title={trend.label}>{trend.label}</span>
                    </div>
                )}
            </div>
        </Card>
    );
}

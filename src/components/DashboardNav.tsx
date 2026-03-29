'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeSwitcher from './ThemeSwitcher';
import AddStudentModal from './AddStudentModal';
import { Button } from './ui';

import { useSoundEffects } from '@/hooks/useSoundEffects';

// =============================================
// DASHBOARD NAV — Client Component for interactivity
// =============================================

const NAV_ITEMS = [
    { href: '/attendance', icon: '📋', label: 'Điểm Danh' },
    { href: '/rankings', icon: '🏆', label: 'Xếp Hạng' },
    { href: '/students', icon: '👥', label: 'Học Sinh' },
];

export default function DashboardNav() {
    const pathname = usePathname();
    const [showAddModal, setShowAddModal] = useState(false);
    const { playClick } = useSoundEffects();

    return (
        <>
            <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[var(--glass-bg)] border-b border-[var(--glass-border)]">
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                    {/* Logo */}
                    <div>
                        <h1 className="text-lg font-bold bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)] bg-clip-text text-transparent">
                            Võ Đường Phan Phu Tiên
                        </h1>
                        <p className="text-xs text-[var(--text-tertiary)] font-mono">
                            {new Date().toLocaleDateString('vi-VN', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'numeric',
                                year: 'numeric',
                            })}
                        </p>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-2">
                        {/* Nav Links */}
                        {NAV_ITEMS.map((item) => {
                            const isActive = pathname.startsWith(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    prefetch={true}
                                    onClick={playClick}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${isActive
                                        ? 'bg-[rgba(var(--accent-rgb-from),0.2)] text-[var(--accent-from)] border border-[rgba(var(--accent-rgb-from),0.3)]'
                                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/10'
                                        }`}
                                >
                                    <span>{item.icon}</span>
                                    <span className="hidden md:inline">{item.label}</span>
                                </Link>
                            );
                        })}

                        {/* Divider */}
                        <div className="w-px h-6 bg-[var(--border-primary)] mx-1" />

                        {/* Add Student */}
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setShowAddModal(true)}
                            className="!w-10 !h-10 !p-0 !rounded-lg"
                            title="Thêm học sinh"
                        >
                            <span className="text-xl">+</span>
                        </Button>

                        {/* Theme Switcher */}
                        <ThemeSwitcher />
                    </div>
                </div>
            </nav>

            {/* Add Student Modal */}
            {showAddModal && (
                <AddStudentModal onClose={() => setShowAddModal(false)} />
            )}
        </>
    );
}

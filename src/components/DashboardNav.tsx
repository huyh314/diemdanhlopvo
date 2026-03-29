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
                        {/* Nav Links (Desktop) */}
                        <div className="hidden md:flex items-center gap-2">
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
                                        <span>{item.label}</span>
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Divider */}
                        <div className="hidden md:block w-px h-6 bg-[var(--border-primary)] mx-1" />

                        {/* Add Student (Desktop) */}
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setShowAddModal(true)}
                            className="hidden md:flex !w-10 !h-10 !p-0 !rounded-lg items-center justify-center font-bold"
                            title="Thêm học sinh"
                        >
                            <span className="text-xl leading-none">+</span>
                        </Button>

                        <div className="hidden md:block w-px h-6 bg-[var(--border-primary)] mx-1" />

                        {/* Theme Switcher (Both) */}
                        <ThemeSwitcher />
                    </div>
                </div>
            </nav>

            {/* Mobile Bottom Navigation Bar */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--glass-bg)]/95 border-t border-[var(--glass-border)] backdrop-blur-2xl pb-[env(safe-area-inset-bottom)] shadow-[0_-15px_40px_rgba(0,0,0,0.6)]">
                <div className="flex items-center justify-between px-6 min-h-[70px] relative max-w-md mx-auto">
                    {/* Left Set */}
                    <div className="flex items-center justify-around w-2/5">
                        <Link
                            href={NAV_ITEMS[0].href}
                            onClick={playClick}
                            className={`flex flex-col items-center justify-center gap-1.5 transition-all ${pathname.startsWith(NAV_ITEMS[0].href) ? 'text-[var(--accent-from)] -translate-y-1' : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'}`}
                        >
                            <span className="text-2xl drop-shadow-md leading-none">{NAV_ITEMS[0].icon}</span>
                            <span className="text-[10px] font-bold tracking-wider leading-none whitespace-nowrap">Điểm Danh</span>
                        </Link>
                        
                        <Link
                            href={NAV_ITEMS[1].href}
                            onClick={playClick}
                            className={`flex flex-col items-center justify-center gap-1.5 transition-all ${pathname.startsWith(NAV_ITEMS[1].href) ? 'text-[var(--accent-from)] -translate-y-1' : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'}`}
                        >
                            <span className="text-2xl drop-shadow-md leading-none">{NAV_ITEMS[1].icon}</span>
                            <span className="text-[10px] font-bold tracking-wider leading-none whitespace-nowrap">Xếp Hạng</span>
                        </Link>
                    </div>

                    {/* Center Floating Action Button (FAB) */}
                    <div className="absolute left-1/2 -translate-x-1/2 -top-7">
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="w-[60px] h-[60px] rounded-full bg-gradient-to-br from-[var(--accent-from)] to-[var(--accent-to)] shadow-[0_8px_25px_rgba(var(--accent-rgb-from),0.6)] flex items-center justify-center text-white border-[5px] border-[#0a0f1c] transform-gpu transition-all duration-300 hover:scale-105 active:scale-95 group"
                        >
                            <span className="text-3xl font-light drop-shadow-md group-hover:rotate-90 transition-transform duration-300 leading-none pb-1">+</span>
                        </button>
                    </div>

                    {/* Right Set */}
                    <div className="flex items-center justify-around w-2/5">
                        <Link
                            href={NAV_ITEMS[2].href}
                            onClick={playClick}
                            className={`flex flex-col items-center justify-center gap-1.5 transition-all ${pathname.startsWith(NAV_ITEMS[2].href) ? 'text-[var(--accent-from)] -translate-y-1' : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'}`}
                        >
                            <span className="text-2xl drop-shadow-md leading-none">{NAV_ITEMS[2].icon}</span>
                            <span className="text-[10px] font-bold tracking-wider leading-none whitespace-nowrap">Học Sinh</span>
                        </Link>
                        
                        {/* Fake placeholder to maintain space balancing */}
                        <div className="flex flex-col items-center justify-center gap-1.5 opacity-0 pointer-events-none w-10">
                            <span className="text-2xl leading-none">⚙️</span>
                            <span className="text-[10px] leading-none">Cài Đặt</span>
                        </div>
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

'use client';

import { useState, useEffect } from 'react';
import { Modal, Button } from './ui';

// =============================================
// THEME SWITCHER — 8 themes matching original app
// =============================================

const THEMES = [
    { id: 'default', label: 'Dark Blue', preview: 'from-sky-500 to-indigo-500' },
    { id: 'dark-purple', label: 'Dark Purple', preview: 'from-purple-500 to-pink-500' },
    { id: 'dark-green', label: 'Dark Green', preview: 'from-emerald-500 to-teal-500' },
    { id: 'dark-red', label: 'Dark Red', preview: 'from-red-500 to-orange-500' },
    { id: 'light-blue', label: 'Light Blue', preview: 'from-sky-300 to-indigo-300' },
    { id: 'light-purple', label: 'Light Purple', preview: 'from-purple-300 to-pink-300' },
    { id: 'light-green', label: 'Light Green', preview: 'from-emerald-300 to-teal-300' },
    { id: 'light-red', label: 'Light Red', preview: 'from-red-300 to-orange-300' },
];

export default function ThemeSwitcher() {
    const [isOpen, setIsOpen] = useState(false);
    const [currentTheme, setCurrentTheme] = useState('default');

    useEffect(() => {
        const saved = localStorage.getItem('vd-theme') || 'default';
        setCurrentTheme(saved);
        applyTheme(saved);
    }, []);

    function applyTheme(themeId: string) {
        const html = document.documentElement;
        if (themeId === 'default') {
            html.removeAttribute('data-theme');
        } else {
            html.setAttribute('data-theme', themeId);
        }
    }

    function selectTheme(themeId: string) {
        setCurrentTheme(themeId);
        applyTheme(themeId);
        localStorage.setItem('vd-theme', themeId);
        setIsOpen(false);
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="w-10 h-10 rounded-lg bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)] hover:brightness-110 flex items-center justify-center text-white transition shadow-lg hover:scale-105 active:scale-95"
                title="Đổi giao diện"
                aria-label="Đổi giao diện"
            >
                🎨
            </button>

            <Modal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                title="Chọn Giao Diện"
                icon="🎨"
                maxWidth="max-w-sm"
            >
                <div className="grid grid-cols-2 gap-3">
                    {THEMES.map((theme) => (
                        <button
                            key={theme.id}
                            onClick={() => selectTheme(theme.id)}
                            aria-label={`Chọn giao diện ${theme.label}`}
                            className={`p-3 rounded-xl border transition hover:scale-[1.03] active:scale-95 ${currentTheme === theme.id
                                ? 'border-[var(--accent-from)] bg-[rgba(var(--accent-rgb-from),0.1)] ring-2 ring-[rgba(var(--accent-rgb-from),0.3)]'
                                : 'border-[var(--border-primary)] bg-[var(--bg-primary)] hover:border-[var(--border-primary)]'
                                }`}
                        >
                            <div className={`h-8 rounded-lg bg-gradient-to-r ${theme.preview} mb-2`} />
                            <div className="text-xs font-medium text-[var(--text-secondary)]">{theme.label}</div>
                        </button>
                    ))}
                </div>

                <Button variant="ghost" onClick={() => setIsOpen(false)} className="w-full mt-4">
                    Đóng
                </Button>
            </Modal>
        </>
    );
}

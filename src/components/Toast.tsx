'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

// =============================================
// Toast System — animations now in globals.css
// =============================================

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastContextValue {
    toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => { } });

export function useToast() {
    return useContext(ToastContext);
}

let toastId = 0;

const TYPE_CLASSES: Record<ToastType, string> = {
    success: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    error: 'bg-red-500/20 text-red-300 border-red-500/30',
    warning: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    info: 'bg-[rgba(var(--accent-rgb-from),0.2)] text-[var(--accent-from)] border-[rgba(var(--accent-rgb-from),0.3)]',
};

const TYPE_ICONS: Record<ToastType, string> = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
};

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const toast = useCallback((message: string, type: ToastType = 'success') => {
        const id = ++toastId;
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
    }, []);

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            {/* Toast Container */}
            <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className={`pointer-events-auto px-4 py-3 rounded-xl text-sm font-medium shadow-2xl backdrop-blur-xl border animate-slide-in ${TYPE_CLASSES[t.type]}`}
                    >
                        <span className="mr-2">{TYPE_ICONS[t.type]}</span>
                        {t.message}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

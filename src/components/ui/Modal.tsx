'use client';

import { type ReactNode, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

// =============================================
// MODAL — Shared UI Component
// =============================================

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    icon?: string;
    children: ReactNode;
    footer?: ReactNode;
    maxWidth?: string;          // Tailwind max-w class, e.g. 'max-w-sm'
    className?: string;         // Extra classes on the content pane
}

export default function Modal({
    isOpen,
    onClose,
    title,
    icon,
    children,
    footer,
    maxWidth = 'max-w-md',
    className = '',
}: ModalProps) {
    const overlayRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        if (!isOpen) return;
        
        gsap.set(overlayRef.current, { backgroundColor: 'rgba(0,0,0,0)', backdropFilter: 'blur(0px)' });
        gsap.set(contentRef.current, { opacity: 0, scale: 0.95, y: 20 });
        
        gsap.to(overlayRef.current, {
            backgroundColor: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(8px)',
            duration: 0.4,
            ease: 'power2.out',
        });
        
        gsap.to(contentRef.current, {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.5,
            ease: 'back.out(1.2)',
            delay: 0.05
        });
    }, [isOpen]);

    // Close on Escape
    useEffect(() => {
        if (!isOpen) return;
        function handleKey(e: KeyboardEvent) {
            if (e.key === 'Escape') onClose();
        }
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            ref={overlayRef}
            className="fixed inset-0 z-50 flex items-center justify-center"
            onClick={onClose}
        >
            <div
                ref={contentRef}
                className={`
                    bg-[var(--glass-bg)] border border-[var(--glass-border)]
                    rounded-3xl p-6 w-[calc(100%-2rem)] sm:w-full shadow-[var(--glass-shadow)]
                    max-h-[85vh] sm:max-h-[90vh] overflow-y-auto backdrop-blur-[var(--glass-blur)]
                    transform-gpu mx-4 sm:mx-auto
                    ${maxWidth}
                    ${className}
                `}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                {title && (
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold flex items-center gap-2 text-[var(--text-primary)]">
                            {icon && <span className="text-xl">{icon}</span>}
                            {title}
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--bg-tertiary)]"
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* Body */}
                {children}

                {/* Footer */}
                {footer && (
                    <div className="flex gap-2 justify-end mt-6 pt-4 border-t border-[var(--border-secondary)]">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}

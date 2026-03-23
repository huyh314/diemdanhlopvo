'use client';

import { type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes, type ReactNode } from 'react';

// =============================================
// INPUT, SELECT, TEXTAREA — Shared UI Components
// =============================================

const BASE_INPUT =
    'w-full px-3.5 py-2.5 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] text-sm transition-all duration-200 outline-none focus:border-[var(--accent-from)] focus:shadow-[0_0_0_3px_rgba(var(--accent-rgb-from),0.15)] placeholder:text-[var(--text-tertiary)]';

// --- Input ---
interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}

export function InputField({ label, className = '', id, ...rest }: InputFieldProps) {
    const inputId = id || `input-${label?.replace(/\s/g, '-').toLowerCase()}`;
    return (
        <div>
            {label && (
                <label
                    htmlFor={inputId}
                    className="block text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1.5"
                >
                    {label}
                </label>
            )}
            <input id={inputId} className={`${BASE_INPUT} ${className}`} {...rest} />
        </div>
    );
}

// --- Select ---
interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    children: ReactNode;
}

export function SelectField({ label, className = '', id, children, ...rest }: SelectFieldProps) {
    const selectId = id || `select-${label?.replace(/\s/g, '-').toLowerCase()}`;
    return (
        <div>
            {label && (
                <label
                    htmlFor={selectId}
                    className="block text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1.5"
                >
                    {label}
                </label>
            )}
            <select id={selectId} className={`${BASE_INPUT} ${className}`} {...rest}>
                {children}
            </select>
        </div>
    );
}

// --- Textarea ---
interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
}

export function TextAreaField({ label, className = '', id, ...rest }: TextAreaFieldProps) {
    const textareaId = id || `textarea-${label?.replace(/\s/g, '-').toLowerCase()}`;
    return (
        <div>
            {label && (
                <label
                    htmlFor={textareaId}
                    className="block text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1.5"
                >
                    {label}
                </label>
            )}
            <textarea id={textareaId} className={`${BASE_INPUT} resize-y ${className}`} {...rest} />
        </div>
    );
}

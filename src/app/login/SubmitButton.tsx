'use client';

import { useFormStatus } from 'react-dom';

// =============================================
// SUBMIT BUTTON — Login Form with Loading State
// =============================================

export default function SubmitButton({
    children,
    className = '',
    formAction,
}: {
    children: React.ReactNode;
    className?: string;
    formAction?: (formData: FormData) => void;
}) {
    const { pending } = useFormStatus();

    return (
        <button
            formAction={formAction}
            disabled={pending}
            className={`
                relative inline-flex items-center justify-center font-semibold
                py-3.5 px-6 rounded-xl transition-all duration-300 ease-out
                disabled:opacity-60 disabled:pointer-events-none
                hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.97]
                overflow-hidden cursor-pointer
                ${className}
            `}
        >
            {pending && (
                <span className="absolute inset-0 flex items-center justify-center bg-inherit rounded-xl">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </span>
            )}
            <span className={pending ? 'invisible' : ''}>{children}</span>
        </button>
    );
}

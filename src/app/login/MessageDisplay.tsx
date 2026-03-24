'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function MessageContent() {
    const searchParams = useSearchParams();
    const message = searchParams.get('message');

    if (!message) return null;

    return (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center backdrop-blur-sm animate-fade-in">
            <span className="font-semibold">⚠️ </span>
            {message}
        </div>
    );
}

export default function MessageDisplay() {
    return (
        <Suspense fallback={null}>
            <MessageContent />
        </Suspense>
    );
}

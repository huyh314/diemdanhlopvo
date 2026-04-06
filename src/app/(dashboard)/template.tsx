'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { useRef } from 'react';

export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
    const containerRef = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        gsap.fromTo(containerRef.current, 
            { opacity: 0, y: 15 },
            { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out', clearProps: 'all' }
        );
    }, { scope: containerRef });

    return (
        <div ref={containerRef} className="opacity-0 dashboard-page-transition min-h-full w-full">
            {children}
        </div>
    );
}

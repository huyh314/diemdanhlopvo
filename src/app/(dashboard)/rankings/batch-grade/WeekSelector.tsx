'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';

export default function WeekSelector({ currentWeek }: { currentWeek: string }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const val = e.target.value;
        if (!val) return;
        
        const params = new URLSearchParams(searchParams);
        params.set('week', val);
        router.push(`${pathname}?${params.toString()}`);
    }

    return (
        <div className="flex items-center gap-2 mt-1">
            <label className="text-xs text-gray-400 font-medium">Tuần:</label>
            <input 
                type="week" 
                value={currentWeek}
                onChange={handleChange}
                className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-[var(--gold)]/50 transition"
            />
        </div>
    );
}

'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback, useTransition } from 'react';
import { InputField } from '@/components/ui';

interface DateSelectorProps {
    defaultDate: string;
}

export default function DateSelector({ defaultDate }: DateSelectorProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    // Lấy ngày đang được chọn trên URL, nếu không có thì lấy defaultDate (hôm nay)
    const selectedDate = searchParams.get('date') || defaultDate;

    // Khi người dùng chọn ngày mới
    const handleDateChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const newDate = e.target.value;
            if (!newDate) return;

            // Cập nhật search params
            const params = new URLSearchParams(searchParams);
            params.set('date', newDate);

            // Navigate với transition để có UI mượt
            startTransition(() => {
                router.push(`${pathname}?${params.toString()}`);
            });
        },
        [pathname, router, searchParams]
    );

    return (
        <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--text-muted)] font-medium">Ngày:</span>
            <div className={`relative transition-opacity ${isPending ? 'opacity-50' : 'opacity-100'}`}>
                <InputField
                    type="date"
                    value={selectedDate}
                    onChange={handleDateChange}
                    className="w-auto py-1.5 px-3 text-sm rounded-lg"
                    disabled={isPending}
                    aria-label="Chọn ngày điểm danh"
                />
            </div>
        </div>
    );
}

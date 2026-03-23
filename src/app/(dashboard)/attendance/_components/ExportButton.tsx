'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';

export default function ExportButton() {
    const [isLoading, setIsLoading] = useState(false);

    const handleExportExcel = async () => {
        setIsLoading(true);
        try {
            const now = new Date();
            const month = now.getMonth() + 1;
            const year = now.getFullYear();

            const res = await fetch(`/api/export/excel?month=${month}&year=${year}`);
            if (!res.ok) throw new Error('Không thể xuất file');

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `DiemDanh_T${month}_${year}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export Error:', error);
            alert('Lỗi xuất file Excel!');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <Button
                variant="ghost"
                size="sm"
                onClick={handleExportExcel}
                disabled={isLoading}
                className="gap-2"
            >
                <span>📊</span>
                {isLoading ? 'Đang xuất...' : 'Xuất Excel'}
            </Button>
        </div>
    );
}

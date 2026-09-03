import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
    title: 'Điểm Danh Lớp Bóng Đá',
    description: 'Ứng dụng điểm danh di động 1 chạm dành riêng cho lớp bóng đá',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'black-translucent',
        title: 'Bóng Đá',
    },
    formatDetection: {
        telephone: false,
    },
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
    themeColor: '#06140c',
};

export default function FootballLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-[#06140c] text-white flex flex-col font-sans touch-manipulation select-none overflow-x-hidden">
            {children}
        </div>
    );
}

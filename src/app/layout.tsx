import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/montserrat';
import './globals.css';
import PwaSetup from '@/components/PwaSetup';

export const metadata: Metadata = {
  title: 'Võ Đường Manager',
  description: 'Hệ thống quản lý điểm danh và xếp hạng võ sinh',
  robots: { index: false, follow: false },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Võ Đường',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: '#caa052',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        {process.env.NEXT_PUBLIC_SUPABASE_URL && (
          <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} crossOrigin="anonymous" />
        )}
      </head>
      <body className="antialiased min-h-screen flex flex-col" suppressHydrationWarning>
        {/* Martial Arts Theme Background */}
        <div className="fixed inset-0 z-[-1] pointer-events-none bg-[#0a0f1c]">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1c]/30 via-[#0a0f1c]/50 to-[#0a0f1c]/90 pointer-events-none" />
        </div>

        <div className="relative z-10 flex flex-col min-h-screen">
          <PwaSetup />
          {children}
        </div>
      </body>
    </html>
  );
}

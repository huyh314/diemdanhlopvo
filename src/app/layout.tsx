import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Võ Đường Manager',
  description: 'Hệ thống quản lý điểm danh và xếp hạng võ sinh',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className="antialiased min-h-screen flex flex-col font-['Outfit',sans-serif]" suppressHydrationWarning>
        {/* Martial Arts Theme Background */}
        <div className="fixed inset-0 z-[-1] pointer-events-none bg-[#0a0f1c]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/martial_arts_bg.png"
            alt="Dojo Background"
            className="w-full h-full object-cover opacity-50 mix-blend-luminosity brightness-75"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1c]/60 via-[#0a0f1c]/80 to-[#0a0f1c] pointer-events-none" />
        </div>

        <div className="relative z-10 flex flex-col min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}

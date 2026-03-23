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
        {children}
      </body>
    </html>
  );
}

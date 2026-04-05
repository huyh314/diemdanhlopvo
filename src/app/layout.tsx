import type { Metadata, Viewport } from 'next';
import Image from 'next/image';
import './globals.css';
import ParticleBackground from '@/components/ui/ParticleBackground';
import BackgroundMusic from '@/components/BackgroundMusic';
import PwaSetup from '@/components/PwaSetup';

export const metadata: Metadata = {
  title: 'Võ Đường Manager',
  description: 'Hệ thống quản lý điểm danh và xếp hạng võ sinh',
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
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className="antialiased min-h-screen flex flex-col font-['Montserrat',sans-serif]" suppressHydrationWarning>
        {/* Martial Arts Theme Background */}
        <div className="fixed inset-0 z-[-1] pointer-events-none bg-[#0a0f1c]">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-lighten"
            src="/background/Seamless_Looping_Hero_Cover_Animation.mp4"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1c]/30 via-[#0a0f1c]/50 to-[#0a0f1c]/90 pointer-events-none" />
          <ParticleBackground />
        </div>

        <BackgroundMusic />

        <div className="relative z-10 flex flex-col min-h-screen">
          <PwaSetup />
          {children}
        </div>
      </body>
    </html>
  );
}

'use client';
import { useEffect, useState } from 'react';

// Mở rộng interface Window cho event beforeinstallprompt
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function PwaSetup() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(
        (registration) => {
          console.log('ServiceWorker registration successful');
        },
        (err) => {
          console.error('ServiceWorker registration failed: ', err);
        }
      ).catch(err => {
        console.error('SW Error:', err);
      });
    }

    // Lắng nghe sự kiện beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      // Ngăn trình duyệt tự động hiển thị prompt mặc định
      e.preventDefault();
      // Lưu lại event để có thể trigger sau
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Hiển thị nút tải ứng dụng
      setShowInstallBtn(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Lắng nghe sự kiện sau khi ứng dụng đã được cài đặt
    window.addEventListener('appinstalled', () => {
      setShowInstallBtn(false);
      setDeferredPrompt(null);
      console.log('PWA was installed');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Hiển thị prompt cài đặt của trình duyệt
    deferredPrompt.prompt();

    // Chờ người dùng phản hồi (Đồng ý hoặc Từ chối cài đặt)
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    // Đặt lại state
    setDeferredPrompt(null);
    setShowInstallBtn(false);
  };

  if (!showInstallBtn) return null;

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
      <button 
        onClick={handleInstallClick}
        className="bg-[#caa052] text-black font-bold py-3 px-6 rounded-full shadow-[0_0_15px_rgba(202,160,82,0.6)] border border-[#caa052] flex items-center gap-2 hover:bg-[#d4b06a] hover:scale-105 transition-all"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
        Tải App Ngay
      </button>
    </div>
  );
}

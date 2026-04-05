'use client';
import { useEffect } from 'react';

export default function PwaSetup() {
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
  }, []);
  
  return null;
}

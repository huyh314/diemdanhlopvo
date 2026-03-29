'use client';

import { useCallback, useRef, useEffect } from 'react';

export function useSoundEffects() {
  const clickAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize the audio object only on the client side
    if (typeof window !== 'undefined') {
      clickAudioRef.current = new Audio('/music/ui_click.wav');
      clickAudioRef.current.volume = 0.3; // Default subtle volume
      clickAudioRef.current.preload = 'auto';
    }
  }, []);

  const playClick = useCallback(() => {
    if (clickAudioRef.current) {
      // Reset the playback position to allow rapid repeated clicks
      clickAudioRef.current.currentTime = 0;
      clickAudioRef.current.play().catch(err => {
        // Silently catch errors (e.g., if user hasn't interacted yet)
        console.log('Sound play prevented or failed:', err);
      });
    }
  }, []);

  return { playClick };
}

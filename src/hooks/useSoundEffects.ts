'use client';

import { useCallback } from 'react';

// Share one player across navigation and student rows; create it only on a click.
let clickAudio: HTMLAudioElement | null = null;

export function useSoundEffects() {
  const playClick = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (!clickAudio) {
      clickAudio = new Audio('/music/ui_click.wav');
      clickAudio.volume = 0.3;
    }
    if (clickAudio) {
      // Reset the playback position to allow rapid repeated clicks
      clickAudio.currentTime = 0;
      clickAudio.play().catch(err => {
        // Silently catch errors (e.g., if user hasn't interacted yet)
        console.log('Sound play prevented or failed:', err);
      });
    }
  }, []);

  return { playClick };
}

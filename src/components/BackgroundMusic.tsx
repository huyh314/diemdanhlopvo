'use client';

import { useEffect, useRef, useState } from 'react';

export default function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    const playAudio = async () => {
      try {
        if (audioRef.current && !isPlaying) {
          audioRef.current.volume = volume;
          await audioRef.current.play();
          setIsPlaying(true);
        }
      } catch (error) {
        console.log("Autoplay prevented, waiting for user interaction...");
      }
    };

    playAudio();

    const handleInteraction = () => {
      if (!hasInteracted) {
        setHasInteracted(true);
        playAudio();
      }
    };

    document.addEventListener('click', handleInteraction);
    document.addEventListener('keydown', handleInteraction);
    document.addEventListener('touchstart', handleInteraction);

    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
    };
  }, [isPlaying, hasInteracted, volume]);

  return (
    <>
      <audio
        ref={audioRef}
        src="/music/Hao_Khi_Thang_Long.mp3"
        loop
        preload="auto"
      />
      
      {/* Floating Audio Controls Container */}
      <div 
        className="fixed bottom-[90px] md:bottom-6 right-4 md:right-6 z-50 flex flex-col items-center gap-3"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Volume Slider Container */}
        <div className={`
          flex flex-col items-center p-3 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl transition-all duration-300 origin-bottom
          ${isHovered ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-75 pointer-events-none'}
        `}>
          <div className="h-24 w-8 relative flex flex-col items-center justify-center">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="vertical-slider h-2 w-20 appearance-none bg-white/20 rounded-full cursor-pointer -rotate-90 absolute"
              style={{
                accentColor: 'var(--accent-from)',
                background: `linear-gradient(to right, var(--accent-from) ${volume * 100}%, rgba(255,255,255,0.1) ${volume * 100}%)`
              }}
            />
          </div>
          <span className="text-[10px] font-bold text-white/50 mt-1">{Math.round(volume * 100)}%</span>
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => {
            if (isPlaying) {
              audioRef.current?.pause();
            } else {
              audioRef.current?.play();
            }
            setIsPlaying(!isPlaying);
          }}
          className="p-3.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/50 hover:text-white transition-all shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:bg-black/60 hover:scale-110 active:scale-95 group relative"
          title={isPlaying ? 'Tắt nhạc nền' : 'Bật nhạc nền'}
        >
          {isPlaying ? (
            <svg className="w-5 h-5 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 opacity-40 group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          )}
        </button>
      </div>

      <style jsx>{`
        .vertical-slider {
          outline: none;
          -webkit-appearance: none;
        }
        .vertical-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
          transition: transform 0.2s;
        }
        .vertical-slider::-webkit-slider-thumb:hover {
          transform: scale(1.3);
        }
      `}</style>
    </>
  );
}

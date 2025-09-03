import React, { useState, useEffect } from 'react';
import { Maximize, Minimize } from 'lucide-react';

export function FullScreenButton() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'f' || event.key === 'F') {
        event.preventDefault();
        toggleFullscreen();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.warn('Volledig scherm niet ondersteund:', error);
    }
  };

  // Only show on desktop/tablet devices
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;

  if (!isDesktop) {
    return null;
  }

  return (
    <button
      onClick={toggleFullscreen}
      aria-label={isFullscreen ? 'Volledig scherm verlaten' : 'Volledig scherm'}
      className={`
        fixed top-4 right-4 z-50
        p-3 rounded-full
        bg-black/20 hover:bg-black/30
        backdrop-blur-sm
        text-white/80 hover:text-white
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-blue-400/50
        focus-visible:ring-2 focus-visible:ring-blue-400
      `}
      data-testid="button-fullscreen"
    >
      {isFullscreen ? (
        <Minimize className="w-5 h-5" />
      ) : (
        <Maximize className="w-5 h-5" />
      )}
    </button>
  );
}
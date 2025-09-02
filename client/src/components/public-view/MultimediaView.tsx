"use client";

import { useState, useEffect, useRef } from "react";
import { MultimediaConfig } from "@/lib/mock/public-screens";

interface MultimediaViewProps {
  config: MultimediaConfig;
}

export function MultimediaView({ config }: MultimediaViewProps) {
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const activeItems = config.mediaItems.filter(item => item.active);
  const currentItem = activeItems[currentItemIndex];

  useEffect(() => {
    if (!config.autoplay.enabled || activeItems.length <= 1) return;

    // Voor video's met loop, gebruik de video duration als timing
    let duration = currentItem?.duration || config.autoplay.interval;
    
    // Als het een video is met loop disabled, gebruik de standaard timing
    if (currentItem?.type === 'video' && !currentItem.loop && videoRef.current) {
      const videoDuration = videoRef.current.duration;
      if (videoDuration && !isNaN(videoDuration)) {
        duration = Math.min(videoDuration, currentItem.duration);
      }
    }

    const timer = setTimeout(() => {
      handleTransition();
    }, duration * 1000);

    return () => clearTimeout(timer);
  }, [currentItemIndex, activeItems.length, config.autoplay, currentItem]);

  const handleTransition = () => {
    setIsTransitioning(true);
    
    setTimeout(() => {
      setCurrentItemIndex(prev => (prev + 1) % activeItems.length);
      setIsTransitioning(false);
    }, 300); // Transition duration
  };

  const getTransitionClass = () => {
    if (!isTransitioning) return "opacity-100 transform scale-100";
    
    switch (currentItem?.transition) {
      case 'fade':
        return "opacity-0 transform scale-100";
      case 'slide':
        return "opacity-100 transform translate-x-full";
      case 'zoom':
        return "opacity-0 transform scale-110";
      default:
        return "opacity-100 transform scale-100";
    }
  };

  if (!currentItem) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-cyan-800 text-white">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Geen actieve media</h1>
          <p className="text-xl opacity-75">Er zijn momenteel geen media items om weer te geven.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col bg-gradient-to-br from-blue-950 to-cyan-900">
      {/* Header with title and subtitle */}
      <div className="relative z-10 p-8 text-center">
        <h1 
          className="mb-2"
          style={{
            fontSize: `${config.title.fontSize}px`,
            fontFamily: config.title.fontFamily,
            fontWeight: config.title.fontWeight,
            color: config.title.color
          }}
        >
          {config.title.text}
        </h1>
        {config.subtitle.text && (
          <h2 
            style={{
              fontSize: `${config.subtitle.fontSize}px`,
              fontFamily: config.subtitle.fontFamily,
              fontWeight: config.subtitle.fontWeight,
              color: config.subtitle.color
            }}
          >
            {config.subtitle.text}
          </h2>
        )}
      </div>

      {/* Main media area */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-8">
        <div 
          className={`w-full h-full max-w-6xl max-h-[70vh] transition-all duration-300 ease-in-out ${getTransitionClass()}`}
        >
          {currentItem.type === 'video' ? (
            <video
              ref={videoRef}
              src={currentItem.url}
              className="w-full h-full object-contain rounded-lg shadow-2xl"
              autoPlay
              muted
              loop={currentItem.loop}
              controls={currentItem.loop} // Show controls only for looped videos
              onEnded={() => {
                if (!currentItem.loop && activeItems.length > 1) {
                  handleTransition();
                }
              }}
            />
          ) : (
            <img 
              src={currentItem.url}
              alt={currentItem.name || 'Media item'}
              className="w-full h-full object-contain rounded-lg shadow-2xl"
            />
          )}
        </div>
      </div>

      {/* Media info overlay */}
      <div className="absolute bottom-4 left-4 bg-blue-900 bg-opacity-90 text-white px-4 py-2 rounded-lg border border-blue-600/30 backdrop-blur-sm">
        <div className="text-sm font-medium">{currentItem.name}</div>
        <div className="text-xs opacity-75">
          {currentItem.type === 'video' ? 
            (currentItem.loop ? 'Video (Loop)' : `Video (${currentItem.duration}s)`) :
            `Afbeelding (${currentItem.duration}s)`
          }
        </div>
      </div>

      {/* Progress indicators */}
      {activeItems.length > 1 && (
        <div className="absolute bottom-4 right-4 flex gap-2">
          {activeItems.map((_, index) => (
            <div
              key={index}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentItemIndex 
                  ? 'bg-white scale-110' 
                  : 'bg-white opacity-40'
              }`}
            />
          ))}
        </div>
      )}

      {/* Auto-play progress bar (alleen voor niet-loop video's en afbeeldingen) */}
      {config.autoplay.enabled && activeItems.length > 1 && 
       (!currentItem.loop || currentItem.type !== 'video') && (
        <div className="absolute bottom-0 left-0 right-0 z-10">
          <div className="h-1 bg-white opacity-20">
            <div 
              className="h-full bg-white transition-all linear"
              style={{
                width: '0%',
                animation: `progress ${currentItem.duration}s linear infinite`
              }}
            />
          </div>
        </div>
      )}

      {/* Navigation overlay (bij hover) */}
      {activeItems.length > 1 && (
        <div className="absolute inset-0 z-10 opacity-0 hover:opacity-100 transition-opacity duration-300">
          <button
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-blue-900 bg-opacity-80 text-white p-3 rounded-full hover:bg-opacity-100 transition-all border border-blue-600/30 backdrop-blur-sm"
            onClick={() => setCurrentItemIndex(prev => 
              prev > 0 ? prev - 1 : activeItems.length - 1
            )}
          >
            ←
          </button>
          <button
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-blue-900 bg-opacity-80 text-white p-3 rounded-full hover:bg-opacity-100 transition-all border border-blue-600/30 backdrop-blur-sm"
            onClick={() => setCurrentItemIndex(prev => 
              prev < activeItems.length - 1 ? prev + 1 : 0
            )}
          >
            →
          </button>
        </div>
      )}

      <style>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
}
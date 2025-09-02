"use client";

import { useState, useEffect } from "react";

interface MededelingenViewProps {
  config: any;
}

export function MededelingenView({ config }: MededelingenViewProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [fadeClass, setFadeClass] = useState("opacity-100");

  // Get slides/messages with safe fallback
  const slides = config?.slides || config?.messages || [];
  const activeSlides = slides.filter((slide: any) => slide.active !== false); // Include items without active property
  const currentSlide = activeSlides[currentSlideIndex];

  // Safe config defaults
  const carouselConfig = config?.carousel || {};
  const autoAdvance = carouselConfig.autoAdvance ?? true;
  const intervalTime = carouselConfig.intervalTime || 10000; // milliseconds

  useEffect(() => {
    if (!autoAdvance || activeSlides.length <= 1) return;

    const slideInterval = currentSlide?.displayDuration || intervalTime;
    
    const timer = setTimeout(() => {
      setFadeClass("opacity-0");
      
      setTimeout(() => {
        setCurrentSlideIndex(prev => (prev + 1) % activeSlides.length);
        setFadeClass("opacity-100");
      }, 300); // Fade transition duration
    }, slideInterval);

    return () => clearTimeout(timer);
  }, [currentSlideIndex, activeSlides.length, autoAdvance, intervalTime, currentSlide]);

  if (!currentSlide) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-cyan-800 text-white">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Geen actieve mededelingen</h1>
          <p className="text-xl opacity-75">Er zijn momenteel geen berichten om weer te geven.</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen relative overflow-hidden flex flex-col"
      style={{ 
        backgroundColor: '#f3f4f6',
        color: '#1f2937'
      }}
    >
      {/* Header with title */}
      <div className="relative z-10 p-8 text-center">
        <h1 className="text-4xl font-bold mb-4 text-blue-900">
          Mededelingen
        </h1>
      </div>

      {/* Main content area */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-8">
        <div 
          className={`text-center transition-opacity duration-300 ${fadeClass}`}
          style={{ maxWidth: '800px' }}
        >
          <div className="text-2xl leading-relaxed whitespace-pre-wrap text-gray-800">
            {currentSlide.content || currentSlide.title || currentSlide.body}
          </div>
        </div>
      </div>

      {/* Progress indicators */}
      {activeSlides.length > 1 && (
        <div className="relative z-10 flex justify-center gap-3 p-8">
          {activeSlides.map((_: any, index: number) => (
            <div
              key={index}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentSlideIndex 
                  ? 'bg-blue-600 scale-110' 
                  : 'bg-blue-300 opacity-40'
              }`}
            />
          ))}
        </div>
      )}

      {/* Auto-play progress bar */}
      {autoAdvance && activeSlides.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 z-10">
          <div className="h-1 bg-blue-600 opacity-20">
            <div 
              className="h-full bg-blue-600 transition-all linear"
              style={{
                width: '0%',
                animation: `progress ${(currentSlide?.displayDuration || intervalTime) / 1000}s linear infinite`
              }}
            />
          </div>
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
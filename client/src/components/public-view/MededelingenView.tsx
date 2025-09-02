"use client";

import { useState, useEffect } from "react";
import { MededelingenConfig, MededelingenSlide } from "@/lib/mock/public-screens";

interface MededelingenViewProps {
  config: MededelingenConfig;
}

export function MededelingenView({ config }: MededelingenViewProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [fadeClass, setFadeClass] = useState("opacity-100");

  const activeSlides = config.slides.filter(slide => slide.active);
  const currentSlide = activeSlides[currentSlideIndex];

  useEffect(() => {
    if (!config.autoplay.enabled || activeSlides.length <= 1) return;

    const slideInterval = currentSlide?.durationSec || config.autoplay.interval;
    
    const timer = setTimeout(() => {
      setFadeClass("opacity-0");
      
      setTimeout(() => {
        setCurrentSlideIndex(prev => {
          if (config.autoplay.order === 'shuffle') {
            let nextIndex;
            do {
              nextIndex = Math.floor(Math.random() * activeSlides.length);
            } while (nextIndex === prev && activeSlides.length > 1);
            return nextIndex;
          } else {
            return (prev + 1) % activeSlides.length;
          }
        });
        setFadeClass("opacity-100");
      }, 300); // Fade transition duration
    }, slideInterval * 1000);

    return () => clearTimeout(timer);
  }, [currentSlideIndex, activeSlides.length, config.autoplay, currentSlide]);

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
        backgroundColor: config.style.background === 'white' ? '#ffffff' : 
                         config.style.background === 'black' ? '#000000' : 'transparent',
        color: config.style.textContrast === 'light' ? '#ffffff' : '#000000'
      }}
    >
      {/* Background image with overlay */}
      {currentSlide.mediaUrl && (
        <div className="absolute inset-0 z-0">
          <img 
            src={currentSlide.mediaUrl}
            alt={currentSlide.title}
            className="w-full h-full object-cover"
          />
          <div 
            className="absolute inset-0"
            style={{ 
              backgroundColor: config.style.background === 'white' ? 'rgba(255,255,255,0.8)' : 
                              config.style.background === 'black' ? 'rgba(0,0,0,0.8)' : 
                              'rgba(0,0,0,0.4)'
            }}
          />
        </div>
      )}

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

      {/* Main content area */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-8">
        <div 
          className={`text-center transition-opacity duration-300 ${fadeClass}`}
          style={{ maxWidth: config.style.maxTextWidth }}
        >
          <h2 className="text-4xl font-bold mb-6">
            {currentSlide.title}
          </h2>
          
          {currentSlide.body && (
            <div className="text-xl leading-relaxed whitespace-pre-wrap">
              {currentSlide.body}
            </div>
          )}
        </div>
      </div>

      {/* Progress indicators */}
      {activeSlides.length > 1 && (
        <div className="relative z-10 flex justify-center gap-3 p-8">
          {activeSlides.map((_, index) => (
            <div
              key={index}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentSlideIndex 
                  ? 'bg-current scale-110' 
                  : 'bg-current opacity-40'
              }`}
            />
          ))}
        </div>
      )}

      {/* Auto-play progress bar */}
      {config.autoplay.enabled && activeSlides.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 z-10">
          <div className="h-1 bg-current opacity-20">
            <div 
              className="h-full bg-current transition-all linear"
              style={{
                width: '0%',
                animation: `progress ${(currentSlide?.durationSec || config.autoplay.interval)}s linear infinite`
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
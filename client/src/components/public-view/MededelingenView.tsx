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
  const activeSlides = slides.filter((slide: any) => slide.active !== false);
  const currentSlide = activeSlides[currentSlideIndex];

  // Safe config defaults
  const carouselConfig = config?.carousel || {};
  const autoAdvance = carouselConfig.autoAdvance ?? config?.autoplay?.enabled ?? true;
  const intervalTime = carouselConfig.intervalTime || (config?.autoplay?.interval * 1000) || 10000;

  useEffect(() => {
    if (!autoAdvance || activeSlides.length <= 1) return;

    const slideInterval = currentSlide?.displayDuration || intervalTime;
    
    const timer = setTimeout(() => {
      setFadeClass("opacity-0");
      
      setTimeout(() => {
        setCurrentSlideIndex(prev => (prev + 1) % activeSlides.length);
        setFadeClass("opacity-100");
      }, 300);
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

  // Get styling from slide or use defaults
  const slideStyle = currentSlide.styling || {};
  const backgroundColor = slideStyle.backgroundColor || config?.style?.background || '#f3f4f6';
  const textColor = slideStyle.titleColor || config?.style?.textColor || '#1f2937';

  return (
    <div 
      className="min-h-screen relative overflow-hidden flex flex-col"
      style={{ 
        backgroundColor: backgroundColor,
        color: textColor
      }}
    >
      {/* Main content area with current slide */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-8">
        <div 
          className={`text-center transition-opacity duration-300 ${fadeClass}`}
          style={{ maxWidth: config?.style?.maxTextWidth || '800px' }}
        >
          {/* Slide title */}
          <h1 
            className="mb-4"
            style={{
              fontSize: slideStyle.titleFontSize ? `${slideStyle.titleFontSize}px` : '48px',
              fontFamily: slideStyle.titleFontFamily || 'Poppins',
              fontWeight: slideStyle.titleFontWeight || 'bold',
              color: slideStyle.titleColor || textColor
            }}
          >
            {currentSlide.title}
          </h1>
          
          {/* Slide subtitle */}
          {currentSlide.subtitle && (
            <h2 
              className="mb-6"
              style={{
                fontSize: slideStyle.subtitleFontSize ? `${slideStyle.subtitleFontSize}px` : '24px',
                fontFamily: slideStyle.subtitleFontFamily || 'Poppins',
                fontWeight: slideStyle.subtitleFontWeight || 'normal',
                color: slideStyle.subtitleColor || textColor
              }}
            >
              {currentSlide.subtitle}
            </h2>
          )}
          
          {/* Slide content/body with line break support */}
          {currentSlide.body && (
            <div 
              className="leading-relaxed whitespace-pre-line"
              style={{
                fontSize: slideStyle.bodyFontSize ? `${slideStyle.bodyFontSize}px` : '20px',
                fontFamily: slideStyle.bodyFontFamily || 'Poppins',
                fontWeight: slideStyle.bodyFontWeight || 'normal',
                color: slideStyle.bodyColor || textColor
              }}
            >
              {currentSlide.body}
            </div>
          )}
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
                  ? 'opacity-100 scale-110' 
                  : 'opacity-40'
              }`}
              style={{
                backgroundColor: textColor
              }}
            />
          ))}
        </div>
      )}

      {/* Auto-play progress bar */}
      {autoAdvance && activeSlides.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 z-10">
          <div className="h-1 opacity-20" style={{ backgroundColor: textColor }}>
            <div 
              className="h-full transition-all linear"
              style={{
                backgroundColor: textColor,
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
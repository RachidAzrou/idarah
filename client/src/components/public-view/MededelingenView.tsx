"use client";

import { useState, useEffect } from "react";
import backgroundImage from "@assets/ramadan_15_03_2022_1_1756811846212.jpg";

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
      className="min-h-screen relative flex items-center justify-center p-8"
      style={{
        backgroundImage: `url("${backgroundImage}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Large centered container for announcements */}
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <div 
          className="bg-white/95 backdrop-blur-lg rounded-3xl border-2 border-white/30 p-24 text-center shadow-xl"
          style={{ 
            boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.3), 0 8px 25px -8px rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(16px)',
            width: '95vw',
            maxWidth: '1600px',
            minHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}
        >
          {/* Content that changes with transition */}
          <div className={`transition-opacity duration-300 ${fadeClass}`}>
            {/* Slide title */}
            <h1 
              className="mb-8"
              style={{
                fontSize: slideStyle.titleFontSize ? `${slideStyle.titleFontSize}px` : '56px',
                fontFamily: slideStyle.titleFontFamily || 'Poppins',
                fontWeight: slideStyle.titleFontWeight || 'bold',
                color: slideStyle.titleColor || '#1f2937',
                lineHeight: '1.1'
              }}
              data-testid="mededelingen-title"
            >
              {currentSlide.title}
            </h1>
            
            {/* Slide subtitle */}
            {currentSlide.subtitle && (
              <h2 
                className="mb-10"
                style={{
                  fontSize: slideStyle.subtitleFontSize ? `${slideStyle.subtitleFontSize}px` : '32px',
                  fontFamily: slideStyle.subtitleFontFamily || 'Poppins',
                  fontWeight: slideStyle.subtitleFontWeight || 'normal',
                  color: slideStyle.subtitleColor || '#6b7280',
                  lineHeight: '1.3'
                }}
                data-testid="mededelingen-subtitle"
              >
                {currentSlide.subtitle}
              </h2>
            )}
            
            {/* Slide content/body with line break support */}
            {currentSlide.body && (
              <div 
                className="leading-relaxed whitespace-pre-line max-w-4xl mx-auto"
                style={{
                  fontSize: slideStyle.bodyFontSize ? `${slideStyle.bodyFontSize}px` : '26px',
                  fontFamily: slideStyle.bodyFontFamily || 'Poppins',
                  fontWeight: slideStyle.bodyFontWeight || 'normal',
                  color: slideStyle.bodyColor || '#374151',
                  lineHeight: '1.7'
                }}
                data-testid="mededelingen-body"
              >
                {currentSlide.body}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Simple progress indicators only */}
      {activeSlides.length > 1 && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
          <div className="flex justify-center items-center gap-3">
            {activeSlides.map((_: any, index: number) => (
              <div
                key={index}
                className={`w-4 h-4 rounded-full transition-all duration-300 ${
                  index === currentSlideIndex 
                    ? 'bg-white scale-125 shadow-lg' 
                    : 'bg-white/40'
                }`}
                data-testid={`slide-indicator-${index}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Auto-play progress bar */}
      {autoAdvance && activeSlides.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 z-10">
          <div className="h-1 bg-white/20">
            <div 
              className="h-full transition-all linear bg-white"
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
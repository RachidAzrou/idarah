"use client";

import { useState, useEffect } from "react";
import { AnnouncementsConfig } from "@/lib/mock/public-screens";
import { getActiveSlides } from "@/lib/mock/announcements";
import { ChevronLeft, ChevronRight, Play, Pause } from "lucide-react";

interface AnnouncementsPreviewProps {
  config: AnnouncementsConfig;
}

export function AnnouncementsPreview({ config }: AnnouncementsPreviewProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(config.autoplay.enabled);
  
  // Get active slides based on current time and config
  const activeSlides = getActiveSlides(new Date().toISOString()).filter(slide => 
    config.slides.some(configSlide => 
      configSlide.id === slide.id && configSlide.active
    )
  );

  // Merge config slides with active slides to get latest config
  const slides = activeSlides.map(activeSlide => {
    const configSlide = config.slides.find(s => s.id === activeSlide.id);
    return configSlide || activeSlide;
  });

  useEffect(() => {
    if (slides.length === 0) return;
    
    // Reset current slide if it's out of bounds
    if (currentSlide >= slides.length) {
      setCurrentSlide(0);
    }
  }, [slides.length, currentSlide]);

  useEffect(() => {
    if (!isPlaying || slides.length <= 1) return;

    const currentSlideDuration = slides[currentSlide]?.durationSec || config.autoplay.interval;
    const timer = setTimeout(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, currentSlideDuration * 1000);

    return () => clearTimeout(timer);
  }, [currentSlide, isPlaying, slides, config.autoplay.interval]);

  const goToNext = () => {
    if (slides.length > 1) {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }
  };

  const goToPrevious = () => {
    if (slides.length > 1) {
      setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length);
    }
  };

  if (slides.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center space-y-2">
          <div className="text-lg font-semibold">Geen actieve slides</div>
          <div className="text-sm opacity-75">
            Voeg slides toe of controleer de geldigheidsdata
          </div>
        </div>
      </div>
    );
  }

  const slide = slides[currentSlide];
  const backgroundClass = config.style.background === 'white' ? 'bg-white' : 
                         config.style.background === 'black' ? 'bg-black' : 'bg-transparent';
  const textClass = config.style.textContrast === 'light' ? 'text-white' : 'text-black';

  return (
    <div className={`h-full relative ${backgroundClass} ${textClass} overflow-hidden`}>
      {/* Slide Content */}
      <div className="h-full flex items-center justify-center p-8">
        <div 
          className="text-center space-y-6 max-w-4xl"
          style={{ maxWidth: `${config.style.maxTextWidth}px` }}
          role="group"
          aria-label={`Slide ${currentSlide + 1} van ${slides.length}: ${slide.title}`}
        >
          {/* Media */}
          {slide.mediaUrl && (
            <div className="mb-6">
              {slide.mediaType === 'image' ? (
                <img 
                  src={slide.mediaUrl} 
                  alt=""
                  className="max-w-full max-h-64 mx-auto object-contain rounded-lg"
                />
              ) : slide.mediaType === 'video' ? (
                <video 
                  src={slide.mediaUrl}
                  className="max-w-full max-h-64 mx-auto object-contain rounded-lg"
                  autoPlay
                  muted
                  loop
                />
              ) : null}
            </div>
          )}

          {/* Title */}
          <h1 className="text-4xl font-bold mb-4">
            {slide.title}
          </h1>

          {/* Body */}
          {slide.body && (
            <div className="text-xl leading-relaxed whitespace-pre-wrap">
              {slide.body}
            </div>
          )}
        </div>
      </div>

      {/* Controls (for preview) */}
      <div className="absolute top-4 right-4 flex gap-2">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="p-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-75 transition-opacity"
          aria-label={isPlaying ? "Pauzeren" : "Afspelen"}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
        
        {slides.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="p-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-75 transition-opacity"
              aria-label="Vorige slide"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            
            <button
              onClick={goToNext}
              className="p-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-75 transition-opacity"
              aria-label="Volgende slide"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {/* Progress Indicator */}
      {slides.length > 1 && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
          <div className="flex items-center gap-2">
            <div className="text-sm opacity-75">
              {currentSlide + 1} / {slides.length}
            </div>
            <div className="flex gap-1">
              {slides.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-opacity ${
                    index === currentSlide ? 'bg-current' : 'bg-current opacity-30'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
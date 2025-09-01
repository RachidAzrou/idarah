"use client";

import { useState, useEffect } from "react";
import { AnnouncementsConfig } from "@/lib/mock/public-screens";
import { getActiveSlides } from "@/lib/mock/announcements";
import { SyncClient } from "./SyncClient";

interface AnnouncementsViewProps {
  config: AnnouncementsConfig;
}

export function AnnouncementsView({ config }: AnnouncementsViewProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(config.autoplay.enabled);
  const [slides, setSlides] = useState(() => {
    // Get active slides and merge with config
    const activeSlides = getActiveSlides(new Date().toISOString()).filter(slide => 
      config.slides.some(configSlide => 
        configSlide.id === slide.id && configSlide.active
      )
    );
    
    return activeSlides.map(activeSlide => {
      const configSlide = config.slides.find(s => s.id === activeSlide.id);
      return configSlide || activeSlide;
    });
  });

  // Auto-sync every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const activeSlides = getActiveSlides(new Date().toISOString()).filter(slide => 
        config.slides.some(configSlide => 
          configSlide.id === slide.id && configSlide.active
        )
      );
      
      const updatedSlides = activeSlides.map(activeSlide => {
        const configSlide = config.slides.find(s => s.id === activeSlide.id);
        return configSlide || activeSlide;
      });
      
      setSlides(updatedSlides);
    }, 30000);

    return () => clearInterval(interval);
  }, [config.slides]);

  // Autoplay logic
  useEffect(() => {
    if (!isPlaying || slides.length <= 1) return;

    const currentSlideDuration = slides[currentSlide]?.durationSec || config.autoplay.interval;
    const timer = setTimeout(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, currentSlideDuration * 1000);

    return () => clearTimeout(timer);
  }, [currentSlide, isPlaying, slides, config.autoplay.interval]);

  // Reset current slide if out of bounds
  useEffect(() => {
    if (slides.length > 0 && currentSlide >= slides.length) {
      setCurrentSlide(0);
    }
  }, [slides.length, currentSlide]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case ' ':
          e.preventDefault();
          setIsPlaying(!isPlaying);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (slides.length > 1) {
            setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length);
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (slides.length > 1) {
            setCurrentSlide(prev => (prev + 1) % slides.length);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying, slides.length]);

  if (slides.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <SyncClient />
        <div className="text-center space-y-4">
          <div className="text-3xl font-bold">Geen actieve mededelingen</div>
          <div className="text-lg opacity-75">
            Er zijn momenteel geen mededelingen beschikbaar
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
    <div className={`min-h-screen relative ${backgroundClass} ${textClass} overflow-hidden`}>
      <SyncClient />
      
      {/* Slide Content */}
      <div className="h-screen flex items-center justify-center p-12">
        <div 
          className="text-center space-y-8 max-w-full"
          style={{ maxWidth: `${config.style.maxTextWidth}px` }}
          role="group"
          aria-label={`Slide ${currentSlide + 1} van ${slides.length}: ${slide.title}`}
        >
          {/* Media */}
          {slide.mediaUrl && (
            <div className="mb-12">
              {slide.mediaType === 'image' ? (
                <img 
                  src={slide.mediaUrl} 
                  alt=""
                  className="max-w-full max-h-96 mx-auto object-contain rounded-lg shadow-lg"
                />
              ) : slide.mediaType === 'video' ? (
                <video 
                  src={slide.mediaUrl}
                  className="max-w-full max-h-96 mx-auto object-contain rounded-lg shadow-lg"
                  autoPlay
                  muted
                  loop
                />
              ) : null}
            </div>
          )}

          {/* Title */}
          <h1 className="text-6xl font-bold leading-tight">
            {slide.title}
          </h1>

          {/* Body */}
          {slide.body && (
            <div className="text-2xl leading-relaxed whitespace-pre-wrap max-w-4xl mx-auto">
              {slide.body}
            </div>
          )}
        </div>
      </div>

      {/* Progress Indicator */}
      {slides.length > 1 && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="flex items-center gap-4 bg-black bg-opacity-50 rounded-full px-6 py-3">
            <div className="text-lg opacity-90">
              {currentSlide + 1} / {slides.length}
            </div>
            <div className="flex gap-2">
              {slides.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentSlide 
                      ? 'bg-current scale-125' 
                      : 'bg-current opacity-40'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Play/Pause Status */}
      {config.autoplay.enabled && (
        <div 
          className="absolute top-8 right-8 text-sm opacity-60"
          aria-live="polite"
        >
          {isPlaying ? 'Autoplay actief' : 'Gepauzeerd'}
        </div>
      )}
    </div>
  );
}
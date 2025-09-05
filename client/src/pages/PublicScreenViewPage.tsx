"use client";

import React, { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { PublicScreen, LedenlijstConfig, MededelingenConfig, MultimediaConfig } from "@/lib/mock/public-screens";
import { LedenlijstView } from "@/components/public-view/LedenlijstView";
import { MededelingenView } from "@/components/public-view/MededelingenView";
import { Controls } from "@/components/public-view/Controls";

export default function PublicScreenViewPage() {
  const [match, params] = useRoute("/screen/:publicToken");
  const publicToken = params?.publicToken;
  const [screen, setScreen] = useState<PublicScreen | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{type: string, message: string} | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);


  // FETCH DATA WHEN COMPONENT MOUNTS OR TOKEN CHANGES
  React.useEffect(() => {
    if (!publicToken) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const fetchData = async () => {
      try {
        const timestamp = new Date().getTime();
        const url = `/api/public-screens/token/${publicToken}?t=${timestamp}`;
        
        const response = await fetch(url, {
          method: 'GET',
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setScreen(data);
          setError(null);
        } else {
          // Handle different error responses
          if (response.status === 403) {
            const errorData = await response.json();
            setError({
              type: errorData.type || 'UNKNOWN',
              message: errorData.message || 'Dit scherm is momenteel niet actief'
            });
          } else {
            setError({
              type: 'NOT_FOUND',
              message: 'Het opgevraagde scherm bestaat niet of is verwijderd'
            });
          }
          setScreen(null);
        }
      } catch (error) {
        console.error('Error loading screen:', error);
        setError({
          type: 'CONNECTION_ERROR',
          message: 'Kan geen verbinding maken met de server'
        });
        setScreen(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [publicToken]);

  // Update document title
  React.useEffect(() => {
    if (screen?.name) {
      document.title = screen.name;
    }
    return () => {
      document.title = 'Ledenbeheer';
    };
  }, [screen?.name]);

  // Handle keyboard shortcuts and mouse controls
  React.useEffect(() => {
    const timer = setTimeout(() => setShowControls(false), 3000);
    
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timer);
      setTimeout(() => setShowControls(false), 3000);
    };

    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'f':
          e.preventDefault();
          handleFullscreen();
          break;
        case 'r':
          e.preventDefault();
          setLoading(true);
          // Trigger re-fetch by incrementing a counter
          window.location.reload();
          break;
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('keydown', handleKeyPress);
    
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, []);

  const handleFullscreen = async () => {
    if (!document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } catch (error) {
        console.error('Fullscreen failed:', error);
      }
    } else {
      try {
        await document.exitFullscreen();
        setIsFullscreen(false);
      } catch (error) {
        console.error('Exit fullscreen failed:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <div>Scherm laden...</div>
        </div>
      </div>
    );
  }

  if (!screen && error) {
    // Type-specific error messages
    const getErrorContent = () => {
      switch (error.type) {
        case 'MEDEDELINGEN':
          return {
            title: 'Geen actieve mededelingen',
            message: 'Er zijn momenteel geen mededelingen beschikbaar.'
          };
        case 'LEDENLIJST':
          return {
            title: 'Geen actieve ledenlijst',
            message: 'De ledenlijst is momenteel niet beschikbaar.'
          };
        case 'NOT_FOUND':
          return {
            title: 'Scherm niet gevonden',
            message: error.message
          };
        default:
          return {
            title: 'Scherm niet beschikbaar',
            message: error.message
          };
      }
    };

    const errorContent = getErrorContent();
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">{errorContent.title}</h1>
          <p className="text-gray-400">
            {errorContent.message}
          </p>
        </div>
      </div>
    );
  }

  if (!screen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Scherm niet gevonden</h1>
          <p className="text-gray-400">
            Het opgevraagde scherm bestaat niet of is verwijderd.
          </p>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen relative">
      {/* Main Content */}
      {screen.type === 'LEDENLIJST' && (
        <LedenlijstView 
          key={`ledenlijst-${Date.now()}`}
          config={screen.config as LedenlijstConfig} 
          members={(screen as any).members || []}
        />
      )}
      
      {screen.type === 'MEDEDELINGEN' && (
        <MededelingenView config={screen.config as MededelingenConfig} />
      )}
      
      {screen.type === 'MULTIMEDIA' && (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <p className="text-gray-600">Multimedia viewer komt binnenkort...</p>
        </div>
      )}

      {/* Controls */}
      <Controls 
        visible={showControls}
        isFullscreen={isFullscreen}
        onFullscreen={handleFullscreen}
        onRefresh={() => window.location.reload()}
      />
    </div>
  );
}
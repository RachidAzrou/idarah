"use client";

import React, { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { PublicScreen, LedenlijstConfig, MededelingenConfig, MultimediaConfig } from "@/lib/mock/public-screens";
import { LedenlijstView } from "@/components/public-view/LedenlijstView";
import { AnnouncementsView } from "@/components/public-view/AnnouncementsView";
import { Controls } from "@/components/public-view/Controls";

export default function PublicScreenViewPage() {
  const [match, params] = useRoute("/screen/:publicToken");
  const publicToken = params?.publicToken;
  const [screen, setScreen] = useState<PublicScreen | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  console.log('=== COMPONENT RENDERED ===', { publicToken, loading, hasScreen: !!screen });

  // FETCH DATA IMMEDIATELY WHEN COMPONENT MOUNTS OR TOKEN CHANGES
  React.useEffect(() => {
    console.log('=== useEffect TRIGGERED ===', publicToken);
    
    if (!publicToken) {
      console.log('No publicToken, stopping');
      setLoading(false);
      return;
    }

    console.log('Starting data fetch...');
    setLoading(true);

    const fetchData = async () => {
      try {
        const timestamp = new Date().getTime();
        const url = `/api/public-screens/token/${publicToken}?t=${timestamp}`;
        
        console.log('=== FETCHING API ===', url);
        
        const response = await fetch(url, {
          method: 'GET',
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });

        console.log('=== API RESPONSE ===', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('=== RAW API DATA ===');
          console.log('Full response:', JSON.stringify(data, null, 2));
          console.log('Has members?', 'members' in data);
          console.log('Members count:', data.members?.length || 0);
          
          setScreen(data);
          console.log('Screen state updated with:', data.members?.length || 0, 'members');
        } else {
          console.error('API response not ok:', response.status);
          setScreen(null);
        }
      } catch (error) {
        console.error('=== FETCH ERROR ===', error);
        setScreen(null);
      } finally {
        setLoading(false);
        console.log('Loading complete');
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

  if (!screen.active) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Scherm is niet actief</h1>
          <p className="text-gray-400">
            Dit scherm is momenteel gedeactiveerd.
          </p>
        </div>
      </div>
    );
  }

  console.log('=== RENDERING SCREEN ===');
  console.log('Screen type:', screen.type);
  console.log('Screen members:', (screen as any).members?.length || 0);

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
        <AnnouncementsView config={screen.config as MededelingenConfig} />
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
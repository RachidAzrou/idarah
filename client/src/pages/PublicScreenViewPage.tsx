"use client";

import React, { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { PublicScreen, LedenlijstConfig, MededelingenConfig, MultimediaConfig } from "@/lib/mock/public-screens";
import { LedenlijstView } from "@/components/public-view/LedenlijstView";
import { AnnouncementsView } from "@/components/public-view/AnnouncementsView";
import { Controls } from "@/components/public-view/Controls";

export default function PublicScreenViewPage() {
  const [match, params] = useRoute("/public/screen/:publicToken");
  const publicToken = params?.publicToken;
  const [screen, setScreen] = useState<PublicScreen | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  
  console.log('=== Component Render ===', { publicToken, loading, screen: !!screen });
  

  const loadScreen = async () => {
    console.log('=== loadScreen called ===');
    console.log('publicToken:', publicToken);
    
    if (publicToken) {
      setLoading(true);
      try {
        // Add timestamp to force cache bypass
        const timestamp = new Date().getTime();
        const url = `/api/public-screens/token/${publicToken}?t=${timestamp}`;
        console.log('Fetching URL:', url);
        
        const response = await fetch(url, {
          method: 'GET',
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        console.log('Response status:', response.status);
        
        if (response.ok) {
          const screenData = await response.json();
          console.log('=== RAW API RESPONSE ===');
          console.log('Full response data:', JSON.stringify(screenData, null, 2));
          console.log('Response keys:', Object.keys(screenData));
          console.log('Members key exists:', 'members' in screenData);
          console.log('Members value:', screenData.members);
          console.log('Members length:', screenData.members?.length || 'undefined');
          
          // Force a fresh screen object to trigger React re-renders
          const freshScreen = {
            ...screenData,
            _loadTime: timestamp // Add unique property to force re-render
          };
          
          console.log('=== PROCESSED SCREEN OBJECT ===');
          console.log('Fresh screen members:', freshScreen.members);
          console.log('Fresh screen members length:', freshScreen.members?.length || 'undefined');
          
          setScreen(freshScreen);
        } else {
          console.log('Response not ok:', response.status, response.statusText);
          setScreen(null);
        }
      } catch (error) {
        console.error('Error loading screen:', error);
        setScreen(null);
      } finally {
        setLoading(false);
      }
    } else {
      console.log('No publicToken provided');
      setLoading(false);
    }
  };

  // IMMEDIATE DATA LOADING
  useEffect(() => {
    console.log('=== useEffect TRIGGERED ===', publicToken);
    if (publicToken) {
      console.log('Starting loadScreen...');
      loadScreen();
    }
  }, [publicToken]);

  // Update document title when screen data is loaded
  useEffect(() => {
    if (screen?.name) {
      document.title = screen.name;
    }
    // Reset title when component unmounts
    return () => {
      document.title = 'Ledenbeheer';
    };
  }, [screen?.name]);

  useEffect(() => {
    // Auto-hide controls after 3 seconds
    const timer = setTimeout(() => {
      setShowControls(false);
    }, 3000);

    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timer);
      setTimeout(() => setShowControls(false), 3000);
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'f':
          e.preventDefault();
          handleFullscreen();
          break;
        case ' ':
          e.preventDefault();
          // Handle play/pause - will be implemented per type
          break;
        case 'r':
          e.preventDefault();
          // Refresh data instead of reloading page
          setLoading(true);
          loadScreen();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
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

  return (
    <div className="min-h-screen relative">
      {/* Main Content */}
      {screen.type === 'LEDENLIJST' && (() => {
        console.log('=== Rendering LedenlijstView ===');
        console.log('Screen object:', screen);
        console.log('Members from screen:', (screen as any).members);
        console.log('Members length:', (screen as any).members?.length || 0);
        return (
          <LedenlijstView 
            key={`${screen.id}-${(screen as any).members?.length || 0}`}
            config={screen.config as LedenlijstConfig} 
            members={(screen as any).members || []}
          />
        );
      })()}
      
      {screen.type === 'MEDEDELINGEN' && (
        <AnnouncementsView config={screen.config as MededelingenConfig} />
      )}
      
      {screen.type === 'MULTIMEDIA' && (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <p className="text-gray-600">Multimedia viewer komt binnenkort...</p>
        </div>
      )}

      {/* Controls Overlay */}
      <Controls
        screen={screen}
        isFullscreen={isFullscreen}
        showControls={showControls}
        onFullscreen={handleFullscreen}
        onRefresh={() => {
          console.log('Refreshing screen manually...');
          loadScreen();
        }}
      />
    </div>
  );
}
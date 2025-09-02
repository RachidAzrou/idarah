"use client";

import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { LedenlijstView } from "@/components/public-view/LedenlijstView";
import { publicScreensStore } from "@/lib/mock/public-screens";

export function PublicViewPage() {
  const { screenId } = useParams();
  const [screen, setScreen] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load screen data
    const loadScreen = () => {
      try {
        const allScreens = publicScreensStore.list();
        const foundScreen = allScreens.find(s => s.id === screenId);
        setScreen(foundScreen);
      } catch (error) {
        console.error('Error loading screen:', error);
      } finally {
        setLoading(false);
      }
    };

    loadScreen();

    // Auto-refresh every 5 minutes (300,000ms)
    const refreshInterval = setInterval(loadScreen, 300000);

    return () => clearInterval(refreshInterval);
  }, [screenId]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Scherm laden...</p>
        </div>
      </div>
    );
  }

  // Show error if screen not found
  if (!screen) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Scherm niet gevonden</h1>
          <p className="text-gray-600">Het opgevraagde scherm bestaat niet of is niet actief.</p>
        </div>
      </div>
    );
  }

  // Render based on screen type
  const renderScreen = () => {
    switch (screen.type) {
      case 'LEDENLIJST':
        return (
          <LedenlijstView 
            config={screen.config}
            titleStyling={screen.config?.title || { 
              text: screen.name, 
              fontSize: 36, 
              fontFamily: 'Poppins', 
              color: '#1f2937', 
              fontWeight: 'bold' 
            }}
            subtitleStyling={screen.config?.subtitle || { 
              text: '', 
              fontSize: 24, 
              fontFamily: 'Poppins', 
              color: '#6b7280', 
              fontWeight: 'normal' 
            }}
          />
        );
      
      case 'MEDEDELINGEN':
        return (
          <div className="min-h-screen bg-white p-8">
            <div className="max-w-4xl mx-auto text-center">
              <h1 
                style={{
                  fontSize: `${screen.config?.title?.fontSize || 36}px`,
                  fontFamily: screen.config?.title?.fontFamily || 'Poppins',
                  color: screen.config?.title?.color || '#1f2937',
                  fontWeight: screen.config?.title?.fontWeight || 'bold'
                }}
                className="mb-4"
              >
                {screen.config?.title?.text || screen.name}
              </h1>
              {screen.config?.subtitle?.text && (
                <h2
                  style={{
                    fontSize: `${screen.config?.subtitle?.fontSize || 24}px`,
                    fontFamily: screen.config?.subtitle?.fontFamily || 'Poppins',
                    color: screen.config?.subtitle?.color || '#6b7280',
                    fontWeight: screen.config?.subtitle?.fontWeight || 'normal'
                  }}
                  className="mb-8"
                >
                  {screen.config?.subtitle?.text}
                </h2>
              )}
              <div className="text-gray-600">
                <p className="text-lg">Mededelingen scherm</p>
                <p className="text-sm mt-2">Wordt automatisch ververst elke 5 minuten</p>
              </div>
            </div>
          </div>
        );
      
      case 'MULTIMEDIA':
        return (
          <div className="min-h-screen bg-black p-8">
            <div className="max-w-4xl mx-auto text-center">
              <h1 
                style={{
                  fontSize: `${screen.config?.title?.fontSize || 36}px`,
                  fontFamily: screen.config?.title?.fontFamily || 'Poppins',
                  color: screen.config?.title?.color || '#ffffff',
                  fontWeight: screen.config?.title?.fontWeight || 'bold'
                }}
                className="mb-4"
              >
                {screen.config?.title?.text || screen.name}
              </h1>
              {screen.config?.subtitle?.text && (
                <h2
                  style={{
                    fontSize: `${screen.config?.subtitle?.fontSize || 24}px`,
                    fontFamily: screen.config?.subtitle?.fontFamily || 'Poppins',
                    color: screen.config?.subtitle?.color || '#9ca3af',
                    fontWeight: screen.config?.subtitle?.fontWeight || 'normal'
                  }}
                  className="mb-8"
                >
                  {screen.config?.subtitle?.text}
                </h2>
              )}
              <div className="text-gray-400">
                <p className="text-lg">Multimedia scherm</p>
                <p className="text-sm mt-2">Wordt automatisch ververst elke 5 minuten</p>
              </div>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Onbekend schermtype</h1>
              <p className="text-gray-600">Dit schermtype wordt nog niet ondersteund.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen" data-testid="public-view-screen">
      {renderScreen()}
      
      {/* Auto-refresh indicator */}
      <div className="fixed bottom-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-xs">
        Auto-refresh: 5 min
      </div>
    </div>
  );
}
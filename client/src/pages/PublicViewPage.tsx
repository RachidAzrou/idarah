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
        const defaultConfig = {
          description: screen.name,
          title: screen.config?.title || { 
            text: screen.name, 
            fontSize: 36, 
            fontFamily: 'Poppins', 
            color: '#1f2937', 
            fontWeight: 'bold' 
          },
          subtitle: screen.config?.subtitle || { 
            text: '', 
            fontSize: 24, 
            fontFamily: 'Poppins', 
            color: '#6b7280', 
            fontWeight: 'normal' 
          },
          display: {
            useFullNames: screen.config?.ledenlijstSettings?.useFullNames ?? true,
            useInitials: screen.config?.ledenlijstSettings?.useInitials ?? false,
            filterByCategories: screen.config?.ledenlijstSettings?.filterByCategories ?? true,
            showVotingRights: screen.config?.ledenlijstSettings?.showVotingRights ?? false,
            rowsPerPage: screen.config?.ledenlijstSettings?.rowsPerPage ?? 20,
          },
          year: screen.config?.ledenlijstSettings?.year ?? new Date().getFullYear(),
          categories: screen.config?.ledenlijstSettings?.categories ?? ['Student', 'Standaard']
        };
        
        return (
          <LedenlijstView 
            config={defaultConfig}
          />
        );
      
      case 'MEDEDELINGEN':
        return (
          <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-20 right-20 w-80 h-80 bg-purple-400 rounded-full filter blur-3xl"></div>
              <div className="absolute bottom-20 left-20 w-96 h-96 bg-blue-400 rounded-full filter blur-3xl"></div>
            </div>
            
            <div className="relative z-10 p-8">
              <div className="max-w-4xl mx-auto text-center">
                <div className="backdrop-blur-lg bg-white/30 rounded-3xl p-12 shadow-2xl border border-white/20 mb-12">
                  <h1 
                    style={{
                      fontSize: `${screen.config?.title?.fontSize || 48}px`,
                      fontFamily: screen.config?.title?.fontFamily || 'Poppins',
                      color: screen.config?.title?.color || '#1f2937',
                      fontWeight: screen.config?.title?.fontWeight || 'bold'
                    }}
                    className="mb-6 drop-shadow-sm"
                  >
                    {screen.config?.title?.text || screen.name}
                  </h1>
                  {screen.config?.subtitle?.text && (
                    <h2
                      style={{
                        fontSize: `${screen.config?.subtitle?.fontSize || 28}px`,
                        fontFamily: screen.config?.subtitle?.fontFamily || 'Poppins',
                        color: screen.config?.subtitle?.color || '#6b7280',
                        fontWeight: screen.config?.subtitle?.fontWeight || 'normal'
                      }}
                      className="mb-8 drop-shadow-sm"
                    >
                      {screen.config?.subtitle?.text}
                    </h2>
                  )}
                  <div className="text-gray-700">
                    <p className="text-xl font-medium mb-4">📢 Mededelingen Scherm</p>
                    <p className="text-sm opacity-75">Automatische verversing elke 5 minuten</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'MULTIMEDIA':
        return (
          <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-10 left-10 w-72 h-72 bg-blue-500 rounded-full filter blur-3xl"></div>
              <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-green-500 rounded-full filter blur-3xl"></div>
            </div>
            
            <div className="relative z-10 p-8">
              <div className="max-w-4xl mx-auto text-center">
                <div className="backdrop-blur-lg bg-white/10 rounded-3xl p-12 shadow-2xl border border-white/20 mb-12">
                  <h1 
                    style={{
                      fontSize: `${screen.config?.title?.fontSize || 48}px`,
                      fontFamily: screen.config?.title?.fontFamily || 'Poppins',
                      color: screen.config?.title?.color || '#ffffff',
                      fontWeight: screen.config?.title?.fontWeight || 'bold'
                    }}
                    className="mb-6 drop-shadow-lg"
                  >
                    {screen.config?.title?.text || screen.name}
                  </h1>
                  {screen.config?.subtitle?.text && (
                    <h2
                      style={{
                        fontSize: `${screen.config?.subtitle?.fontSize || 28}px`,
                        fontFamily: screen.config?.subtitle?.fontFamily || 'Poppins',
                        color: screen.config?.subtitle?.color || '#e5e7eb',
                        fontWeight: screen.config?.subtitle?.fontWeight || 'normal'
                      }}
                      className="mb-8 drop-shadow-lg"
                    >
                      {screen.config?.subtitle?.text}
                    </h2>
                  )}
                  <div className="text-gray-300">
                    <p className="text-xl font-medium mb-4">🎬 Multimedia Scherm</p>
                    <p className="text-sm opacity-75">Automatische verversing elke 5 minuten</p>
                  </div>
                </div>
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
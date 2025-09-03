import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { MembershipCard } from "@/components/card/MembershipCard";
import { CardCanvas } from "@/components/card/CardCanvas";
import { AspectBox } from "@/components/card/AspectBox";
import { InstallCoach, useInstallCoach } from "@/components/pwa/InstallCoach";
import { useQuery } from "@tanstack/react-query";

interface CardData {
  firstName: string;
  lastName: string;
  memberNumber: string;
  category: 'STUDENT' | 'STANDAARD' | 'SENIOR';
  status: 'ACTUEEL' | 'NIET_ACTUEEL' | 'VERLOPEN';
  validUntil: Date | null;
  badges: string[];
  qrToken: string;
  tenant: {
    name: string;
    logoUrl?: string | null;
    primaryColor: string;
  };
  etag: string;
}

export function CardPage() {
  const [, params] = useRoute("/card/:memberId");
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isFlipping, setIsFlipping] = useState(false);
  const installCoach = useInstallCoach();

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch card data from the new API endpoint
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/card', params?.memberId],
    queryFn: async () => {
      if (!params?.memberId) return null;
      
      const response = await fetch(`/api/card/${params.memberId}`);
      if (!response.ok) {
        throw new Error('Card not found');
      }
      
      const cardData = await response.json();
      
      // Convert dates from ISO strings
      return {
        ...cardData,
        validUntil: cardData.validUntil ? new Date(cardData.validUntil) : null
      };
    },
    enabled: !!params?.memberId,
    retry: (failureCount, error: any) => {
      // Don't retry if offline or if it's a 404
      if (!navigator.onLine || error?.message === 'Card not found') {
        return false;
      }
      return failureCount < 3;
    }
  });

  const handleRefresh = () => {
    console.log('PWA handleRefresh called - triggering flip animation');
    setIsFlipping(true);
    setTimeout(() => {
      setIsFlipping(false);
      console.log('PWA flip animation ended');
    }, 800);
    refetch();
  };

  if (!params?.memberId) {
    return (
      <CardCanvas>
        <div className="h-full w-full flex items-center justify-center text-center text-white/80">
          <div>
            <h1 className="text-2xl font-bold mb-2">Geen lid geselecteerd</h1>
            <p>Selecteer een lid om de digitale kaart te bekijken.</p>
          </div>
        </div>
      </CardCanvas>
    );
  }

  if (isLoading) {
    return (
      <CardCanvas>
        <div className="h-full w-full flex items-center justify-center text-center text-white/80">
          <div>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <p>Lidkaart laden...</p>
          </div>
        </div>
      </CardCanvas>
    );
  }

  if (error || !data) {
    return (
      <CardCanvas>
        <div className="h-full w-full flex items-center justify-center text-center text-white/80">
          <div>
            <h1 className="text-2xl font-bold mb-2">Lidkaart niet gevonden</h1>
            <p>De opgevraagde lidkaart bestaat niet of is niet beschikbaar.</p>
          </div>
        </div>
      </CardCanvas>
    );
  }

  // Handle offline status - if offline or fetch failed, show NIET_ACTUEEL
  const displayData = data ? {
    ...data,
    status: (isOffline || error) ? 'NIET_ACTUEEL' as const : data.status
  } : null;

  return (
    <CardCanvas>
      {/* Refresh Button - Top Right */}
      {displayData && (
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="fixed top-6 right-6 z-50 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full p-3 text-white transition-all"
          data-testid="refresh-button-top"
          aria-label="Ververs kaart"
        >
          <svg 
            className={`w-6 h-6 ${isLoading ? 'animate-spin' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      )}

      {/* Offline Banner */}
      {(isOffline || error) && (
        <div 
          className="fixed top-6 left-6 right-6 bg-orange-500 text-white px-4 py-3 rounded-lg shadow-lg z-50 text-center"
          data-testid="offline-banner"
        >
          <span className="text-sm font-medium">
            Offline – status niet bevestigd
          </span>
        </div>
      )}
      
      <AspectBox>
        {displayData ? (
          <MembershipCard
            cardData={displayData}
            onRefresh={handleRefresh}
            isRefreshing={isFlipping || isLoading}
            isOffline={isOffline || !!error}
            className="w-full h-full"
          />
        ) : (
          <div className="w-full h-full rounded-3xl bg-gray-800 flex items-center justify-center text-white">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
              <p>Lidkaart laden...</p>
            </div>
          </div>
        )}
      </AspectBox>
      
      <InstallCoach 
        isOpen={installCoach.isOpen} 
        onClose={installCoach.close} 
      />
    </CardCanvas>
  );
}
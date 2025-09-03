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
      {/* Offline Banner */}
      {(isOffline || error) && (
        <div 
          className="fixed top-4 left-4 right-4 bg-orange-500 text-white px-4 py-3 rounded-lg shadow-lg z-50 text-center"
          data-testid="offline-banner"
        >
          <span className="text-sm font-medium">
            Offline – status niet bevestigd
          </span>
        </div>
      )}
      
      {displayData ? (
        <AspectBox>
          <MembershipCard
            cardData={displayData}
            onRefresh={handleRefresh}
            isRefreshing={isLoading}
            isOffline={isOffline || !!error}
            className="w-full h-full"
          />
        </AspectBox>
      ) : (
        <AspectBox>
          <div className="w-full h-full rounded-3xl bg-gray-800 flex items-center justify-center text-white">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
              <p>Lidkaart laden...</p>
            </div>
          </div>
        </AspectBox>
      )}
      
      <InstallCoach 
        isOpen={installCoach.isOpen} 
        onClose={installCoach.close} 
      />
    </CardCanvas>
  );
}
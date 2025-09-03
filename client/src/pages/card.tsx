import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { LiveCard } from "@/components/cards/live-card";
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
      
      {displayData ? (
        <div className="relative aspect-[16/10] rounded-lg overflow-hidden">
          <CardCanvas className="rounded-lg">
            <LiveCard
              member={{
                id: params?.memberId || '',
                tenantId: displayData.tenant.name,
                memberNumber: displayData.memberNumber,
                firstName: displayData.firstName,
                lastName: displayData.lastName,
                gender: 'M',
                birthDate: null,
                category: displayData.category,
                email: null,
                phone: null,
                street: null,
                number: null,
                bus: null,
                postalCode: null,
                city: null,
                country: null,
                active: true,
                votingRights: displayData.badges.includes('Stemgerechtigd'),
                createdAt: new Date(),
              }}
              cardMeta={{
                id: 'card-id',
                tenantId: 'tenant-id',
                memberId: params?.memberId || '',
                version: 1,
                etag: displayData.etag,
                secureToken: 'secure-token',
                qrToken: displayData.qrToken,
                status: displayData.status,
                validUntil: displayData.validUntil,
                lastRenderedAt: new Date(),
              }}
              tenant={{
                id: 'tenant-id',
                name: displayData.tenant.name,
                slug: 'tenant-slug',
                street: null,
                number: null,
                postalCode: null,
                city: null,
                country: 'België',
                email: null,
                phone: null,
                website: null,
                companyNumber: null,
                companyType: null,
                logoUrl: displayData.tenant.logoUrl,
                primaryColor: displayData.tenant.primaryColor,
                studentFee: '15.00',
                adultFee: '25.00',
                seniorFee: '20.00',
                defaultPaymentTerm: 'YEARLY',
                defaultPaymentMethod: 'SEPA',
                createdAt: new Date(),
              }}
              onRefresh={handleRefresh}
              isRefreshing={isLoading}
              standalone={true}
              className="h-full w-full"
            />
          </CardCanvas>
        </div>
      ) : (
        <div className="relative aspect-[16/10] rounded-lg overflow-hidden">
          <CardCanvas className="rounded-lg">
            <div className="w-full h-full flex items-center justify-center text-white">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                <p>Lidkaart laden...</p>
              </div>
            </div>
          </CardCanvas>
        </div>
      )}
      
      <InstallCoach 
        isOpen={installCoach.isOpen} 
        onClose={installCoach.close} 
      />
    </CardCanvas>
  );
}
import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { LiveCard } from "@/components/cards/live-card";
import { CardCanvas } from "@/components/card/CardCanvas";
import { Loader2 } from "lucide-react";
import type { Member, CardMeta, Tenant } from "@shared/schema";
import backgroundImage from "@assets/de-lege-achtergrond-van-de-fotograafstudio-samenvatting-achtergrondtextuur-van-schoonheid-donker-en-licht-duidelijk-blauw-koud-grijs-sneeuwwit-gradient-vlakke-muur-en-vloer_1757088942721.jpg";
// Interface for the public card API response
interface PublicCardData {
  memberId: string;
  firstName: string;
  lastName: string;
  memberNumber: string;
  category: 'STUDENT' | 'STANDAARD' | 'SENIOR';
  votingRights: boolean;
  status: 'ACTUEEL' | 'NIET_ACTUEEL' | 'VERLOPEN';
  validUntil: Date | null;
  qrToken: string;
  tenant: {
    id: string;
    name: string;
    logoUrl: string | null;
  };
}

export default function PublicCard() {
  const { memberId } = useParams<{ memberId: string }>();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Set body background when component mounts
  useEffect(() => {
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.minHeight = '100vh';
    document.body.style.overflow = 'hidden';
    document.body.style.backgroundImage = `url(${backgroundImage})`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundRepeat = 'no-repeat';
    
    return () => {
      // Reset body styles when component unmounts
      document.body.style.margin = '';
      document.body.style.padding = '';
      document.body.style.minHeight = '';
      document.body.style.overflow = '';
      document.body.style.backgroundImage = '';
      document.body.style.backgroundSize = '';
      document.body.style.backgroundPosition = '';
      document.body.style.backgroundRepeat = '';
    };
  }, []);

  // Monitor online/offline status
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

  // Fetch card data - public endpoint (no auth required)
  const { data: cardData, isLoading, error, refetch, isRefetching } = useQuery<PublicCardData>({
    queryKey: [`/api/public/card/${memberId}`],
    enabled: !!memberId,
    staleTime: 10 * 1000, // 10 seconds
    retry: (failureCount, error) => {
      // Don't retry on 404 or 401 errors
      if (error && 'status' in error && (error.status === 404 || error.status === 401)) {
        return false;
      }
      return failureCount < 3;
    }
  });

  const handleRefresh = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
          <p className="text-white text-lg">Lidkaart laden...</p>
        </div>
      </div>
    );
  }

  if (error || !cardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Lidkaart niet gevonden</h1>
          <p className="text-gray-300 mb-6">
            Deze lidkaart bestaat niet of is niet beschikbaar.
          </p>
          <button
            onClick={() => window.close()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sluiten
          </button>
        </div>
      </div>
    );
  }

  // Transform API response to match LiveCard expectations
  const member: Member = {
    id: cardData.memberId,
    firstName: cardData.firstName,
    lastName: cardData.lastName,
    memberNumber: cardData.memberNumber,
    category: cardData.category,
    votingRights: cardData.votingRights,
    active: true,
    tenantId: cardData.tenant.id,
    email: '',
    phoneNumber: null,
    address: null,
    birthDate: null,
    joinDate: new Date(),
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const cardMeta: CardMeta = {
    id: '',
    memberId: cardData.memberId,
    tenantId: cardData.tenant.id,
    qrToken: cardData.qrToken,
    status: cardData.status,
    validUntil: cardData.validUntil,
    etag: '',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const tenant: Tenant = {
    id: cardData.tenant.id,
    name: cardData.tenant.name,
    slug: '',
    logoUrl: cardData.tenant.logoUrl,
    primaryColor: '#bb2e2e',
    description: null,
    contactEmail: '',
    contactPhone: null,
    address: null,
    website: null,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  return (
    <div className="w-full h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-5xl">
        <div className="space-y-4">
          <CardCanvas className="rounded-lg">
            <LiveCard
              member={member}
              cardMeta={cardMeta}
              tenant={tenant}
              onRefresh={handleRefresh}
              isRefreshing={isRefetching}
              standalone={true}
              className="h-full w-full"
            />
          </CardCanvas>
          
          {/* Footer info */}
          <div className="text-center text-white/80">
            <p className="text-sm">
              Publieke lidkaart weergave • {tenant.name}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
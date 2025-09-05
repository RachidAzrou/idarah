import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { MembershipCard } from "@/components/card/MembershipCard";
import { Loader2 } from "lucide-react";
// Define CardData interface locally for this component
interface CardData {
  memberId: string;
  firstName: string;
  lastName: string;
  memberNumber: string;
  category: string;
  votingRights: boolean;
  status: string;
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
  const { data: cardData, isLoading, error, refetch, isRefetching } = useQuery<CardData>({
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div 
          className="w-full aspect-[1.586/1] max-w-md mx-auto"
          style={{ minHeight: '300px' }}
        >
          <MembershipCard
            cardData={cardData}
            onRefresh={handleRefresh}
            isRefreshing={isRefetching}
            isOffline={isOffline}
            className="w-full h-full"
          />
        </div>
        
        {/* Footer info */}
        <div className="text-center mt-6 text-gray-400">
          <p className="text-sm">
            Publieke lidkaart weergave • {cardData.tenant.name}
          </p>
        </div>
      </div>
    </div>
  );
}
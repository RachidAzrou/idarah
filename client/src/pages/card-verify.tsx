import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, AlertTriangle, Wifi, WifiOff, Clock, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface CardVerificationData {
  status: 'ACTUEEL' | 'NIET_ACTUEEL' | 'VERLOPEN';
  validUntil: string | null;
  eligibleToVote: boolean;
  member: {
    name: string;
    memberNumber: string;
    category: string;
  };
  tenant: {
    name: string;
    logoUrl: string | null;
  };
  refreshedAt: string;
  etag: string;
}

interface CardVerifyPageProps {
  params: { qrToken: string };
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig = {
    ACTUEEL: {
      color: 'bg-green-500 text-white',
      icon: CheckCircle2,
      label: 'Actueel',
    },
    NIET_ACTUEEL: {
      color: 'bg-orange-500 text-white',
      icon: AlertTriangle,
      label: 'Niet actueel',
    },
    VERLOPEN: {
      color: 'bg-red-500 text-white',
      icon: XCircle,
      label: 'Verlopen',
    },
  };

  const config = statusConfig[status as keyof typeof statusConfig];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <Badge className={cn("text-sm font-medium px-3 py-1.5 gap-2", config.color)}>
      <Icon className="h-4 w-4" />
      {config.label}
    </Badge>
  );
}

function VerificationView({ qrToken }: { qrToken: string }) {
  const [data, setData] = useState<CardVerificationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      
      const response = await fetch(`/api/card/verify/${qrToken}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Er ging iets mis');
      }
      
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Refetch on window focus
    const handleFocus = () => {
      if (!loading && !refreshing) {
        fetchData(true);
      }
    };
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !loading && !refreshing) {
        fetchData(true);
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [qrToken]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="flex items-center gap-2 text-muted-foreground">
          <RefreshCw className="h-5 w-5 animate-spin" />
          Verificatie laden...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <XCircle className="h-12 w-12 text-red-500 mx-auto" />
            <div>
              <h3 className="font-semibold text-lg">Verificatie mislukt</h3>
              <p className="text-muted-foreground mt-1">{error}</p>
            </div>
            <Button 
              onClick={() => fetchData()} 
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Opnieuw proberen
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const refreshedTime = new Date(data.refreshedAt).toLocaleTimeString('nl-BE', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Brussels'
  });

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="text-xl">Lidkaart verificatie</CardTitle>
            <StatusBadge status={data.status} />
          </div>
          {data.tenant.logoUrl && (
            <img 
              src={data.tenant.logoUrl} 
              alt={data.tenant.name}
              className="h-12 w-auto opacity-90"
            />
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Member Details */}
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Naam</label>
            <p className="text-lg font-semibold">{data.member.name}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Lidnummer</label>
              <p className="font-mono text-sm">{data.member.memberNumber}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Categorie</label>
              <p className="text-sm">{data.member.category}</p>
            </div>
          </div>
          
          {data.validUntil && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Geldig tot</label>
              <p className="text-sm font-mono">{data.validUntil}</p>
            </div>
          )}
          
          {data.eligibleToVote && (
            <div>
              <Badge variant="secondary" className="w-fit">
                Stemgerechtigd
              </Badge>
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Laatst geverifieerd: {refreshedTime}</span>
            <span>v{data.etag}</span>
          </div>
          {refreshing && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
              <RefreshCw className="h-3 w-3 animate-spin" />
              Verversing...
            </div>
          )}
        </div>

        {/* Refresh Button */}
        <Button 
          onClick={() => fetchData(true)} 
          variant="outline"
          size="sm"
          className="w-full gap-2"
          disabled={refreshing}
        >
          <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          Ververs status
        </Button>
      </CardContent>
    </Card>
  );
}

export default function CardVerifyPage({ params }: CardVerifyPageProps) {
  const { qrToken } = params;

  return (
    <div 
      className="min-h-screen w-full relative overflow-hidden flex items-center justify-center p-4"
      style={{
        background: `radial-gradient(circle at 50% 40%, #0B2440 0%, #0E3A6E 45%, #0B2440 100%), radial-gradient(circle at 50% 50%, transparent 40%, rgba(0,0,0,0.3) 100%), linear-gradient(135deg, rgba(255,255,255,0.02) 0%, transparent 50%, rgba(0,0,0,0.05) 100%)`
      }}
    >
      <VerificationView qrToken={qrToken} />
    </div>
  );
}
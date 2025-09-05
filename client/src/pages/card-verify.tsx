import { useState, useEffect, useRef, useCallback } from "react";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Calendar,
  User,
  Users,
  Crown,
  QrCode,
  Scan
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MembershipCard } from "@/components/card/MembershipCard";
import { QuickAuthModal } from "@/components/auth/quick-auth-modal";
import QrScanner from "qr-scanner";
import backgroundImage from "@assets/Luxury Navy Background_1757015851301.jpg";

interface CardVerificationData {
  status: string;
  validUntil: string | null;
  eligibleToVote: boolean;
  member: {
    name: string;
    memberNumber: string;
    category: string;
    age: number | null;
  };
  tenant: {
    name: string;
    logoUrl?: string;
  };
  fees: Array<{
    id: string;
    period: string;
    amount: number;
    status: string;
    periodEnd: string;
    paidAt: string | null;
  }>;
  paymentStatus: {
    summary: string;
    details: string[];
    totalOutstanding: number;
    totalPaid: number;
    hasOutstanding: boolean;
  };
  refreshedAt: string;
  etag: string;
}

const STATUS_CONFIG = {
  ACTUEEL: {
    label: "Actueel",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle
  },
  VERLOPEN: {
    label: "Verlopen", 
    color: "bg-red-100 text-red-800 border-red-200",
    icon: XCircle
  },
  INGETROKKEN: {
    label: "Ingetrokken",
    color: "bg-gray-100 text-gray-800 border-gray-200", 
    icon: XCircle
  },
  UNKNOWN: {
    label: "Onbekend",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: AlertTriangle
  }
} as const;

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.UNKNOWN;
  const Icon = config.icon;

  return (
    <Badge className={cn("text-sm font-medium px-3 py-1.5 gap-2", config.color)}>
      <Icon className="h-4 w-4" />
      {config.label}
    </Badge>
  );
}

function VerificationView({ qrToken }: { qrToken: string }) {
  // ALL HOOKS DECLARED AT THE TOP - NEVER CONDITIONAL
  const [data, setData] = useState<CardVerificationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authUser, setAuthUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);

  // Stable fetch function
  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      
      const verifyToken = sessionStorage.getItem('qr_verify_token');
      const response = await fetch(`/api/card/verify/${qrToken}`, {
        headers: {
          'Authorization': `Bearer ${verifyToken}`,
        },
      });
      
      if (response.status === 401) {
        setIsAuthenticated(false);
        setShowAuthModal(true);
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
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
  }, [qrToken]);

  const handleAuthenticated = useCallback((token: string) => {
    setIsAuthenticated(true);
    setShowAuthModal(false);
    
    const userJson = sessionStorage.getItem('qr_verify_user');
    if (userJson) {
      setAuthUser(JSON.parse(userJson));
    }
    
    fetchData();
  }, [fetchData]);

  const handleLogout = useCallback(() => {
    sessionStorage.removeItem('qr_verify_token');
    sessionStorage.removeItem('qr_verify_user');
    setIsAuthenticated(false);
    setAuthUser(null);
    setData(null);
    setShowAuthModal(true);
  }, []);

  const stopScanning = useCallback(() => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    setScanning(false);
    setShowScanner(false);
  }, []);

  const startScanning = useCallback(async () => {
    if (!videoRef.current) return;
    
    try {
      setScanning(true);
      setShowScanner(true);
      
      qrScannerRef.current = new QrScanner(
        videoRef.current,
        (result) => {
          const qrCodeText = result.data;
          // Support both old and new URL patterns
          const urlMatch = qrCodeText.match(/\/card\/(?:verify\/)?([a-f0-9]+)/);
          if (urlMatch && urlMatch[1]) {
            const newToken = urlMatch[1];
            stopScanning();
            window.location.href = `/card/verify/${newToken}`;
          }
        },
        {
          returnDetailedScanResult: true,
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      );
      
      await qrScannerRef.current.start();
      setScanning(true);
    } catch (err) {
      console.error('Failed to start QR scanner:', err);
      setScanning(false);
      setShowScanner(false);
    }
  }, [stopScanning]);

  // Check for existing auth on load
  useEffect(() => {
    const token = sessionStorage.getItem('qr_verify_token');
    const userJson = sessionStorage.getItem('qr_verify_user');
    
    if (token && userJson) {
      setIsAuthenticated(true);
      setAuthUser(JSON.parse(userJson));
      fetchData();
    } else {
      setIsAuthenticated(false);
      setShowAuthModal(true);
      setLoading(false);
    }
    setAuthChecked(true);
  }, [fetchData]);

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, [stopScanning]);

  // Show auth modal if not authenticated
  if (!authChecked || (!isAuthenticated && showAuthModal)) {
    return (
      <QuickAuthModal
        isOpen={showAuthModal}
        onAuthenticated={handleAuthenticated}
      />
    );
  }

  if (loading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
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

  if (!data) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto" />
            <div>
              <h3 className="font-semibold text-lg">Geen gegevens gevonden</h3>
              <p className="text-muted-foreground mt-1">Er konden geen verificatiegegevens worden geladen.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="text-2xl font-bold">Lidkaart Verificatie</CardTitle>
            <p className="text-muted-foreground">Controle van digitale lidkaart</p>
          </div>
          
          <div className="flex items-center gap-2">
            {authUser && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                {authUser.name}
              </div>
            )}
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
            >
              Uitloggen
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Verification Result */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {data.status === 'ACTUEEL' ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                Verificatie {data.status === 'ACTUEEL' ? 'Gelukt' : 'Mislukt'}
              </CardTitle>
              <StatusBadge status={data.status || 'UNKNOWN'} />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  Lid
                </div>
                <p className="font-medium">
                  {data.member.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  Lidnummer: {data.member.memberNumber}
                </p>
                <div className="flex gap-4 text-sm">
                  <span className="text-muted-foreground">Categorie:</span>
                  <span className="font-medium">{data.member.category}</span>
                </div>
                {data.member.age && (
                  <div className="flex gap-4 text-sm">
                    <span className="text-muted-foreground">Leeftijd:</span>
                    <span className="font-medium">{data.member.age} jaar</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Geldigheid
                </div>
                <p className="text-sm">
                  <span className="text-muted-foreground">Geldig tot:</span> {data.validUntil || 'Onbekend'}
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">Stemgerechtigd:</span> {data.eligibleToVote ? 'Ja' : 'Nee'}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Crown className="h-4 w-4" />
                  Betaalstatus
                </div>
                <div className={`p-3 rounded-lg border ${
                  data.paymentStatus.hasOutstanding 
                    ? 'bg-orange-50 border-orange-200 text-orange-800' 
                    : 'bg-green-50 border-green-200 text-green-800'
                }`}>
                  <p className="font-medium text-sm">
                    {data.paymentStatus.summary}
                  </p>
                  {data.paymentStatus.hasOutstanding && data.paymentStatus.details && data.paymentStatus.details.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {data.paymentStatus.details.map((detail, index) => (
                        <p key={index} className="text-xs opacity-90 leading-relaxed">
                          {detail}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Users className="h-4 w-4" />
                Organisatie
              </div>
              <div className="flex items-center gap-3">
                {data.tenant.logoUrl && (
                  <img 
                    src={data.tenant.logoUrl} 
                    alt={data.tenant.name}
                    className="h-8 w-auto"
                  />
                )}
                <span className="font-medium">{data.tenant.name}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            {refreshing ? 'Vernieuwen...' : 'Vernieuwen'}
          </Button>
          
          <Button
            onClick={startScanning}
            variant="outline"
            className="gap-2"
          >
            <Scan className="h-4 w-4" />
            Andere QR Scannen
          </Button>
        </div>

        {/* QR Scanner Modal */}
        {showScanner && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="max-w-sm w-full mx-4">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">QR Code Scannen</h3>
                  <Button
                    onClick={stopScanning}
                    variant="ghost"
                    size="sm"
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="relative">
                  <video
                    ref={videoRef}
                    className="w-full rounded-lg bg-black"
                    style={{ aspectRatio: '1' }}
                  />
                  {scanning && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-white text-sm bg-black/50 px-2 py-1 rounded">
                        Zoeken naar QR code...
                      </div>
                    </div>
                  )}
                </div>
                
                <p className="text-sm text-muted-foreground text-center">
                  Richt de camera op een QR code om een andere lidkaart te verifiëren
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function CardVerifyPage() {
  const [, params] = useRoute("/card/verify/:qrToken");
  const qrToken = params?.qrToken;

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: `url("${backgroundImage}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Background overlay */}
      <div className="absolute inset-0 bg-black/30"></div>
      
      <div className="relative z-10 w-full max-w-4xl">
        {!qrToken ? (
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <QrCode className="h-12 w-12 text-muted-foreground mx-auto" />
                <div>
                  <h3 className="font-semibold text-lg">Ongeldige QR Code</h3>
                  <p className="text-muted-foreground mt-1">De QR code kon niet worden gelezen.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <VerificationView qrToken={qrToken} />
        )}
      </div>
    </div>
  );
}
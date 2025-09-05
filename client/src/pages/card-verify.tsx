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

interface CardVerificationData {
  isValid: boolean;
  member: {
    id: string;
    firstName: string;
    lastName: string;
    memberNumber: string;
  };
  card: {
    status: string;
    expiryDate: string;
    issuedDate: string;
  };
  tenant: {
    id: string;
    name: string;
    logoUrl?: string;
  };
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig = {
    ACTUEEL: {
      color: 'bg-green-500 text-white',
      icon: CheckCircle,
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
    } catch (error) {
      console.error('Failed to start QR scanner:', error);
      setScanning(false);
      setShowScanner(false);
    }
  }, [stopScanning]);

  // Auth check effect - runs once on mount
  useEffect(() => {
    const verifyToken = sessionStorage.getItem('qr_verify_token');
    const userJson = sessionStorage.getItem('qr_verify_user');
    
    if (verifyToken && userJson) {
      try {
        const user = JSON.parse(userJson);
        const authenticatedAt = new Date(user.authenticatedAt);
        const now = new Date();
        const hoursPassed = (now.getTime() - authenticatedAt.getTime()) / (1000 * 60 * 60);
        
        if (hoursPassed < 2) {
          setIsAuthenticated(true);
          setAuthUser(user);
          setAuthChecked(true);
          fetchData();
        } else {
          sessionStorage.removeItem('qr_verify_token');
          sessionStorage.removeItem('qr_verify_user');
          setShowAuthModal(true);
          setAuthChecked(true);
          setLoading(false);
        }
      } catch {
        setShowAuthModal(true);
        setAuthChecked(true);
        setLoading(false);
      }
    } else {
      setShowAuthModal(true);
      setAuthChecked(true);
      setLoading(false);
    }
  }, [fetchData]);

  // Window focus handlers - always runs, but only acts when authenticated
  useEffect(() => {
    const handleFocus = () => {
      if (isAuthenticated && !loading && !refreshing) {
        fetchData(true);
      }
    };
    
    const handleVisibilityChange = () => {
      if (isAuthenticated && document.visibilityState === 'visible' && !loading && !refreshing) {
        fetchData(true);
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, loading, refreshing, fetchData]);

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, [stopScanning]);

  // CONDITIONAL RENDERING ONLY AFTER ALL HOOKS
  if (!authChecked) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="flex items-center gap-2 text-muted-foreground">
          <RefreshCw className="h-5 w-5 animate-spin" />
          Verificatie initialiseren...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <QuickAuthModal
        isOpen={showAuthModal}
        onAuthenticated={handleAuthenticated}
      />
    );
  }

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

  if (!data) {
    return (
      <Card className="max-w-md mx-auto">
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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Lidkaart Verificatie</h1>
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

      {/* Verification Result */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {data.isValid ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                Verificatie {data.isValid ? 'Gelukt' : 'Mislukt'}
              </CardTitle>
              <StatusBadge status={data.card.status} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  Lid
                </div>
                <p className="font-medium">
                  {data.member.firstName} {data.member.lastName}
                </p>
                <p className="text-sm text-muted-foreground">
                  Lidnummer: {data.member.memberNumber}
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Geldigheid
                </div>
                <p className="text-sm">
                  <span className="text-muted-foreground">Uitgegeven:</span> {new Date(data.card.issuedDate).toLocaleDateString('nl-NL')}
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">Vervalt:</span> {new Date(data.card.expiryDate).toLocaleDateString('nl-NL')}
                </p>
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
            <div className="bg-background rounded-lg p-6 max-w-sm w-full mx-4">
              <div className="space-y-4">
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
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CardVerifyPage() {
  const [, params] = useRoute("/card/verify/:qrToken");
  const qrToken = params?.qrToken;

  if (!qrToken) {
    return (
      <Card className="max-w-md mx-auto mt-8">
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
    );
  }

  return <VerificationView qrToken={qrToken} />;
}
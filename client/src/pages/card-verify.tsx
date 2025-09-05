import { useState, useEffect, useRef, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle2, XCircle, AlertTriangle, Wifi, WifiOff, Clock, RefreshCw, Check, Euro, LogOut, User, QrCode, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { QuickAuthModal } from "@/components/auth/quick-auth-modal";
import QrScanner from "qr-scanner";

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
  fees?: Array<{
    id: string;
    period: string;
    amount: string;
    status: 'PAID' | 'OPEN' | 'OVERDUE';
    periodEnd: string;
    paidAt: string | null;
  }>;
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
  // All state hooks first - always called in same order
  const [data, setData] = useState<CardVerificationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authUser, setAuthUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scanning, setScanning] = useState(false);
  
  // All ref hooks second - always called in same order
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);

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
        // Niet geautoriseerd - toon login modal
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

  // Combined effect for authentication check and event listeners
  useEffect(() => {
    const verifyToken = sessionStorage.getItem('qr_verify_token');
    const userJson = sessionStorage.getItem('qr_verify_user');
    
    if (verifyToken && userJson) {
      try {
        const user = JSON.parse(userJson);
        const authenticatedAt = new Date(user.authenticatedAt);
        const now = new Date();
        const hoursPassed = (now.getTime() - authenticatedAt.getTime()) / (1000 * 60 * 60);
        
        // Token is valid for 2 hours
        if (hoursPassed < 2) {
          setIsAuthenticated(true);
          setAuthUser(user);
          fetchData();
        } else {
          // Token expired
          sessionStorage.removeItem('qr_verify_token');
          sessionStorage.removeItem('qr_verify_user');
          setShowAuthModal(true);
          setLoading(false);
        }
      } catch {
        setShowAuthModal(true);
        setLoading(false);
      }
    } else {
      setShowAuthModal(true);
      setLoading(false);
    }
  }, [qrToken, fetchData]);

  // Window focus and visibility handlers - separate effect
  useEffect(() => {
    if (!isAuthenticated) return;

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
  }, [isAuthenticated, loading, refreshing, fetchData]);

  const handleAuthenticated = useCallback((token: string) => {
    setIsAuthenticated(true);
    setShowAuthModal(false);
    
    const userJson = sessionStorage.getItem('qr_verify_user');
    if (userJson) {
      setAuthUser(JSON.parse(userJson));
    }
    
    // Fetch data after authentication
    fetchData();
  }, [fetchData]);

  const handleLogout = () => {
    sessionStorage.removeItem('qr_verify_token');
    sessionStorage.removeItem('qr_verify_user');
    setIsAuthenticated(false);
    setAuthUser(null);
    setData(null);
    setShowAuthModal(true);
  };

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

  if (!data) return null;

  const refreshedTime = new Date(data.refreshedAt).toLocaleTimeString('nl-BE', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Brussels'
  });

  // QR Scanner functions with useCallback
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
          // Extract token from QR code URL
          const urlMatch = qrCodeText.match(/\/card\/([a-f0-9]+)/);
          if (urlMatch && urlMatch[1]) {
            const newToken = urlMatch[1];
            stopScanning();
            // Navigate to new verification page
            window.location.href = `/card/${newToken}`;
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

  // Calculate payment status summary
  const getPaymentSummary = () => {
    if (!data.fees || data.fees.length === 0) {
      return { status: 'ok', message: 'Geen betaalinformatie beschikbaar' };
    }

    const openFees = data.fees.filter(fee => fee.status === 'OPEN');
    const overdueFees = data.fees.filter(fee => fee.status === 'OVERDUE');
    
    if (overdueFees.length > 0) {
      const totalOverdue = overdueFees.reduce((sum, fee) => sum + parseFloat(fee.amount), 0);
      return { 
        status: 'overdue', 
        message: `€${totalOverdue.toFixed(2)} vervallen`,
        count: overdueFees.length
      };
    }
    
    if (openFees.length > 0) {
      const totalOpen = openFees.reduce((sum, fee) => sum + parseFloat(fee.amount), 0);
      return { 
        status: 'open', 
        message: `€${totalOpen.toFixed(2)} openstaand`,
        count: openFees.length
      };
    }
    
    return { status: 'ok', message: 'Alle betalingen up-to-date' };
  };

  const paymentSummary = getPaymentSummary();

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, [stopScanning]);

  return (
    <>
      <Card className="max-w-lg mx-auto">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-4">
            <div className="space-y-2 flex-1">
              <div className="flex items-start justify-between">
                <CardTitle className="text-xl sm:text-2xl">Lidkaart verificatie</CardTitle>
                {authUser && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="text-xs gap-1 h-8"
                    data-testid="button-logout"
                  >
                    <LogOut className="h-3 w-3" />
                    Uitloggen
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={data.status} />
                {data.tenant.name && (
                  <span className="text-sm text-gray-600">{data.tenant.name}</span>
                )}
              </div>
              {authUser && (
                <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  <User className="h-3 w-3" />
                  <span>{authUser.name} ({authUser.role})</span>
                </div>
              )}
            </div>
            {data.tenant.logoUrl && (
              <img 
                src={data.tenant.logoUrl} 
                alt={data.tenant.name}
                className="h-12 sm:h-16 w-auto opacity-90"
              />
            )}
          </div>
        </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Payment Status Summary */}
        <div className="p-3 rounded-lg border-l-4 bg-gray-50" style={{
          borderLeftColor: paymentSummary.status === 'overdue' ? '#dc2626' : 
                          paymentSummary.status === 'open' ? '#ea580c' : '#16a34a',
          backgroundColor: paymentSummary.status === 'overdue' ? '#fef2f2' : 
                          paymentSummary.status === 'open' ? '#fff7ed' : '#f0fdf4'
        }}>
          <div className="flex items-center gap-2">
            {paymentSummary.status === 'overdue' && <AlertTriangle className="h-4 w-4 text-red-600" />}
            {paymentSummary.status === 'open' && <Clock className="h-4 w-4 text-orange-600" />}
            {paymentSummary.status === 'ok' && <Check className="h-4 w-4 text-green-600" />}
            <span className={`font-medium text-sm ${
              paymentSummary.status === 'overdue' ? 'text-red-700' : 
              paymentSummary.status === 'open' ? 'text-orange-700' : 'text-green-700'
            }`}>
              Betaalstatus: {paymentSummary.message}
            </span>
          </div>
        </div>

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

        {/* Payment Information */}
        {data.fees && data.fees.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-lg mb-3">Betaalinformatie</h3>
            <div className="space-y-2">
              {data.fees.map((fee) => (
                <div key={fee.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {fee.status === 'PAID' && (
                        <>
                          <Check className="h-4 w-4 text-green-600" />
                          <span className="text-green-600 font-medium text-sm">Betaald</span>
                        </>
                      )}
                      {fee.status === 'OPEN' && (
                        <>
                          <Clock className="h-4 w-4 text-orange-500" />
                          <span className="text-orange-500 font-medium text-sm">Openstaand</span>
                        </>
                      )}
                      {fee.status === 'OVERDUE' && (
                        <>
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          <span className="text-red-600 font-medium text-sm">Vervallen</span>
                        </>
                      )}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Lidgeld {fee.period}</span>
                      {fee.status === 'PAID' && fee.paidAt && (
                        <div className="text-xs text-gray-600">Betaald op {fee.paidAt}</div>
                      )}
                      {fee.status !== 'PAID' && (
                        <div className="text-xs text-gray-600">Vervalt op {fee.periodEnd}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm font-mono">
                    <Euro className="h-3 w-3" />
                    {fee.amount}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button 
            onClick={() => fetchData(true)} 
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={refreshing}
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            Ververs status
          </Button>
          
          {authUser && (
            <Button 
              onClick={startScanning} 
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={scanning}
            >
              <QrCode className="h-4 w-4" />
              Scan nieuwe QR
            </Button>
          )}
        </div>
      </CardContent>
    </Card>

    {/* QR Scanner Modal */}
    <Dialog open={showScanner} onOpenChange={setShowScanner}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            QR Code Scanner
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              className="w-full h-64 object-cover"
              style={{ background: '#000' }}
            />
            {scanning && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <div className="text-white text-sm bg-black/50 px-3 py-1 rounded">
                  Scannen...
                </div>
              </div>
            )}
          </div>
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              Houd een QR code voor de camera om een nieuwe lidkaart te scannen
            </p>
            <Button
              onClick={stopScanning}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Annuleren
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}

export default function CardVerifyPage({ params }: CardVerifyPageProps) {
  const { qrToken } = params;

  return (
    <div 
      className="min-h-screen w-full relative overflow-hidden flex items-start sm:items-center justify-center p-3 sm:p-6"
      style={{
        background: `radial-gradient(circle at 50% 40%, #0B2440 0%, #0E3A6E 45%, #0B2440 100%), radial-gradient(circle at 50% 50%, transparent 40%, rgba(0,0,0,0.3) 100%), linear-gradient(135deg, rgba(255,255,255,0.02) 0%, transparent 50%, rgba(0,0,0,0.05) 100%)`
      }}
    >
      <div className="w-full max-w-lg pt-4 sm:pt-0">
        <VerificationView qrToken={qrToken} />
      </div>
    </div>
  );
}
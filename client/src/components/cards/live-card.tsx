import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Wifi, WifiOff, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import type { Member, CardMeta, Tenant } from "@shared/schema";

interface LiveCardProps {
  member: Member;
  cardMeta: CardMeta;
  tenant: Tenant;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  standalone?: boolean;
}

interface StatusLEDProps {
  status: 'ACTUEEL' | 'MOMENTOPNAME' | 'VERLOPEN';
  className?: string;
}

function StatusLED({ status, className }: StatusLEDProps) {
  const statusConfig = {
    ACTUEEL: {
      color: 'bg-green-500',
      label: 'Actueel',
      icon: Wifi,
    },
    MOMENTOPNAME: {
      color: 'bg-orange-500',
      label: 'Momentopname',
      icon: WifiOff,
    },
    VERLOPEN: {
      color: 'bg-red-500',
      label: 'Verlopen',
      icon: Clock,
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div 
        className={cn("w-3 h-3 rounded-full", config.color)}
        aria-hidden="true"
      />
      <span className="text-xs font-medium text-white/90">
        {config.label}
      </span>
      <Icon className="h-3 w-3 text-white/70" />
    </div>
  );
}

function getMemberCategoryLabel(category: string): string {
  switch (category) {
    case 'STUDENT':
      return 'Student';
    case 'STANDAARD':
      return 'Standaard';
    case 'SENIOR':
      return 'Senior';
    default:
      return category;
  }
}

export function LiveCard({ 
  member, 
  cardMeta, 
  tenant, 
  onRefresh, 
  isRefreshing = false,
  standalone = false 
}: LiveCardProps) {
  const [showQRModal, setShowQRModal] = useState(false);
  const [showGloss, setShowGloss] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);

  // Check for PWA installability and reduced motion
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.documentElement.style.setProperty('--animation-duration', prefersReducedMotion ? '0ms' : '800ms');
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Generate QR code URL for verification
  const qrCodeUrl = `${window.location.origin}/api/card/verify/${cardMeta.qrToken}`;

  // Determine primary color with fallback
  const primaryColor = tenant.primaryColor || '#bb2e2e';

  // Handle refresh with animation
  const handleRefresh = () => {
    if (onRefresh) {
      setShowGloss(true);
      onRefresh();
      setTimeout(() => setShowGloss(false), 800);
    }
  };

  // Check if current year is paid (mock logic - should come from fees)
  const currentYear = new Date().getFullYear();
  const currentYearPaid = true; // This should be calculated from membership fees

  // Calculate valid until date (mock logic)
  const validUntil = cardMeta.validUntil || new Date(currentYear, 11, 31);

  return (
    <div className="min-h-screen bg-gray-900 p-4 sm:p-6 flex items-center justify-center">
      {/* PWA Install Banner */}
      {isInstallable && !standalone && (
        <div className="fixed top-4 left-4 right-4 bg-blue-600 text-white p-3 rounded-lg shadow-lg z-10">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Op beginscherm installeren</span>
            <Button variant="outline" size="sm" className="text-blue-600">
              Installeer
            </Button>
          </div>
        </div>
      )}

      {/* Live Card */}
      <div 
        className="relative w-full max-w-md mx-auto aspect-[1.6/1] rounded-2xl shadow-2xl overflow-hidden border border-gray-600"
        style={{
          background: 'linear-gradient(135deg, #1e40af 0%, #1d4ed8 50%, #2563eb 100%)',
        }}
        data-testid="live-card"
      >
        {/* Gloss overlay */}
        <div 
          className={cn(
            "absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent",
            "transition-transform duration-800 ease-out",
            showGloss ? "transform translate-x-full" : "transform -translate-x-full"
          )}
          style={{
            background: "linear-gradient(45deg, transparent 0%, rgba(255,255,255,0.3) 40%, rgba(255,255,255,0.1) 60%, transparent 100%)",
          }}
          aria-hidden="true"
        />

        {/* Card Content */}
        <div className="relative h-full p-6 flex flex-col">
          {/* Top Section - Bank style header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              {tenant.logoUrl && (
                <img 
                  src={tenant.logoUrl} 
                  alt={tenant.name}
                  className="h-6 w-auto mb-1"
                />
              )}
              <h1 className="text-white/90 font-medium text-sm uppercase tracking-wider">
                {tenant.name}
              </h1>
            </div>
            
            <div className="flex items-center gap-2">
              <StatusLED status={cardMeta.status} />
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-white/60 hover:text-white hover:bg-white/10"
                onClick={handleRefresh}
                disabled={isRefreshing}
                data-testid="button-refresh"
                aria-label="Ververs kaart"
              >
                <RefreshCw className={cn("h-3 w-3", isRefreshing && "animate-spin")} />
              </Button>
            </div>
          </div>

          {/* Card Number - Bank style */}
          <div className="mb-6">
            <p className="text-white font-mono text-lg tracking-widest">
              {member.memberNumber.padStart(16, '0').replace(/(.{4})/g, '$1 ').trim()}
            </p>
          </div>

          {/* Main Content - Two columns like bank card */}
          <div className="flex-1 flex justify-between items-end">
            {/* Left: Member name and details */}
            <div className="flex-1">
              {/* Member name - prominent like credit card */}
              <div className="mb-3">
                <p className="text-white/70 text-xs uppercase tracking-wide mb-1">Kaarthouder</p>
                <h2 className="text-white text-lg font-bold uppercase tracking-wide">
                  {member.firstName} {member.lastName}
                </h2>
              </div>
              
              {/* Category and voting rights */}
              <div className="mb-3">
                <p className="text-white/70 text-xs uppercase tracking-wide mb-1">Type</p>
                <div className="flex items-center gap-2">
                  <span className="text-white text-sm">
                    {getMemberCategoryLabel(member.category)}
                  </span>
                  {member.votingRights && (
                    <span className="text-white/90 text-xs bg-white/20 px-2 py-1 rounded-full">
                      STEMGERECHTIGD
                    </span>
                  )}
                </div>
              </div>

              {/* Valid until - bank card style */}
              <div>
                <p className="text-white/70 text-xs uppercase tracking-wide mb-1">Geldig tot</p>
                <p className="text-white text-sm font-mono">
                  {format(validUntil, 'MM/yy', { locale: nl })}
                </p>
              </div>
            </div>

            {/* Right: QR Code and status */}
            <div className="flex flex-col items-end">
              {/* Payment status chip */}
              <div className="mb-3">
                <Badge 
                  className={cn(
                    "text-xs font-medium px-3 py-1",
                    currentYearPaid 
                      ? "bg-green-500/20 text-green-300 border-green-400/30" 
                      : "bg-red-500/20 text-red-300 border-red-400/30"
                  )}
                  data-testid={currentYearPaid ? "chip-paid" : "chip-unpaid"}
                >
                  {currentYearPaid ? `BETAALD ${currentYear}` : 'ONBETAALD'}
                </Badge>
              </div>

              {/* QR Code */}
              <button
                onClick={() => setShowQRModal(true)}
                className="group bg-white rounded-lg p-2 shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50"
                data-testid="qr-plate"
                aria-label="Open grote QR code"
              >
                <QRCodeSVG
                  value={qrCodeUrl}
                  size={60}
                  className="w-full h-full"
                  fgColor="#000000"
                  bgColor="#ffffff"
                />
              </button>
              <p className="text-white/60 text-xs text-center mt-1">
                SCAN
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
        <DialogContent className="max-w-sm" data-testid="qr-modal">
          <DialogHeader>
            <DialogTitle>Verificatie QR Code</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <QRCodeSVG
                value={qrCodeUrl}
                size={320}
                className="w-full h-full"
                fgColor="#000000"
                bgColor="#ffffff"
              />
            </div>
            <p className="text-center text-sm text-gray-600">
              Scan deze QR code om de lidmaatschapsstatus te verifiëren
            </p>
            <Button 
              onClick={() => setShowQRModal(false)}
              data-testid="button-close-qr"
            >
              Sluiten
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
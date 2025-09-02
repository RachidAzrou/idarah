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
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 flex items-center justify-center">
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
        className="relative w-full max-w-md mx-auto aspect-[1.6/1] rounded-2xl shadow-2xl overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
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
          {/* Header with logo and status */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              {tenant.logoUrl && (
                <img 
                  src={tenant.logoUrl} 
                  alt={tenant.name}
                  className="h-8 w-auto mb-2"
                />
              )}
              <h1 className="text-white font-semibold text-lg leading-tight">
                {tenant.name}
              </h1>
            </div>
            
            <div className="flex flex-col items-end gap-2">
              <StatusLED status={cardMeta.status} />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
                onClick={handleRefresh}
                disabled={isRefreshing}
                data-testid="button-refresh"
                aria-label="Ververs kaart"
              >
                <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
              </Button>
            </div>
          </div>

          {/* Main content area */}
          <div className="flex-1 flex">
            {/* Left: Member info */}
            <div className="flex-1 flex flex-col justify-between">
              {/* Member details */}
              <div>
                <h2 className="text-white text-xl font-bold leading-tight mb-1">
                  {member.firstName} {member.lastName}
                </h2>
                <p className="text-white/90 text-sm font-mono mb-2">
                  #{member.memberNumber}
                </p>
                <Badge 
                  variant="secondary" 
                  className="bg-white/20 text-white border-white/30 text-xs"
                >
                  {getMemberCategoryLabel(member.category)}
                </Badge>
              </div>

              {/* Status chips */}
              <div className="flex flex-col gap-2">
                <Badge 
                  className={cn(
                    "w-fit text-xs font-medium",
                    currentYearPaid 
                      ? "bg-green-500/80 text-white border-green-400/30" 
                      : "bg-orange-500/80 text-white border-orange-400/30"
                  )}
                  data-testid={currentYearPaid ? "chip-paid" : "chip-unpaid"}
                >
                  {currentYearPaid ? `Betaald ${currentYear}` : 'Onbetaald'}
                </Badge>
                
                <Badge 
                  className="w-fit bg-blue-500/80 text-white border-blue-400/30 text-xs font-medium"
                  data-testid="chip-valid-until"
                >
                  Geldig tot {format(validUntil, 'dd/MM/yyyy', { locale: nl })}
                </Badge>
              </div>
            </div>

            {/* Right: QR Code */}
            <div className="ml-4">
              <button
                onClick={() => setShowQRModal(true)}
                className="group bg-white rounded-xl p-3 shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50"
                data-testid="qr-plate"
                aria-label="Open grote QR code"
                style={{ minWidth: '90px', minHeight: '90px' }}
              >
                <QRCodeSVG
                  value={qrCodeUrl}
                  size={66}
                  className="w-full h-full"
                  fgColor="#000000"
                  bgColor="#ffffff"
                />
              </button>
              <p className="text-white/80 text-xs text-center mt-2 leading-tight">
                Scan voor<br />verificatie
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
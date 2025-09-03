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
  className?: string;
}

interface StatusLEDProps {
  status: 'ACTUEEL' | 'MOMENTOPNAME' | 'VERLOPEN';
  className?: string;
}

function StatusLED({ status, className }: StatusLEDProps) {
  const statusConfig = {
    ACTUEEL: {
      color: 'bg-green-500',
      glowClass: 'status-led-glow-green',
      label: 'Actueel',
      icon: Wifi,
    },
    MOMENTOPNAME: {
      color: 'bg-orange-500',
      glowClass: 'status-led-glow-orange',
      label: 'Niet actueel',
      icon: WifiOff,
    },
    VERLOPEN: {
      color: 'bg-red-500',
      glowClass: 'status-led-glow-red',
      label: 'Verlopen',
      icon: Clock,
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div 
        className={cn("w-2.5 h-2.5 rounded-full", config.color, config.glowClass)}
        aria-hidden="true"
      />
      <span className="text-xs font-medium embossed-text card-font">
        {config.label}
      </span>
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
  standalone = false,
  className = ""
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
  const qrCodeUrl = `${window.location.origin}/card/verify/${cardMeta.qrToken}`;

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
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          .live-card-container {
            background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 25%, #1d4ed8 50%, #2563eb 75%, #1e40af 100%) !important;
            font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif !important;
            color: #EAF2FF !important;
          }
          .live-card-container * {
            color: #EAF2FF !important;
            font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif !important;
          }
          .live-card-container .embossed-text {
            color: #EAF2FF !important;
            text-shadow: 0 1px 0 rgba(255, 255, 255, 0.1), 0 -1px 0 rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.5) !important;
          }
        `
      }} />
      <div className={cn("w-full h-full relative overflow-hidden flex items-center justify-center", className)}>

        {/* Live Card - Credit card aspect ratio */}
        <div className="w-full h-full aspect-[1586/1000]">
        <div 
          className="live-card-container relative w-full h-full rounded-3xl overflow-hidden border border-white/10 card-font"
          style={{
            background: `linear-gradient(135deg, #1e3a8a 0%, #3b82f6 25%, #1d4ed8 50%, #2563eb 75%, #1e40af 100%) !important`,
            boxShadow: `0 0 0 1px rgba(255,255,255,0.1) inset, 0 18px 40px rgba(0,0,0,0.35), 0 8px 20px rgba(0,0,0,0.25)`,
            fontFamily: `'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif !important`,
            color: '#EAF2FF !important'
          }}
          data-testid="live-card"
        >
          {/* Shine overlay */}
          <div 
            className={cn(
              "absolute inset-0 pointer-events-none",
              "transition-transform duration-800 ease-out",
              showGloss ? "card-shine" : ""
            )}
            style={{
              background: "linear-gradient(35deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)",
              width: "100px",
              height: "200%",
              transform: showGloss ? "translateX(-100%) rotate(35deg)" : "translateX(-200%) rotate(35deg)"
            }}
            aria-hidden="true"
          />

          {/* Card Content */}
          <div className="relative h-full p-6 flex flex-col card-font">
            {/* Top row: Organization and Status */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                {tenant.logoUrl && (
                  <img 
                    src={tenant.logoUrl} 
                    alt={tenant.name}
                    className="h-5 w-auto mb-1 opacity-90"
                  />
                )}
                <h1 className="embossed-text text-sm font-medium uppercase tracking-widest">
                  {tenant.name}
                </h1>
              </div>
              
              <div className="flex items-center gap-3">
                <StatusLED status={cardMeta.status} />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-white/60 hover:text-white hover:bg-white/10 rounded-full"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  data-testid="button-refresh"
                  aria-label="Ververs kaart"
                >
                  <RefreshCw className={cn("h-3 w-3", isRefreshing && "animate-spin")} />
                </Button>
              </div>
            </div>

            {/* Member Name - Prominent */}
            <div className="mb-6">
              <h2 className="embossed-text text-[clamp(18px,2.6vmin,28px)] font-semibold uppercase tracking-wide leading-tight">
                {member.firstName} {member.lastName}
              </h2>
            </div>

            {/* Card Number - Tabular style */}
            <div className="mb-6">
              <p className="embossed-text text-[clamp(12px,1.8vmin,16px)] font-medium tracking-[0.04em] font-mono tabular-nums">
                {member.memberNumber.padStart(16, '0').replace(/(.{4})/g, '$1 ').trim()}
              </p>
            </div>

            {/* Bottom row: Details and QR */}
            <div className="flex-1 flex justify-between items-end">
              {/* Left: Member details */}
              <div className="flex-1 space-y-3">
                {/* Category */}
                <div>
                  <p className="embossed-text text-[clamp(10px,1.4vmin,12px)] uppercase tracking-wide opacity-80 mb-1">
                    CATEGORIE
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="embossed-text text-[clamp(11px,1.6vmin,14px)] font-medium">
                      {getMemberCategoryLabel(member.category)}
                    </span>
                    {member.votingRights && (
                      <span className="bg-white/15 text-white text-[10px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wide">
                        STEMGERECHTIGD
                      </span>
                    )}
                  </div>
                </div>

                {/* Payment Status */}
                <div>
                  <p className="embossed-text text-[clamp(10px,1.4vmin,12px)] uppercase tracking-wide opacity-80 mb-1">
                    STATUS
                  </p>
                  <span className={cn(
                    "text-[clamp(11px,1.6vmin,14px)] font-medium",
                    currentYearPaid 
                      ? "text-green-300" 
                      : "text-red-300"
                  )}>
                    {currentYearPaid ? `BETAALD ${currentYear}` : 'ONBETAALD'}
                  </span>
                </div>

                {/* Valid until */}
                <div>
                  <p className="embossed-text text-[clamp(10px,1.4vmin,12px)] uppercase tracking-wide opacity-80 mb-1">
                    GELDIG TOT
                  </p>
                  <p className="embossed-text text-[clamp(12px,1.8vmin,16px)] font-medium font-mono tabular-nums">
                    {format(validUntil, 'dd-MM-yyyy', { locale: nl })}
                  </p>
                </div>
              </div>

              {/* Right: QR Code */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => setShowQRModal(true)}
                  className="bg-white rounded-xl p-3 shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50 mb-2"
                  data-testid="qr-plate"
                  aria-label="Open grote QR code"
                  style={{ minWidth: '80px', minHeight: '80px' }}
                >
                  <QRCodeSVG
                    value={qrCodeUrl}
                    size={56}
                    className="w-full h-full"
                    fgColor="#000000"
                    bgColor="#ffffff"
                  />
                </button>
                <p className="embossed-text text-[clamp(10px,1.4vmin,12px)] text-center leading-tight opacity-80">
                  SCAN
                </p>
              </div>
            </div>
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
    </>
  );
}
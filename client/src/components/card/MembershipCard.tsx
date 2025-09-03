import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Wifi, WifiOff, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

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

interface MembershipCardProps {
  cardData: CardData;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  isOffline?: boolean;
  className?: string;
}

interface StatusLEDProps {
  status: CardData['status'];
  className?: string;
}

function StatusLED({ status, className }: StatusLEDProps) {
  const statusConfig = {
    ACTUEEL: {
      color: 'bg-[#22C55E]',
      glowStyle: { boxShadow: '0 0 0 3px rgba(34, 197, 94, 0.18)' },
      label: 'Actueel',
    },
    NIET_ACTUEEL: {
      color: 'bg-[#F59E0B]',
      glowStyle: { boxShadow: '0 0 0 3px rgba(245, 158, 11, 0.18)' },
      label: 'Niet actueel',
    },
    VERLOPEN: {
      color: 'bg-[#EF4444]',
      glowStyle: { boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.18)' },
      label: 'Verlopen',
    },
  };

  const config = statusConfig[status];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div 
        className={cn("w-3 h-3 rounded-full", config.color)}
        style={config.glowStyle}
        aria-hidden="true"
      />
      <span className="text-xs font-medium embossed-text card-font">
        {config.label}
      </span>
    </div>
  );
}

function getMemberCategoryLabel(category: CardData['category']): string {
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

export function MembershipCard({ 
  cardData, 
  onRefresh, 
  isRefreshing = false,
  isOffline = false,
  className = ""
}: MembershipCardProps) {
  const [showQRModal, setShowQRModal] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);

  // Generate QR code URL for verification
  const qrCodeUrl = `${window.location.origin}/card/verify/${cardData.qrToken}`;

  // Trigger flip animation when refreshing state changes
  useEffect(() => {
    if (isRefreshing) {
      console.log('PWA Card: Starting flip animation');
      setIsFlipping(true);
      setTimeout(() => {
        setIsFlipping(false);
        console.log('PWA Card: Flip animation ended');
      }, 800);
    }
  }, [isRefreshing]);

  // Determine card status - force to NIET_ACTUEEL if offline
  const displayStatus = isOffline ? 'NIET_ACTUEEL' : cardData.status;

  return (
    <>
      <div 
        className={cn(
          "glassmorphism-card w-full h-full rounded-3xl relative overflow-hidden card-font transition-transform duration-800 border border-white/20 shadow-lg",
          isFlipping && "animate-flip-horizontal",
          className
        )}
        style={{
          boxShadow: "0 18px 40px rgba(0,0,0,0.35)",
          transform: isFlipping ? 'rotateY(360deg)' : 'rotateY(0deg)',
          transition: 'transform 800ms ease-in-out'
        }}
        data-testid="membership-card"
      >
        {/* Glossy sheen overlay */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-20 mix-blend-screen"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 45%, rgba(255,255,255,0.1) 100%)"
          }}
          aria-hidden="true"
        />

        {/* Card Content */}
        <div className="relative h-full p-6 flex flex-col text-white">
          {/* Top row: Organization and Status */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              {cardData.tenant.logoUrl && (
                <img 
                  src={cardData.tenant.logoUrl} 
                  alt={cardData.tenant.name}
                  className="h-5 w-auto mb-1 opacity-90"
                />
              )}
              <h1 className="embossed-text text-sm font-medium uppercase tracking-widest">
                {cardData.tenant.name}
              </h1>
            </div>
            
            <div className="flex items-center gap-3">
              <StatusLED status={displayStatus} />
            </div>
          </div>

          {/* Member Name - Prominent */}
          <div className="mb-6">
            <h2 className="embossed-text text-[clamp(18px,2.6vmin,28px)] font-semibold uppercase tracking-wide leading-tight">
              {cardData.firstName} {cardData.lastName}
            </h2>
          </div>

          {/* Member Number */}
          <div className="mb-6">
            <p className="embossed-text text-[clamp(10px,1.4vmin,12px)] uppercase tracking-wide opacity-80 mb-1">
              LIDNUMMER
            </p>
            <p className="embossed-text text-[clamp(12px,1.8vmin,16px)] font-medium font-mono tabular-nums">
              {cardData.memberNumber}
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
                    {getMemberCategoryLabel(cardData.category)}
                  </span>
                  {cardData.badges.includes("Stemgerechtigd") && (
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
                  cardData.badges.some(badge => badge.includes("Betaald"))
                    ? "text-green-300" 
                    : "text-red-300"
                )}>
                  {cardData.badges.find(badge => badge.includes("Betaald")) || 'ONBETAALD'}
                </span>
              </div>

              {/* Valid until */}
              {cardData.validUntil && (
                <div>
                  <p className="embossed-text text-[clamp(10px,1.4vmin,12px)] uppercase tracking-wide opacity-80 mb-1">
                    GELDIG TOT
                  </p>
                  <p className="embossed-text text-[clamp(12px,1.8vmin,16px)] font-medium font-mono tabular-nums">
                    {format(cardData.validUntil, 'dd-MM-yyyy', { locale: nl })}
                  </p>
                </div>
              )}
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
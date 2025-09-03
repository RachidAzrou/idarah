import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Wifi, WifiOff, Clock } from "lucide-react";
import { GoVerified } from "react-icons/go";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import fadingBlueBackground from "@assets/fading-blue-background_1756897101831.jpg";

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
  triggerFlip?: boolean;
  isConstrained?: boolean;
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
      <span className="text-xs font-medium card-font debossed-text">
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
  className = "",
  triggerFlip = false,
  isConstrained = false
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
      }, 400);
    }
  }, [isRefreshing]);

  // Determine card status - force to NIET_ACTUEEL if offline
  const displayStatus = isOffline ? 'NIET_ACTUEEL' : cardData.status;
  
  // Scale text sizes based on constrained mode
  const textScale = isConstrained ? 0.7 : 1;
  const getScaledClamp = (minPx: number, vmin: number, maxPx: number) => {
    const scaledMin = Math.round(minPx * textScale);
    const scaledVmin = vmin * textScale;
    const scaledMax = Math.round(maxPx * textScale);
    return `clamp(${scaledMin}px,${scaledVmin}vmin,${scaledMax}px)`;
  };

  return (
    <>
      <div 
        className={cn(
          "w-full h-full rounded-3xl shadow-card relative overflow-hidden card-font transition-transform duration-800",
          isFlipping && "animate-flip-horizontal",
          className
        )}
        style={{
          backgroundImage: `url(${fadingBlueBackground}), linear-gradient(135deg, rgba(8, 35, 66, 0.9) 0%, rgba(6, 47, 89, 0.95) 100%)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundBlendMode: "overlay",
          boxShadow: "0 18px 40px rgba(0,0,0,0.35)",
          transform: isFlipping ? 'rotateY(360deg)' : 'rotateY(0deg)',
          transition: 'transform 800ms ease-in-out'
        }}
        data-testid="membership-card"
      >
        {/* Enhanced glossy sheen overlay */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-30 mix-blend-screen"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 20%, transparent 40%, rgba(255,255,255,0.05) 70%, rgba(255,255,255,0.15) 100%)"
          }}
          aria-hidden="true"
        />
        {/* Additional highlight for premium effect */}
        <div 
          className="absolute top-0 left-0 w-full h-1/3 pointer-events-none opacity-20"
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 100%)"
          }}
          aria-hidden="true"
        />

        {/* Card Content */}
        <div className="relative h-full p-6 flex flex-col text-white">
          {/* Top row: Organization and Status */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              {cardData.tenant.logoUrl && (
                <img 
                  src={cardData.tenant.logoUrl} 
                  alt={cardData.tenant.name}
                  className="h-6 w-auto mb-2 opacity-90"
                />
              )}
              <h1 className={`embossed-text font-bold uppercase tracking-wider ${isConstrained ? 'text-xl' : 'text-3xl'}`}>
                Lidkaart {cardData.tenant.name.toUpperCase()}
              </h1>
            </div>
            
            <div className="flex items-start gap-3">
              <StatusLED status={displayStatus} />
              {cardData.badges.includes("Stemgerechtigd") && (
                <div className="flex flex-col items-center ml-4">
                  <GoVerified 
                    className="w-8 h-8 text-white/70 debossed-icon"
                    data-testid="voting-icon"
                  />
                  <span className="embossed-text text-[10px] uppercase tracking-wide mt-1 opacity-80">
                    STEMGERECHTIGD
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* QR Code - Left aligned with margin */}
          <div className={`flex justify-start mb-8 ml-4 mt-4 ${isConstrained ? 'scale-75 origin-left' : ''}`}>
            <button
              onClick={() => setShowQRModal(true)}
              className="debossed-qr-container transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50 hover:scale-105"
              data-testid="qr-plate"
              aria-label="Toon scanbare QR code"
              style={{ minWidth: isConstrained ? '75px' : '100px', minHeight: isConstrained ? '75px' : '100px' }}
            >
              <div className="debossed-qr-frame">
                <QRCodeSVG
                  value={qrCodeUrl}
                  size={isConstrained ? 50 : 70}
                  className="debossed-qr"
                  fgColor="#D1D5DB"
                  bgColor="transparent"
                />
              </div>
            </button>
          </div>

          {/* Member Information */}
          <div className={`mb-8 space-y-6 ml-8 ${isConstrained ? 'scale-75 origin-top-left' : ''}`}>
            {/* Member Name */}
            <div>
              <p className="embossed-text text-[clamp(16px,2.0vmin,18px)] uppercase tracking-wide opacity-80 mb-1 font-medium">
                NAAM
              </p>
              <h2 className="embossed-text text-[clamp(20px,2.4vmin,22px)] font-semibold uppercase tracking-wide leading-tight" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.9), -1px -1px 2px rgba(255,255,255,0.3), 0 0 8px rgba(255,255,255,0.1)', filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.5))'}}>
                {cardData.firstName} {cardData.lastName}
              </h2>
            </div>

            {/* Lidnummer and Category - side by side */}
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <p className="embossed-text text-[clamp(16px,2.0vmin,18px)] uppercase tracking-wide opacity-80 mb-1 font-medium">
                  LIDNUMMER
                </p>
                <p className="embossed-text text-[clamp(20px,2.4vmin,22px)] font-mono font-bold tracking-[0.2em] leading-tight" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.9), -1px -1px 2px rgba(255,255,255,0.3), 0 0 8px rgba(255,255,255,0.1)', filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.5))'}}>
                  {cardData.memberNumber}
                </p>
              </div>
              
              <div>
                <p className="embossed-text text-[clamp(16px,2.0vmin,18px)] uppercase tracking-wide opacity-80 mb-1 font-medium">
                  CATEGORIE
                </p>
                <span className="embossed-text text-[clamp(20px,2.4vmin,22px)] font-medium uppercase" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.9), -1px -1px 2px rgba(255,255,255,0.3), 0 0 8px rgba(255,255,255,0.1)', filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.5))'}}>
                  {getMemberCategoryLabel(cardData.category)}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom right: Valid until */}
          <div className="flex-1 flex justify-end items-end">
            {cardData.validUntil && (
              <div className="text-right flex items-center gap-2">
                <span className="embossed-text text-[clamp(8px,1.2vmin,10px)] uppercase tracking-wide opacity-70">
                  GELDIG TOT
                </span>
                <span className="embossed-text text-[clamp(10px,1.4vmin,12px)] font-medium font-mono tabular-nums">
                  {format(cardData.validUntil, 'dd-MM-yyyy', { locale: nl })}
                </span>
              </div>
            )}
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
            <div className="bg-white p-6 rounded-xl shadow-xl border">
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
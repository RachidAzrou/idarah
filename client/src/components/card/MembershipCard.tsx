import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Wifi, WifiOff, Clock } from "lucide-react";
import { PiMedal } from "react-icons/pi";
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
}

interface StatusLEDProps {
  status: CardData['status'];
  className?: string;
}

function StatusBadge({ status, className }: StatusLEDProps) {
  const statusConfig = {
    ACTUEEL: {
      color: 'bg-green-500',
      label: 'ACTUEEL',
      dotColor: 'bg-green-400'
    },
    NIET_ACTUEEL: {
      color: 'bg-orange-500',
      label: 'NIET ACTUEEL',
      dotColor: 'bg-orange-400'
    },
    VERLOPEN: {
      color: 'bg-red-500',
      label: 'VERLOPEN',
      dotColor: 'bg-red-400'
    }
  };

  const config = statusConfig[status];

  return (
    <div className={cn("inline-flex items-center gap-1.5 px-2 py-1 rounded-full", config.color, className)}>
      <div className={cn("w-2 h-2 rounded-full", config.dotColor)} />
      <span className="text-xs font-medium text-white uppercase tracking-wide">
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

        {/* Card Content - Bankkaart Layout */}
        <div className="relative h-full p-6 flex flex-col text-white">
          
          {/* Top Row */}
          <div className="flex justify-between items-start mb-4">
            {/* Top-left: Organization block */}
            <div className="flex-1">
              {cardData.tenant.logoUrl && (
                <img 
                  src={cardData.tenant.logoUrl} 
                  alt={cardData.tenant.name}
                  className="h-4 w-auto mb-1 opacity-90"
                />
              )}
              <h1 className="embossed-text text-xs font-medium uppercase tracking-widest opacity-90">
                {cardData.tenant.name}
              </h1>
            </div>
            
            {/* Top-right: Status badge */}
            <div className="flex flex-col items-end gap-2">
              <StatusBadge status={displayStatus} />
              
              {/* Stemrecht (voting rights) - contactless area */}
              {cardData.badges.includes("Stemgerechtigd") && (
                <div className="flex items-center gap-1">
                  <PiMedal className="w-4 h-4 text-yellow-400" />
                  <span className="text-xs font-medium embossed-text opacity-80">
                    Stemgerechtigd
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Left side: QR button (chip position) */}
          <div className="absolute left-6 top-16">
            <button
              onClick={() => setShowQRModal(true)}
              className="w-16 h-16 rounded-xl bg-white/10 backdrop-blur border border-white/20 
                       flex items-center justify-center text-white font-bold text-sm
                       hover:bg-white/20 transition-all duration-200 focus:outline-none 
                       focus:ring-2 focus:ring-white/50"
              data-testid="qr-button"
              aria-label="QR code weergeven"
            >
              QR
            </button>
          </div>

          {/* Center-left: Member data rows (3 lines) */}
          <div className="mt-12 space-y-3 max-w-[60%]">
            {/* Row 1: Member Number */}
            <div>
              <div className="text-xs uppercase tracking-wide opacity-70 mb-0.5">
                LIDNUMMER
              </div>
              <div className="font-mono text-base font-medium tabular-nums embossed-text">
                {cardData.memberNumber}
              </div>
            </div>

            {/* Row 2: Category */}
            <div>
              <div className="text-xs uppercase tracking-wide opacity-70 mb-0.5">
                CATEGORIE
              </div>
              <div className="text-sm font-medium embossed-text">
                {getMemberCategoryLabel(cardData.category)}
              </div>
            </div>

            {/* Row 3: Status */}
            <div>
              <div className="text-xs uppercase tracking-wide opacity-70 mb-0.5">
                STATUS
              </div>
              <div className="text-sm font-medium embossed-text">
                {cardData.badges.find(badge => badge.includes("Betaald")) || 'Onbetaald'}
              </div>
            </div>
          </div>

          {/* Bottom-right: Validity */}
          <div className="absolute bottom-6 right-6 text-right">
            {cardData.validUntil && (
              <>
                <div className="text-xs uppercase tracking-wide opacity-70 mb-0.5">
                  GELDIG TOT
                </div>
                <div className="font-mono text-sm font-medium tabular-nums embossed-text">
                  {format(cardData.validUntil, 'dd-MM-yyyy', { locale: nl })}
                </div>
              </>
            )}
          </div>

          {/* Footer microtext */}
          <div className="absolute bottom-2 left-6 right-6 flex justify-between items-end">
            {/* Bottom-left: Member name */}
            <div className="text-xs opacity-60 uppercase tracking-wide">
              {cardData.firstName} {cardData.lastName}
            </div>
            
            {/* Bottom-right: etag */}
            <div className="text-xs opacity-40 font-mono">
              {cardData.etag}
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
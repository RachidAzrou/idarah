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
      color: 'bg-green-500',
      glowClass: 'status-led-glow-green',
      label: 'Actueel',
      icon: Wifi,
    },
    NIET_ACTUEEL: {
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
      setIsFlipping(true);
      setTimeout(() => setIsFlipping(false), 800);
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
          background: `linear-gradient(135deg, ${cardData.tenant.primaryColor}DD 0%, ${cardData.tenant.primaryColor}BB 50%, ${cardData.tenant.primaryColor}EE 100%)`,
          boxShadow: `
            0 0 0 1px rgba(255,255,255,0.1) inset,
            0 18px 40px rgba(0,0,0,0.35),
            0 8px 20px rgba(0,0,0,0.25)
          `
        }}
        data-testid="membership-card"
      >
        {/* Gloss overlay effect */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(255,255,255,0.05) 100%)"
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
                  data-testid="tenant-logo"
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
            <h2 className="embossed-text text-[clamp(20px,3.2vmin,32px)] font-semibold uppercase tracking-wide leading-tight">
              {cardData.firstName} {cardData.lastName}
            </h2>
          </div>

          {/* Card Number - Bankcard style */}
          <div className="mb-6">
            <p className="embossed-text text-[clamp(14px,2.2vmin,18px)] font-medium tracking-[0.08em] font-mono tabular-nums">
              {cardData.memberNumber.padStart(16, '0').replace(/(.{4})/g, '$1 ').trim()}
            </p>
          </div>

          {/* Bottom row: Details and QR */}
          <div className="flex-1 flex justify-between items-end">
            {/* Left: Member details */}
            <div className="flex-1 space-y-3">
              {/* Category */}
              <div>
                <p className="embossed-text text-[clamp(10px,1.5vmin,12px)] uppercase tracking-wide opacity-80 mb-1">
                  CATEGORIE
                </p>
                <span className="embossed-text text-[clamp(12px,1.8vmin,15px)] font-medium">
                  {getMemberCategoryLabel(cardData.category)}
                </span>
              </div>

              {/* Badges */}
              {cardData.badges.length > 0 && (
                <div>
                  <p className="embossed-text text-[clamp(10px,1.5vmin,12px)] uppercase tracking-wide opacity-80 mb-1">
                    STATUS
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {cardData.badges.map((badge, index) => (
                      <span
                        key={index}
                        className="bg-white/15 text-white text-[10px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wide"
                        data-testid={`badge-${index}`}
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Valid until */}
              {cardData.validUntil && (
                <div>
                  <p className="embossed-text text-[clamp(10px,1.5vmin,12px)] uppercase tracking-wide opacity-80 mb-1">
                    GELDIG TOT
                  </p>
                  <p className="embossed-text text-[clamp(12px,1.8vmin,15px)] font-medium font-mono tabular-nums">
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
                data-testid="qr-code-button"
                aria-label="Toon grote QR code"
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
              <p className="embossed-text text-[clamp(10px,1.5vmin,12px)] text-center leading-tight opacity-80">
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
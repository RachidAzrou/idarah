import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Wifi, WifiOff, Clock } from "lucide-react";
import { PiUserCircleCheckLight } from "react-icons/pi";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import type { Member, CardMeta, Tenant } from "@shared/schema";
import fadingBlueBackground from "@assets/fading-blue-background_1756897101831.jpg";

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
      <span className="text-xs font-medium card-font debossed-text">
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
  const [isFlipping, setIsFlipping] = useState(false);

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

  // Trigger flip animation when refreshing state changes
  useEffect(() => {
    if (isRefreshing) {
      setIsFlipping(true);
      setTimeout(() => setIsFlipping(false), 400);
    }
  }, [isRefreshing]);

  // Handle refresh with animation
  const handleRefresh = () => {
    console.log('Refresh clicked, starting flip animation');
    console.log('Current isFlipping state:', isFlipping);
    setIsFlipping(true);
    setTimeout(() => {
      setIsFlipping(false);
      console.log('Flip animation ended');
    }, 400);
    
    if (onRefresh) {
      onRefresh();
    }
  };

  // Check if current year is paid (mock logic - should come from fees)
  const currentYear = new Date().getFullYear();
  const currentYearPaid = true; // This should be calculated from membership fees

  // Calculate valid until date (mock logic)
  const validUntil = cardMeta.validUntil || new Date(currentYear, 11, 31);

  return (
    <div className={cn("w-full h-full relative overflow-hidden flex items-center justify-center", standalone ? "" : "min-h-screen p-4 sm:p-6", className)} style={!standalone ? {
      background: `linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%), radial-gradient(ellipse at top, rgba(59, 130, 246, 0.03) 0%, transparent 50%), radial-gradient(ellipse at bottom, rgba(99, 102, 241, 0.02) 0%, transparent 50%)`
    } : {}}>
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

      {/* Live Card - Credit card aspect ratio */}
      <div className="w-[min(95vw,75vh*1.586)] sm:w-[min(96vw,96vh*1.586)] lg:w-[clamp(600px,75vmin,920px)] aspect-[1586/1000]">
        <div 
          className={cn(
            "relative w-full h-full rounded-3xl overflow-hidden border border-white/10 card-font transition-transform duration-800",
            isFlipping && "animate-flip-horizontal"
          )}
          style={{
            backgroundImage: `url(${fadingBlueBackground}), linear-gradient(135deg, rgba(8, 35, 66, 0.9) 0%, rgba(6, 47, 89, 0.95) 100%)`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundBlendMode: "overlay",
            transformStyle: 'preserve-3d',
            boxShadow: "0 18px 40px rgba(0,0,0,0.35)",
            transform: isFlipping ? 'rotateY(360deg)' : 'rotateY(0deg)',
            transition: 'transform 800ms ease-in-out'
          }}
          data-testid="live-card"
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
          {/* Interactive shine overlay */}
          <div 
            className={cn(
              "absolute inset-0 pointer-events-none",
              "transition-transform duration-800 ease-out",
              showGloss ? "card-shine" : ""
            )}
            style={{
              background: "linear-gradient(35deg, transparent 40%, rgba(255,255,255,0.25) 50%, transparent 60%)",
              width: "100px",
              height: "200%",
              transform: showGloss ? "translateX(-100%) rotate(35deg)" : "translateX(-200%) rotate(35deg)"
            }}
            aria-hidden="true"
          />

          {/* Card Content */}
          <div className="relative h-full p-6 flex flex-col text-white">
            {/* Top row: Organization and Status */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                {tenant.logoUrl && (
                  <img 
                    src={tenant.logoUrl} 
                    alt={tenant.name}
                    className="h-6 w-auto mb-2 opacity-90"
                  />
                )}
                <h1 className="embossed-text text-3xl font-bold uppercase tracking-wider">
                  Lidkaart {tenant.name.toUpperCase()}
                </h1>
              </div>
              
              <div className="flex items-start gap-3">
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

            {/* QR Code and Voting Rights Section */}
            <div className="flex justify-between items-center mb-8 ml-4 mt-4">
              {/* QR Code - Left side */}
              <button
                onClick={() => setShowQRModal(true)}
                className="debossed-qr-container transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50 hover:scale-105"
                data-testid="qr-plate"
                aria-label="Toon scanbare QR code"
                style={{ 
                  minWidth: 'clamp(75px, 8vmin, 100px)', 
                  minHeight: 'clamp(75px, 8vmin, 100px)' 
                }}
              >
                <div className="debossed-qr-frame">
                  <QRCodeSVG
                    value={qrCodeUrl}
                    size={Math.min(70, window.innerWidth * 0.08)}
                    className="debossed-qr"
                    fgColor="#D1D5DB"
                    bgColor="transparent"
                  />
                </div>
              </button>
              
              {/* Voting Rights Badge - Right side */}
              {member.votingRights && (
                <div className="flex flex-col items-center mr-8">
                  <PiUserCircleCheckLight 
                    className="w-[clamp(24px, 3.5vmin, 32px)] h-[clamp(24px, 3.5vmin, 32px)]"
                    data-testid="voting-icon"
                    style={{
                      color: '#DAA520',
                      textShadow: `
                        3px 3px 0 rgba(255,248,220,0.4),
                        -3px -3px 0 rgba(0,0,0,0.9),
                        -4px -4px 0 rgba(0,0,0,0.8),
                        -5px -5px 0 rgba(0,0,0,0.6),
                        -6px -6px 0 rgba(0,0,0,0.4),
                        -7px -7px 0 rgba(0,0,0,0.2),
                        inset 4px 4px 8px rgba(0,0,0,0.8),
                        inset -2px -2px 4px rgba(255,215,0,0.2),
                        0 0 12px rgba(218,165,32,0.4),
                        0 0 20px rgba(218,165,32,0.2)
                      `,
                      filter: 'drop-shadow(3px 3px 8px rgba(0,0,0,0.6)) brightness(1.1)'
                    }}
                  />
                  <span className="embossed-text text-[clamp(10px, 1.2vmin, 14px)] uppercase tracking-[0.1em] font-bold mt-3" style={{
                    color: '#DAA520',
                    textShadow: `
                      1px 1px 0 rgba(255,248,220,0.3),
                      -1px -1px 0 rgba(0,0,0,0.7),
                      -2px -2px 0 rgba(0,0,0,0.5),
                      inset 2px 2px 4px rgba(0,0,0,0.6),
                      0 0 6px rgba(218,165,32,0.3)
                    `,
                    filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.4))'
                  }}>
                    STEMGERECHTIGD
                  </span>
                </div>
              )}
            </div>

            {/* Member Information */}
            <div className="mb-8 space-y-6 ml-8">
              {/* Member Name */}
              <div>
                <p className="embossed-text text-[clamp(16px,2.0vmin,18px)] uppercase tracking-wide opacity-80 mb-1 font-medium">
                  NAAM
                </p>
                <h2 className="embossed-text text-[clamp(20px,2.4vmin,22px)] font-semibold uppercase tracking-wide leading-tight" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.9), -1px -1px 2px rgba(255,255,255,0.3), 0 0 8px rgba(255,255,255,0.1)', filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.5))'}}>
                  {member.firstName} {member.lastName}
                </h2>
              </div>

              {/* Lidnummer and Category - side by side */}
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <p className="embossed-text text-[clamp(16px,2.0vmin,18px)] uppercase tracking-wide opacity-80 mb-1 font-medium">
                    LIDNUMMER
                  </p>
                  <p className="embossed-text text-[clamp(20px,2.4vmin,22px)] font-mono font-bold tracking-[0.2em] leading-tight" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.9), -1px -1px 2px rgba(255,255,255,0.3), 0 0 8px rgba(255,255,255,0.1)', filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.5))'}}>
                    {member.memberNumber}
                  </p>
                </div>
                
                <div>
                  <p className="embossed-text text-[clamp(16px,2.0vmin,18px)] uppercase tracking-wide opacity-80 mb-1 font-medium">
                    CATEGORIE
                  </p>
                  <span className="embossed-text text-[clamp(20px,2.4vmin,22px)] font-medium uppercase" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.9), -1px -1px 2px rgba(255,255,255,0.3), 0 0 8px rgba(255,255,255,0.1)', filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.5))'}}>
                    {getMemberCategoryLabel(member.category)}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom right: Valid until */}
            <div className="flex-1 flex justify-end items-end mr-6">
              <div className="text-right">
                <p className="embossed-text text-sm uppercase tracking-wide opacity-80 mb-1 font-medium">
                  GELDIG TOT
                </p>
                <p className="embossed-text text-lg font-mono font-bold tracking-wider" style={{
                  textShadow: '2px 2px 4px rgba(0,0,0,0.9), -1px -1px 2px rgba(255,255,255,0.3), 0 0 8px rgba(255,255,255,0.1)', 
                  filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.5))'
                }}>
                  {cardMeta.validUntil ? format(cardMeta.validUntil, 'dd-MM-yyyy', { locale: nl }) : '31-12-2025'}
                </p>
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
              Scan deze QR code om lid te bekijken
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
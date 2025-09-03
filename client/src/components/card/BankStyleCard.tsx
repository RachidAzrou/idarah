import React from 'react';
import { PiMedal } from 'react-icons/pi';
import { cn } from '@/lib/utils';
import fadingBlueBackground from "@assets/fading-blue-background_1756897101831.jpg";

interface BankStyleCardProps {
  // Organization
  organizationName: string;
  organizationLogo?: string;
  
  // Member info
  memberNumber: string;
  category: 'Student' | 'Standaard' | 'Senior';
  status: 'Actueel' | 'Niet actueel' | 'Verlopen';
  memberName?: string;
  
  // Status and permissions
  cardStatus: 'ACTUEEL' | 'NIET_ACTUEEL' | 'VERLOPEN';
  hasVotingRights?: boolean;
  
  // Validity
  validUntil: string; // dd-mm-jjjj format
  
  // Technical
  etag?: string;
  
  // Actions
  onQrClick?: () => void;
  
  className?: string;
}

const StatusBadge: React.FC<{ status: BankStyleCardProps['cardStatus'] }> = ({ status }) => {
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
    <div className={cn("inline-flex items-center gap-1.5 px-2 py-1 rounded-full", config.color)}>
      <div className={cn("w-2 h-2 rounded-full", config.dotColor)} />
      <span className="text-xs font-medium text-white uppercase tracking-wide">
        {config.label}
      </span>
    </div>
  );
};

export const BankStyleCard: React.FC<BankStyleCardProps> = ({
  organizationName,
  organizationLogo,
  memberNumber,
  category,
  status,
  memberName,
  cardStatus,
  hasVotingRights = false,
  validUntil,
  etag,
  onQrClick,
  className
}) => {
  return (
    <div 
      className={cn(
        "relative w-full aspect-[1586/1000] rounded-2xl overflow-hidden shadow-xl",
        "card-font text-white",
        className
      )}
      style={{
        backgroundImage: `url(${fadingBlueBackground}), linear-gradient(135deg, rgba(8, 35, 66, 0.9) 0%, rgba(6, 47, 89, 0.95) 100%)`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundBlendMode: "overlay",
        boxShadow: "0 18px 40px rgba(0,0,0,0.35)",
      }}
      data-testid="bank-style-card"
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
      <div className="relative h-full p-6 flex flex-col">
        
        {/* Top Row */}
        <div className="flex justify-between items-start mb-4">
          {/* Top-left: Organization block */}
          <div className="flex-1">
            {organizationLogo && (
              <img 
                src={organizationLogo} 
                alt={organizationName}
                className="h-4 w-auto mb-1 opacity-90"
              />
            )}
            <h1 className="embossed-text text-xs font-medium uppercase tracking-widest opacity-90">
              {organizationName}
            </h1>
          </div>
          
          {/* Top-right: Status badge */}
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={cardStatus} />
            
            {/* Stemrecht (voting rights) */}
            {hasVotingRights && (
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
            onClick={onQrClick}
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

        {/* Center-left: Member data rows */}
        <div className="mt-12 space-y-3 max-w-[60%]">
          {/* Row 1: Member Number */}
          <div>
            <div className="text-xs uppercase tracking-wide opacity-70 mb-0.5">
              LIDNUMMER
            </div>
            <div className="font-mono text-base font-medium tabular-nums embossed-text">
              {memberNumber}
            </div>
          </div>

          {/* Row 2: Category */}
          <div>
            <div className="text-xs uppercase tracking-wide opacity-70 mb-0.5">
              CATEGORIE
            </div>
            <div className="text-sm font-medium embossed-text">
              {category}
            </div>
          </div>

          {/* Row 3: Status */}
          <div>
            <div className="text-xs uppercase tracking-wide opacity-70 mb-0.5">
              STATUS
            </div>
            <div className="text-sm font-medium embossed-text">
              {status}
            </div>
          </div>
        </div>

        {/* Bottom-right: Validity */}
        <div className="absolute bottom-6 right-6 text-right">
          <div className="text-xs uppercase tracking-wide opacity-70 mb-0.5">
            GELDIG TOT
          </div>
          <div className="font-mono text-sm font-medium tabular-nums embossed-text">
            {validUntil}
          </div>
        </div>

        {/* Footer microtext */}
        <div className="absolute bottom-2 left-6 right-6 flex justify-between items-end">
          {/* Bottom-left: Member name */}
          {memberName && (
            <div className="text-xs opacity-60 uppercase tracking-wide">
              {memberName}
            </div>
          )}
          
          {/* Bottom-right: etag */}
          {etag && (
            <div className="text-xs opacity-40 font-mono">
              {etag}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
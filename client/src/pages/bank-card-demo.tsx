import { useState } from 'react';
import { BankStyleCard } from '@/components/card/BankStyleCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';

export default function BankCardDemo() {
  const [showQR, setShowQR] = useState(false);

  // Sample data - verschillende scenario's
  const cardData = {
    organizationName: "MEFEN VZWS",
    memberNumber: "0001234567890",
    category: "Standaard" as const,
    status: "Actueel" as const,
    memberName: "Jan Janssen",
    cardStatus: "ACTUEEL" as const,
    hasVotingRights: true,
    validUntil: "31-12-2024",
    etag: "v2.1.0"
  };

  const handleQrClick = () => {
    setShowQR(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Bankkaart-stijl Lidmaatschapskaart
          </h1>
          <p className="text-slate-600">
            Geïnspireerd door de ruimtelijke indeling van een bankkaart, maar volledig aangepast voor lidmaatschapsbeheer.
          </p>
        </div>

        {/* Demo Grid */}
        <div className="grid gap-8">
          {/* Main Demo Card */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-slate-800">Actueel Lid</h2>
            <div className="max-w-md mx-auto">
              <BankStyleCard
                {...cardData}
                onQrClick={handleQrClick}
              />
            </div>
          </div>

          {/* Variations */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Student variant */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-slate-800">Student - Geen Stemrecht</h3>
              <BankStyleCard
                organizationName="MEFEN VZWS"
                memberNumber="0009876543210"
                category="Student"
                status="Actueel"
                memberName="Emma De Vries"
                cardStatus="ACTUEEL"
                hasVotingRights={false}
                validUntil="31-12-2024"
                etag="v2.1.0"
                onQrClick={handleQrClick}
              />
            </div>

            {/* Expired variant */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-slate-800">Verlopen Status</h3>
              <BankStyleCard
                organizationName="MEFEN VZWS"
                memberNumber="0001122334455"
                category="Senior"
                status="Verlopen"
                memberName="Piet Pieters"
                cardStatus="VERLOPEN"
                hasVotingRights={true}
                validUntil="31-12-2023"
                etag="v1.9.2"
                onQrClick={handleQrClick}
              />
            </div>
          </div>

          {/* Layout Mapping Documentation */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-slate-800">Layout Mapping</h2>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-slate-600">
              <div>
                <h4 className="font-medium text-slate-800 mb-2">Bankkaart → Lidmaatschapskaart</h4>
                <ul className="space-y-1">
                  <li>• Top-left logo's → Organisatie blok</li>
                  <li>• Chip positie → QR knop</li>
                  <li>• Top-right logo → Status badge</li>
                  <li>• Contactloos gebied → Stemrecht</li>
                  <li>• Centrale nummers → Lid gegevens</li>
                  <li>• Bottom-right geldigheid → Geldig tot</li>
                  <li>• Footer → Naam + etag</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-slate-800 mb-2">Technische Details</h4>
                <ul className="space-y-1">
                  <li>• React + TypeScript</li>
                  <li>• TailwindCSS styling</li>
                  <li>• Props-driven UI</li>
                  <li>• nl-BE locale</li>
                  <li>• Responsive design</li>
                  <li>• Accessibility support</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QR Modal */}
      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>QR Code Verificatie</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="bg-white p-6 rounded-xl border">
              <QRCodeSVG
                value={`${window.location.origin}/verify/demo-token`}
                size={200}
                className="w-full h-full"
                fgColor="#000000"
                bgColor="#ffffff"
              />
            </div>
            <p className="text-center text-sm text-slate-600">
              Scan deze QR code om de lidmaatschapsstatus te verifiëren
            </p>
            <Button 
              onClick={() => setShowQR(false)}
              className="w-full"
            >
              Sluiten
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
"use client";

import { PublicScreen, PaymentMatrixConfig, AnnouncementsConfig } from "@/lib/mock/public-screens";
import { MatrixPreview } from "./types/PaymentMatrix/MatrixPreview";
import { AnnouncementsPreview } from "./types/Announcements/AnnouncementsPreview";

interface PreviewFrameProps {
  screen: PublicScreen;
}

export function PreviewFrame({ screen }: PreviewFrameProps) {
  if (!screen.active) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100">
        <div className="text-center space-y-2">
          <div className="text-gray-600 font-medium">Scherm is inactief</div>
          <div className="text-sm text-gray-500">
            Activeer het scherm om de preview te zien
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden bg-white">
      {screen.type === 'PAYMENT_MATRIX' && (
        <MatrixPreview config={screen.config as PaymentMatrixConfig} />
      )}
      {screen.type === 'ANNOUNCEMENTS' && (
        <AnnouncementsPreview config={screen.config as AnnouncementsConfig} />
      )}
    </div>
  );
}
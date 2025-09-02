"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ScreenType, LedenlijstConfig, MededelingenConfig, MultimediaConfig } from "@/lib/mock/public-screens";
import { ScreenWizard } from "./wizard/ScreenWizard";

interface NewScreenDialogProps {
  onCreateScreen: (screen: {
    name: string;
    type: ScreenType;
    config: LedenlijstConfig | MededelingenConfig | MultimediaConfig;
  }) => void;
}

export function NewScreenDialog({ onCreateScreen }: NewScreenDialogProps) {
  const [wizardOpen, setWizardOpen] = useState(false);

  return (
    <>
      

      <ScreenWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        onComplete={onCreateScreen}
      />
    </>
  );
}
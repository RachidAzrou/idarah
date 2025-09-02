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
      <Button 
        onClick={() => setWizardOpen(true)}
        className="gap-2"
        data-testid="button-new-screen"
      >
        <Plus className="w-4 h-4" />
        Nieuw Scherm
      </Button>

      <ScreenWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        onComplete={onCreateScreen}
      />
    </>
  );
}
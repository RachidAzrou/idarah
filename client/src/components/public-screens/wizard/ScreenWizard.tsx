"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ScreenType, TitleStyling, LedenlijstConfig, MededelingenConfig, MultimediaConfig } from "@/lib/mock/public-screens";
import { TypeSelectionStep } from "./steps/TypeSelectionStep";
import { DescriptionStep } from "./steps/DescriptionStep";
import { StylingStep } from "./steps/StylingStep";
import { LedenlijstConfigStep } from "./steps/LedenlijstConfigStep";
import { MededelingenConfigStep } from "./steps/MededelingenConfigStep";
import { MultimediaConfigStep } from "./steps/MultimediaConfigStep";

interface ScreenWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (screenData: {
    name: string;
    type: ScreenType;
    config: LedenlijstConfig | MededelingenConfig | MultimediaConfig;
  }) => void;
}

interface WizardData {
  type?: ScreenType;
  name: string;
  description?: string;
  title: TitleStyling;
  subtitle: TitleStyling;
  ledenlijstSettings?: {
    useFullNames: boolean;
    useInitials: boolean;
    filterByCategories: boolean;
    showVotingRights: boolean;
    rowsPerPage: number;
    year: number;
    categories: string[];
  };
  mededelingenSettings?: {
    slides: Array<{
      id: string;
      title: string;
      body?: string;
      mediaUrl?: string;
      mediaType?: 'image' | 'video';
      active: boolean;
      durationSec: number;
    }>;
    autoplay: {
      enabled: boolean;
      interval: number;
      order: 'date' | 'manual' | 'shuffle';
    };
    style: {
      textColor: string;
      backgroundColor: string;
      maxTextWidth: number;
    };
  };
  multimediaSettings?: {
    mediaItems: Array<{
      id: string;
      url: string;
      type: 'image' | 'video';
      duration: number;
      active: boolean;
      loop?: boolean;
      transition?: 'fade' | 'slide' | 'zoom' | 'none';
      name?: string;
    }>;
    autoplay: {
      enabled: boolean;
      interval: number;
    };
  };
}

const defaultTitleStyling: TitleStyling = {
  text: "",
  fontSize: 32,
  fontFamily: "Poppins",
  color: "#1f2937",
  fontWeight: "bold"
};

const defaultSubtitleStyling: TitleStyling = {
  text: "",
  fontSize: 18,
  fontFamily: "Poppins", 
  color: "#6b7280",
  fontWeight: "normal"
};

export function ScreenWizard({ open, onOpenChange, onComplete }: ScreenWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [wizardData, setWizardData] = useState<WizardData>({
    name: "",
    title: { ...defaultTitleStyling },
    subtitle: { ...defaultSubtitleStyling }
  });

  const getSteps = () => {
    const baseSteps = [
      { title: "Type selecteren", component: TypeSelectionStep },
      { title: "Beschrijving", component: DescriptionStep },
      { title: "Opmaak", component: StylingStep }
    ];
    
    if (wizardData.type === 'LEDENLIJST') {
      baseSteps.push({ title: "Configuratie", component: LedenlijstConfigStep });
    } else if (wizardData.type === 'MEDEDELINGEN') {
      baseSteps.push({ title: "Berichten", component: MededelingenConfigStep });
    } else if (wizardData.type === 'MULTIMEDIA') {
      baseSteps.push({ title: "Media", component: MultimediaConfigStep });
    }
    
    return baseSteps;
  };

  const steps = getSteps();

  const isLastStep = currentStep === steps.length - 1;
  const canGoNext = () => {
    switch (currentStep) {
      case 0: return !!wizardData.type;
      case 1: return wizardData.name.length > 0;
      case 2: return wizardData.title.text.length > 0;
      case 3: 
        if (wizardData.type === 'LEDENLIJST') return !!wizardData.ledenlijstSettings;
        if (wizardData.type === 'MEDEDELINGEN') return !!wizardData.mededelingenSettings && wizardData.mededelingenSettings.slides.length > 0;
        if (wizardData.type === 'MULTIMEDIA') return !!wizardData.multimediaSettings && wizardData.multimediaSettings.mediaItems.length > 0;
        return true;
      default: return true;
    }
  };

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleComplete = () => {
    if (!wizardData.type) return;

    let config: LedenlijstConfig | MededelingenConfig | MultimediaConfig;

    if (wizardData.type === 'LEDENLIJST') {
      config = {
        description: wizardData.description,
        title: wizardData.title,
        subtitle: wizardData.subtitle,
        display: {
          useFullNames: wizardData.ledenlijstSettings?.useFullNames ?? true,
          useInitials: wizardData.ledenlijstSettings?.useInitials ?? false,
          filterByCategories: wizardData.ledenlijstSettings?.filterByCategories ?? true,
          showVotingRights: wizardData.ledenlijstSettings?.showVotingRights ?? false,
          rowsPerPage: wizardData.ledenlijstSettings?.rowsPerPage ?? 20
        },
        year: wizardData.ledenlijstSettings?.year ?? new Date().getFullYear(),
        categories: wizardData.ledenlijstSettings?.categories ?? []
      } as LedenlijstConfig;
    } else if (wizardData.type === 'MEDEDELINGEN') {
      config = {
        description: wizardData.description,
        title: wizardData.title,
        subtitle: wizardData.subtitle,
        slides: wizardData.mededelingenSettings?.slides || [],
        autoplay: wizardData.mededelingenSettings?.autoplay || {
          enabled: true,
          interval: 8,
          order: 'date'
        },
        style: {
          textContrast: wizardData.mededelingenSettings?.style.textColor === '#ffffff' ? 'light' : 'dark',
          background: wizardData.mededelingenSettings?.style.backgroundColor === '#ffffff' ? 'white' : 'black',
          maxTextWidth: wizardData.mededelingenSettings?.style.maxTextWidth || 800
        }
      } as MededelingenConfig;
    } else {
      config = {
        description: wizardData.description,
        title: wizardData.title,
        subtitle: wizardData.subtitle,
        mediaItems: wizardData.multimediaSettings?.mediaItems || [],
        autoplay: wizardData.multimediaSettings?.autoplay || {
          enabled: true,
          interval: 5
        }
      } as MultimediaConfig;
    }

    onComplete({
      name: wizardData.name,
      type: wizardData.type,
      config
    });

    // Reset wizard
    setCurrentStep(0);
    setWizardData({
      name: "",
      title: { ...defaultTitleStyling },
      subtitle: { ...defaultSubtitleStyling }
    });
    onOpenChange(false);
  };

  const StepComponent = steps[currentStep]?.component;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="screen-wizard">
        <DialogHeader>
          <DialogTitle>{steps[currentStep]?.title}</DialogTitle>
        </DialogHeader>

        <div className="py-6">
          {StepComponent && (
            <StepComponent
              data={wizardData}
              onUpdate={setWizardData}
            />
          )}
        </div>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(prev => prev - 1)}
            disabled={currentStep === 0}
            data-testid="wizard-back"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Vorige
          </Button>

          <div className="flex items-center gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index <= currentStep ? 'bg-primary' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          <Button
            onClick={handleNext}
            disabled={!canGoNext()}
            data-testid="wizard-next"
          >
            {isLastStep ? 'Voltooien' : 'Volgende'}
            {!isLastStep && <ChevronRight className="w-4 h-4 ml-2" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
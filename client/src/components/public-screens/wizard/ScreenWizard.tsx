"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Monitor } from "lucide-react";
import { ScreenType, TitleStyling, LedenlijstConfig, MededelingenConfig, MultimediaConfig } from "@/lib/mock/public-screens";
import { TypeSelectionStep } from "./steps/TypeSelectionStep";
import { DescriptionStep } from "./steps/DescriptionStep";
import { StylingStep } from "./steps/StylingStep";
import { LedenlijstConfigStep } from "./steps/LedenlijstConfigStep";
import { MededelingenConfigStep } from "./steps/MededelingenConfigStep";
// Temporarily import only when needed to avoid module resolution issues
// import { MededelingenMessagesStep } from "./steps/MededelingenMessagesStep";
// import { MededelingenCarouselStep } from "./steps/MededelingenCarouselStep";
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

const resetWizardData = (): WizardData => ({
  name: "",
  title: { ...defaultTitleStyling },
  subtitle: { ...defaultSubtitleStyling }
});

export function ScreenWizard({ open, onOpenChange, onComplete }: ScreenWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [wizardData, setWizardData] = useState<WizardData>(resetWizardData());

  // Reset wizard when dialog opens
  useEffect(() => {
    if (open) {
      setCurrentStep(0);
      setWizardData(resetWizardData());
    }
  }, [open]);

  const getSteps = () => {
    const baseSteps: Array<{ title: string; component: any }> = [
      { title: "Type selecteren", component: TypeSelectionStep },
      { title: "Beschrijving", component: DescriptionStep },
      { title: "Opmaak", component: StylingStep }
    ];
    
    if (wizardData.type === 'LEDENLIJST') {
      baseSteps.push({ title: "Configuratie", component: LedenlijstConfigStep });
    } else if (wizardData.type === 'MEDEDELINGEN') {
      // Voor mededelingen slaan we de opmaak stap over en gaan direct naar berichten
      baseSteps.splice(2, 1); // Verwijder de "Opmaak" stap
      // Use existing MededelingenConfigStep for now until import issues are resolved
      baseSteps.push({ title: "Configuratie", component: MededelingenConfigStep });
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
      case 2: 
        if (wizardData.type === 'MEDEDELINGEN') {
          // Voor mededelingen is stap 2 de configuratie stap (berichten)
          return !!wizardData.mededelingenSettings && wizardData.mededelingenSettings.slides.length > 0;
        } else {
          // Voor andere types is stap 2 de opmaak stap
          return wizardData.title && wizardData.title.text && wizardData.title.text.length > 0;
        }
      case 3: 
        if (wizardData.type === 'LEDENLIJST') return !!wizardData.ledenlijstSettings;
        if (wizardData.type === 'MULTIMEDIA') return !!wizardData.multimediaSettings && wizardData.multimediaSettings.mediaItems.length > 0;
        return true;
      case 4:
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

    // Close dialog (reset happens automatically when reopened)
    onOpenChange(false);
  };

  const StepComponent = steps[currentStep]?.component;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[95vh] flex flex-col" data-testid="screen-wizard">
        <DialogHeader className="flex-shrink-0 pb-6 border-b border-border">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <Monitor className="h-6 w-6" />
            {steps[currentStep]?.title}
          </DialogTitle>
          <DialogDescription className="text-base mt-2">
            {currentStep === 0 && "Kies het type scherm dat je wilt aanmaken"}
            {currentStep === 1 && "Geef je scherm een duidelijke naam"}
            {currentStep === 2 && wizardData.type === 'MEDEDELINGEN' && "Maak en beheer je berichten"}
            {currentStep === 2 && wizardData.type !== 'MEDEDELINGEN' && "Pas de titel en ondertitel aan"}
            {currentStep === 3 && wizardData.type === 'MEDEDELINGEN' && "Stel de carrousel instellingen in"}
            {currentStep === 3 && wizardData.type !== 'MEDEDELINGEN' && "Configureer de specifieke instellingen"}
          </DialogDescription>
          
          {/* Progress indicator */}
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              {steps.map((step, index) => (
                <div key={index} className="flex items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                    index < currentStep ? 'bg-primary text-primary-foreground' :
                    index === currentStep ? 'bg-primary text-primary-foreground' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {index + 1}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-12 h-px mx-2 transition-colors ${
                      index < currentStep ? 'bg-primary' : 'bg-muted'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <Badge variant="outline" className="ml-auto">
              Stap {currentStep + 1} van {steps.length}
            </Badge>
          </div>
        </DialogHeader>

        {/* Main content area with fixed height */}
        <div className="flex-1 py-6 overflow-y-auto">
          {StepComponent && (
            <StepComponent
              data={wizardData}
              onUpdate={setWizardData}
            />
          )}
        </div>

        {/* Fixed footer */}
        <div className="flex-shrink-0 flex justify-between items-center pt-6 border-t border-border">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(prev => prev - 1)}
            disabled={currentStep === 0}
            data-testid="wizard-back"
            size="lg"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Vorige
          </Button>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              data-testid="wizard-cancel"
            >
              Annuleren
            </Button>
            
            <Button
              onClick={handleNext}
              disabled={!canGoNext()}
              data-testid="wizard-next"
              size="lg"
            >
              {isLastStep ? 'Scherm Aanmaken' : 'Volgende'}
              {!isLastStep && <ChevronRight className="w-4 h-4 ml-2" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
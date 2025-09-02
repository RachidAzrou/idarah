"use client";

import { useState, useEffect } from "react";
import { PublicScreen, TitleStyling, LedenlijstConfig, MededelingenConfig } from "@/lib/mock/public-screens";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";
import { DescriptionStep } from "./wizard/steps/DescriptionStep";
import { StylingStep } from "./wizard/steps/StylingStep";
import { LedenlijstConfigStep } from "./wizard/steps/LedenlijstConfigStep";
import { MededelingenMessagesStep } from "./wizard/steps/MededelingenMessagesStep";
import { MededelingenCarouselStep } from "./wizard/steps/MededelingenCarouselStep";

interface EditScreenDialogProps {
  screen: PublicScreen | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface WizardData {
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

export function EditScreenDialog({ screen, open, onOpenChange }: EditScreenDialogProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [wizardData, setWizardData] = useState<WizardData>({
    name: "",
    title: { ...defaultTitleStyling },
    subtitle: { ...defaultSubtitleStyling }
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (screen && open) {
      const config = screen.config;
      setCurrentStep(0);
      setWizardData({
        name: screen.name,
        description: config.description,
        title: config.title || { ...defaultTitleStyling },
        subtitle: config.subtitle || { ...defaultSubtitleStyling },
        ledenlijstSettings: screen.type === 'LEDENLIJST' ? {
          useFullNames: (config as LedenlijstConfig).display?.useFullNames ?? true,
          useInitials: (config as LedenlijstConfig).display?.useInitials ?? false,
          filterByCategories: (config as LedenlijstConfig).display?.filterByCategories ?? true,
          showVotingRights: (config as LedenlijstConfig).display?.showVotingRights ?? false,
          rowsPerPage: (config as LedenlijstConfig).display?.rowsPerPage ?? 20,
          year: (config as LedenlijstConfig).year ?? new Date().getFullYear(),
          categories: (config as LedenlijstConfig).categories ?? []
        } : undefined,
        mededelingenSettings: screen.type === 'MEDEDELINGEN' ? {
          slides: (config as MededelingenConfig).slides || [],
          autoplay: (config as MededelingenConfig).autoplay || {
            enabled: true,
            interval: 8,
            order: 'date'
          },
          style: {
            textColor: (config as MededelingenConfig).style?.textContrast === 'light' ? '#ffffff' : '#000000',
            backgroundColor: (config as MededelingenConfig).style?.background === 'white' ? '#ffffff' : '#000000',
            maxTextWidth: (config as MededelingenConfig).style?.maxTextWidth || 800
          }
        } : undefined
      });
    }
  }, [screen, open]);

  const getSteps = () => {
    if (!screen) return [];
    
    const baseSteps: Array<{ title: string; component: any }> = [
      { title: "Beschrijving", component: DescriptionStep },
      { title: "Opmaak", component: StylingStep }
    ];
    
    if (screen.type === 'LEDENLIJST') {
      baseSteps.push({ title: "Configuratie", component: LedenlijstConfigStep });
    } else if (screen.type === 'MEDEDELINGEN') {
      // Voor mededelingen slaan we de opmaak stap over en gaan direct naar berichten
      baseSteps.splice(1, 1); // Verwijder de "Opmaak" stap
      baseSteps.push({ title: "Berichten", component: MededelingenMessagesStep });
      baseSteps.push({ title: "Carrousel", component: MededelingenCarouselStep });
    }
    
    return baseSteps;
  };

  const steps = getSteps();
  const isLastStep = currentStep === steps.length - 1;

  const canGoNext = () => {
    switch (currentStep) {
      case 0: return wizardData.name.length > 0;
      case 1: 
        if (screen?.type === 'MEDEDELINGEN') {
          // Voor mededelingen is stap 1 de berichten stap
          return !!wizardData.mededelingenSettings && wizardData.mededelingenSettings.slides.length > 0;
        } else {
          // Voor andere types is stap 1 de opmaak stap
          return wizardData.title && wizardData.title.text && wizardData.title.text.length > 0;
        }
      case 2: 
        if (screen?.type === 'LEDENLIJST') return !!wizardData.ledenlijstSettings;
        if (screen?.type === 'MEDEDELINGEN') {
          // Voor mededelingen is stap 2 de carrousel stap
          return !!wizardData.mededelingenSettings?.autoplay;
        }
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

  const handleComplete = async () => {
    if (!screen) return;

    setIsLoading(true);
    try {
      let config: LedenlijstConfig | MededelingenConfig;

      if (screen.type === 'LEDENLIJST') {
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
      } else if (screen.type === 'MEDEDELINGEN') {
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
        // Fallback
        config = {
          description: wizardData.description,
          title: wizardData.title,
          subtitle: wizardData.subtitle,
          display: {
            useFullNames: true,
            useInitials: false,
            filterByCategories: true,
            showVotingRights: false,
            rowsPerPage: 20
          },
          year: new Date().getFullYear(),
          categories: []
        } as LedenlijstConfig;
      }

      await apiRequest('PATCH', `/api/public-screens/${screen.id}`, {
        name: wizardData.name,
        config: config
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/public-screens"] });
      toast({
        title: "Scherm bijgewerkt",
        description: `${wizardData.name} is succesvol bijgewerkt.`,
      });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Fout",
        description: error.message || "Er is een fout opgetreden bij het bijwerken van het scherm.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'LEDENLIJST': return 'Ledenlijst';
      case 'MEDEDELINGEN': return 'Mededelingen';
      case 'MULTIMEDIA': return 'Multimedia';
      default: return type;
    }
  };

  const StepComponent = steps[currentStep]?.component;

  if (!screen) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[95vh] flex flex-col" data-testid="edit-screen-dialog">
        <DialogHeader className="flex-shrink-0 pb-6 border-b border-border">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <Edit className="h-6 w-6" />
            Scherm bewerken: {steps[currentStep]?.title}
          </DialogTitle>
          <DialogDescription className="text-base mt-2">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="h-8">
                {getTypeLabel(screen.type)}
              </Badge>
              <Badge 
                variant={screen.active ? "default" : "secondary"}
                className={screen.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
              >
                {screen.active ? "Actief" : "Inactief"}
              </Badge>
            </div>
            {currentStep === 0 && "Geef je scherm een duidelijke naam en beschrijving"}
            {currentStep === 1 && screen.type === 'MEDEDELINGEN' && "Maak en beheer je berichten"}
            {currentStep === 1 && screen.type !== 'MEDEDELINGEN' && "Pas de titel en ondertitel aan"}
            {currentStep === 2 && screen.type === 'MEDEDELINGEN' && "Stel de carrousel instellingen in"}
            {currentStep === 2 && screen.type !== 'MEDEDELINGEN' && "Configureer de specifieke instellingen"}
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
              disabled={!canGoNext() || isLoading}
              data-testid="wizard-next"
              size="lg"
            >
              {isLoading ? 'Opslaan...' : (isLastStep ? 'Wijzigingen Opslaan' : 'Volgende')}
              {!isLastStep && !isLoading && <ChevronRight className="w-4 h-4 ml-2" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
"use client";

import { PublicScreen } from "@/lib/mock/public-screens";
import { Button } from "@/components/ui/button";
import { RefreshCw, Maximize, Minimize } from "lucide-react";

interface ControlsProps {
  screen: PublicScreen;
  isFullscreen: boolean;
  showControls: boolean;
  onFullscreen: () => void;
  onRefresh: () => void;
}

export function Controls({ 
  screen, 
  isFullscreen, 
  showControls, 
  onFullscreen, 
  onRefresh 
}: ControlsProps) {
  return (
    <div 
      className={`fixed top-4 right-4 flex gap-2 transition-opacity duration-300 z-50 ${
        showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <Button
        variant="secondary"
        size="sm"
        onClick={onRefresh}
        className="bg-black bg-opacity-75 text-white hover:bg-opacity-90 border-0"
        aria-label="Vernieuwen (R)"
      >
        <RefreshCw className="h-4 w-4" />
      </Button>
      
      <Button
        variant="secondary"
        size="sm"
        onClick={onFullscreen}
        className="bg-black bg-opacity-75 text-white hover:bg-opacity-90 border-0"
        aria-label={isFullscreen ? "Volledig scherm verlaten (F)" : "Volledig scherm (F)"}
      >
        {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
      </Button>
    </div>
  );
}
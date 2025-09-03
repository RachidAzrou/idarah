"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { PublicScreensList } from "@/components/public-screens/PublicScreensList";
import { NewScreenDialog } from "@/components/public-screens/NewScreenDialog";
import { EditScreenDrawer } from "@/components/public-screens/EditScreenDrawer";
import { PublicScreen } from "@/lib/mock/public-screens";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function PublicScreensPage() {
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [editScreen, setEditScreen] = useState<PublicScreen | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleCreateScreen = async (screenData: {
    name: string;
    type: any;
    config: any;
  }) => {
    try {
      const response = await apiRequest('POST', '/api/public-screens', {
        name: screenData.name,
        type: screenData.type,
        active: true,
        config: screenData.config
      });

      const screen = await response.json();
      
      // Gebruik slimme cache invalidation in plaats van page reload
      queryClient.invalidateQueries({ queryKey: ["/api/public-screens"] });
      
      toast({
        title: "Scherm aangemaakt",
        description: `${screen.name} is succesvol aangemaakt.`,
      });
    } catch (error: any) {
      toast({
        title: "Fout",
        description: error.message || "Er is een fout opgetreden bij het aanmaken van het scherm.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateScreen = (screen: PublicScreen) => {
    // Invalideer cache voor snellere updates
    queryClient.invalidateQueries({ queryKey: ["/api/public-screens"] });
    
    toast({
      title: "Scherm bijgewerkt",
      description: `${screen.name} is succesvol bijgewerkt.`,
    });
    setEditScreen(null);
  };

  const handleDeleteScreen = (screenName: string) => {
    // Invalideer cache na verwijdering
    queryClient.invalidateQueries({ queryKey: ["/api/public-screens"] });
    
    toast({
      title: "Scherm verwijderd",
      description: `${screenName} is verwijderd.`,
    });
  };

  return (
    <main className="flex-1 py-4">
      <div className="px-4 sm:px-6 lg:px-8 w-full">
        {/* Page Header */}
        <div className="border-b border-gray-200 pb-5 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900" data-testid="page-title">
                Publieke Schermen
              </h1>
              <p className="mt-1 text-sm text-gray-700">
                Genereer & beheer schermen voor betaalstatus en mededelingen
              </p>
            </div>
            <NewScreenDialog onCreateScreen={handleCreateScreen} />
          </div>
        </div>

        {/* Screens List */}
        <PublicScreensList
          onEdit={setEditScreen}
          onDelete={handleDeleteScreen}
        />

        {/* Edit Dialog */}

        <EditScreenDrawer
          screen={editScreen}
          onClose={() => setEditScreen(null)}
          onSave={handleUpdateScreen}
        />
      </div>
    </main>
  );
}
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { PublicScreensList } from "@/components/public-screens/PublicScreensList";
import { NewScreenDialog } from "@/components/public-screens/NewScreenDialog";
import { EditScreenDrawer } from "@/components/public-screens/EditScreenDrawer";
import { PublicScreen } from "@/lib/mock/public-screens";
import { useToast } from "@/hooks/use-toast";

export default function PublicScreensPage() {
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [editScreen, setEditScreen] = useState<PublicScreen | null>(null);
  const { toast } = useToast();

  const handleCreateScreen = async (screenData: {
    name: string;
    type: any;
    config: any;
  }) => {
    // Create screen via store
    const { publicScreensStore } = await import("@/lib/mock/public-screens");
    const screen = publicScreensStore.create({
      name: screenData.name,
      type: screenData.type,
      active: true,
      config: screenData.config
    });
    
    toast({
      title: "Scherm aangemaakt",
      description: `${screen.name} is succesvol aangemaakt.`,
    });
  };

  const handleUpdateScreen = (screen: PublicScreen) => {
    toast({
      title: "Scherm bijgewerkt",
      description: `${screen.name} is succesvol bijgewerkt.`,
    });
    setEditScreen(null);
  };

  const handleDeleteScreen = (screenName: string) => {
    toast({
      title: "Scherm verwijderd",
      description: `${screenName} is verwijderd.`,
    });
  };

  return (
    <main className="flex-1 py-4">
      <div className="px-4 sm:px-6 lg:px-8 w-full">
        {/* Page Header */}
        <div className="mb-8">
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

        {/* Dialogs */}
        <NewScreenDialog
          onCreateScreen={handleCreateScreen}
        />

        <EditScreenDrawer
          screen={editScreen}
          onClose={() => setEditScreen(null)}
          onSave={handleUpdateScreen}
        />
      </div>
    </main>
  );
}
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

  const handleCreateScreen = (screen: PublicScreen) => {
    toast({
      title: "Scherm aangemaakt",
      description: `${screen.name} is succesvol aangemaakt.`,
    });
    setShowNewDialog(false);
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
            <Button 
              onClick={() => setShowNewDialog(true)}
              className="gap-2"
              size="lg"
              data-testid="button-new-screen"
            >
              <Plus className="h-5 w-5" />
              Nieuw scherm
            </Button>
          </div>
        </div>

        {/* Screens List */}
        <PublicScreensList
          onEdit={setEditScreen}
          onDelete={handleDeleteScreen}
        />

        {/* Dialogs */}
        <NewScreenDialog
          open={showNewDialog}
          onClose={() => setShowNewDialog(false)}
          onSave={handleCreateScreen}
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
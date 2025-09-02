"use client";

import { useState } from "react";
import { PublicScreen } from "@/lib/mock/public-screens";
import { formatDateBE } from "@/lib/mock/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { CopyField } from "@/components/ui/CopyField";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Edit, Trash2, ExternalLink, Check } from "lucide-react";
import { GiPowerButton } from "react-icons/gi";
import { FaRegCopy } from "react-icons/fa";

interface ScreenCardProps {
  screen: PublicScreen;
  onEdit: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
}

export function ScreenCard({ screen, onEdit, onToggleStatus, onDelete }: ScreenCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showUrlDialog, setShowUrlDialog] = useState(false);
  const [justCopied, setJustCopied] = useState(false);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setJustCopied(true);
      setTimeout(() => setJustCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      setShowUrlDialog(true);
    }
  };

  const publicUrl = `${window.location.origin}/screen/${screen.publicToken || screen.id}`;

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'PAYMENT_MATRIX': return 'Betaalstatus';
      case 'ANNOUNCEMENTS': return 'Mededelingen';
      default: return type;
    }
  };

  const getTypeVariant = (type: string) => {
    switch (type) {
      case 'PAYMENT_MATRIX': return 'default';
      case 'ANNOUNCEMENTS': return 'secondary';
      default: return 'outline';
    }
  };

  const handleOpenPublic = () => {
    window.open(publicUrl, '_blank');
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate" title={screen.name}>
                {screen.name}
              </h3>
              <div className="flex items-center gap-2">
                <Badge variant={getTypeVariant(screen.type)} className="text-xs">
                  {getTypeLabel(screen.type)}
                </Badge>
                <Badge 
                  variant={screen.active ? "default" : "secondary"}
                  className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent hover:bg-secondary/80 bg-[#cc41415c] text-[#c9170e]"
                >
                  {screen.active ? "Actief" : "Inactief"}
                </Badge>
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyUrl}
                className={`h-8 w-8 p-0 ${justCopied ? 'text-green-600' : ''}`}
                title={justCopied ? "Gekopieerd!" : "Kopieer URL"}
              >
                {justCopied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <FaRegCopy className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenPublic}
                className="h-8 w-8 p-0"
                title="Open publieke view"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onEdit}
                className="h-8 w-8 p-0"
                title="Bewerken"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onToggleStatus}
                className={`h-8 w-8 p-0 ${screen.active ? 'text-green-600' : 'text-gray-400'}`}
                title={screen.active ? "Deactiveren" : "Activeren"}
              >
                <GiPowerButton className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                title="Verwijderen"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="text-sm text-gray-500">
            Laatst gewijzigd: {formatDateBE(screen.updatedAt)}
          </div>
          
          <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
            <div className="flex items-center gap-1 text-gray-600">
              <span>Publieke URL:</span>
              <a 
                href={`/screen/${screen.publicToken || screen.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline truncate"
                data-testid={`link-public-${screen.id}`}
              >
                /screen/{screen.publicToken || screen.id}
              </a>
            </div>
          </div>
          
        </CardContent>
      </Card>
      {/* Copy URL Dialog */}
      <Dialog open={showUrlDialog} onOpenChange={setShowUrlDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Publieke URL</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Deel deze URL om het scherm publiek te tonen:
            </p>
            <CopyField value={publicUrl} />
          </div>
        </DialogContent>
      </Dialog>
      {/* Delete Confirmation */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          onDelete();
          setShowDeleteConfirm(false);
        }}
        title="Scherm verwijderen"
        description={`Weet je zeker dat je "${screen.name}" wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.`}
        confirmText="Verwijderen"
        variant="destructive"
      />
    </>
  );
}
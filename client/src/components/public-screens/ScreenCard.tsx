"use client";

import { useState } from "react";
import { PublicScreen } from "@/lib/mock/public-screens";
import { formatDateBE } from "@/lib/mock/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { CopyField } from "@/components/ui/CopyField";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MoreHorizontal, Eye, Link2, Power, Edit, Trash2, ExternalLink } from "lucide-react";

interface ScreenCardProps {
  screen: PublicScreen;
  onEdit: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
}

export function ScreenCard({ screen, onEdit, onToggleStatus, onDelete }: ScreenCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showUrlDialog, setShowUrlDialog] = useState(false);

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
                  className={screen.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                >
                  {screen.active ? "Actief" : "Inactief"}
                </Badge>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Acties</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setShowUrlDialog(true)}>
                  <Link2 className="h-4 w-4 mr-2" />
                  Kopieer URL
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleOpenPublic}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open publieke view
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Bewerken
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onToggleStatus}>
                  <Power className="h-4 w-4 mr-2" />
                  {screen.active ? "Deactiveren" : "Activeren"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Verwijderen
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
          
          <div className="flex gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => setShowUrlDialog(true)}>
              <Eye className="h-4 w-4 mr-1" />
              Preview
            </Button>
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-1" />
              Bewerken
            </Button>
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
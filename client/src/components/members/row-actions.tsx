import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MoreVertical, Eye, Edit2, UserX, UserCheck, Trash2 } from "lucide-react";
import { useState } from "react";

interface RowActionsProps {
  memberId: string;
  memberName: string;
  isActive: boolean;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onToggleStatus: (id: string, currentStatus: boolean) => void;
  onDelete: (id: string) => void;
}

export function RowActions({ 
  memberId, 
  memberName, 
  isActive, 
  onView, 
  onEdit, 
  onToggleStatus,
  onDelete 
}: RowActionsProps) {
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleToggleStatus = () => {
    if (isActive) {
      setShowDeactivateDialog(true);
    } else {
      onToggleStatus(memberId, isActive);
    }
  };

  const handleConfirmDeactivate = () => {
    onToggleStatus(memberId, isActive);
    setShowDeactivateDialog(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-50"
            data-testid={`member-actions-${memberId}`}
            aria-label="Lidacties"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem 
            onClick={() => onView(memberId)}
            className="cursor-pointer"
            data-testid={`action-view-${memberId}`}
          >
            <Eye className="h-4 w-4 mr-2" />
            Bekijk
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => onEdit(memberId)}
            className="cursor-pointer"
            data-testid={`action-edit-${memberId}`}
          >
            <Edit2 className="h-4 w-4 mr-2" />
            Bewerken
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={handleToggleStatus}
            className={`cursor-pointer ${
              isActive 
                ? 'text-red-600 focus:text-red-600 focus:bg-red-50' 
                : 'text-green-600 focus:text-green-600 focus:bg-green-50'
            }`}
            data-testid={`action-toggle-status-${memberId}`}
          >
            {isActive ? (
              <>
                <UserX className="h-4 w-4 mr-2" />
                Deactiveren
              </>
            ) : (
              <>
                <UserCheck className="h-4 w-4 mr-2" />
                Activeren
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => setShowDeleteDialog(true)}
            className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
            data-testid={`action-delete-${memberId}`}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Verwijderen
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Lid deactiveren</AlertDialogTitle>
            <AlertDialogDescription>
              Weet je zeker dat je <strong>{memberName}</strong> wilt deactiveren? 
              Dit lid zal niet meer toegang hebben tot de diensten en wordt gemarkeerd als inactief.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDeactivate}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Deactiveren
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Lid permanent verwijderen</AlertDialogTitle>
            <AlertDialogDescription>
              Weet je zeker dat je <strong>{memberName}</strong> permanent wilt verwijderen? 
              Deze actie kan niet ongedaan worden gemaakt. Alle gegevens, betalingshistoriek en transacties van dit lid worden definitief gewist.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                onDelete(memberId);
                setShowDeleteDialog(false);
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Permanent Verwijderen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
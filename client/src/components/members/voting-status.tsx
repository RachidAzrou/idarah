import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Check, X } from "lucide-react";
import { useState } from "react";
import { useRuleValidation } from "@/hooks/useRuleValidation";
import { RuleWarning } from "@/components/ui/rule-warning";
import { RuleOverrideDialog } from "@/components/forms/rule-override-dialog";
import { Member } from "@shared/schema";

interface VotingStatusProps {
  member: Member;
  compact?: boolean;
}

export function VotingStatus({ member, compact = false }: VotingStatusProps) {
  const [showOverrideDialog, setShowOverrideDialog] = useState(false);
  const { validateVotingRights } = useRuleValidation();
  
  const memberData = {
    birthDate: member.birthDate ? new Date(member.birthDate) : undefined,
    category: member.category,
    active: member.active,
    // For now assume no overdue fees - this would need to be calculated from backend
    hasOverdueFees: false
  };
  
  const validation = validateVotingRights(memberData);
  
  // Check if member has voting rights enabled in their settings
  const hasVotingRights = member.votingRights;
  
  if (compact) {
    // Compact view for mobile - just show icon and status
    if (!hasVotingRights) {
      return (
        <Badge variant="secondary" className="text-xs">
          <X className="h-3 w-3 mr-1" />
          Geen
        </Badge>
      );
    }
    
    if (validation.isValid) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
          <Check className="h-3 w-3 mr-1" />
          Ja
        </Badge>
      );
    } else {
      return (
        <Badge variant="destructive" className="text-xs">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Override
        </Badge>
      );
    }
  }
  
  // Full view for desktop
  if (!hasVotingRights) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="secondary">
          <X className="h-3 w-3 mr-1" />
          Geen stemrecht
        </Badge>
      </div>
    );
  }
  
  if (validation.isValid) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="default" className="bg-green-100 text-green-800">
          <Check className="h-4 w-4 mr-1" />
          Stemgerechtigd
        </Badge>
      </div>
    );
  }
  
  // Member has voting rights but doesn't meet rules - show warning
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Badge variant="destructive">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Handmatige override
        </Badge>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowOverrideDialog(true)}
          className="h-6 px-2 text-xs"
          data-testid={`voting-override-${member.id}`}
        >
          Details
        </Button>
      </div>
      
      <RuleOverrideDialog
        open={showOverrideDialog}
        onOpenChange={setShowOverrideDialog}
        memberId={member.id}
        memberName={`${member.firstName} ${member.lastName}`}
        currentStatus={hasVotingRights}
        warnings={validation.warnings}
        ruleScope="STEMRECHT"
        onSuccess={() => {
          // Refresh the data or update local state
          window.location.reload();
        }}
      />
    </div>
  );
}
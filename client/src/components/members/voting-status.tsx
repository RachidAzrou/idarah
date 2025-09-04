import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import { Member } from "@shared/schema";

interface VotingStatusProps {
  member: Member;
  compact?: boolean;
}

export function VotingStatus({ member, compact = false }: VotingStatusProps) {
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
    
    return (
      <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
        <Check className="h-3 w-3 mr-1" />
        Ja
      </Badge>
    );
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
  
  return (
    <div className="flex items-center gap-2">
      <Badge variant="default" className="bg-green-100 text-green-800">
        <Check className="h-4 w-4 mr-1" />
        Stemgerechtigd
      </Badge>
    </div>
  );
}
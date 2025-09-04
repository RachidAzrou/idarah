import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBoardMemberStatus } from "@/hooks/useBoardMemberStatus";

interface BoardMemberBadgeProps {
  memberId: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'subtle' | 'embossed';
}

const sizeClasses = {
  sm: "w-3 h-3",
  md: "w-4 h-4", 
  lg: "w-5 h-5"
};

export function BoardMemberBadge({ 
  memberId, 
  className,
  size = 'md',
  variant = 'subtle'
}: BoardMemberBadgeProps) {
  const { isActiveBoardMember } = useBoardMemberStatus(memberId);

  if (!isActiveBoardMember) {
    return null;
  }

  const baseStyles = cn(
    "text-yellow-500",
    sizeClasses[size],
    className
  );

  const embossedStyles = variant === 'embossed' ? {
    background: 'linear-gradient(45deg, #FFD700, #CDA434)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    filter: 'drop-shadow(0 1px 3px rgba(255, 215, 0, 0.5))',
  } : {};

  return (
    <Crown
      className={baseStyles}
      style={{
        color: variant === 'subtle' ? '#FFD700' : undefined,
        ...embossedStyles
      }}
      aria-label="Actief bestuurslid"
      data-testid={`crown-${memberId}`}
    />
  );
}
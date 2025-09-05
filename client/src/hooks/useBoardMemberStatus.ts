import { useQuery } from "@tanstack/react-query";

export function useBoardMemberStatus(memberId?: string) {
  const { data: boardStatus } = useQuery({
    queryKey: ["/api/public/board-status", memberId],
    enabled: !!memberId,
    staleTime: 30000, // Cache for 30 seconds
    // Use public endpoint that doesn't require authentication
    queryFn: async () => {
      const response = await fetch(`/api/public/board-status/${memberId}`);
      if (!response.ok) {
        if (response.status === 404) return { isActiveBoardMember: false };
        throw new Error('Failed to fetch board member status');
      }
      return response.json();
    }
  });

  return {
    isActiveBoardMember: boardStatus?.isActiveBoardMember || false,
    boardMemberRole: boardStatus?.role,
    boardMember: boardStatus,
  };
}

export function useBoardMemberBadge(memberId?: string) {
  const { isActiveBoardMember } = useBoardMemberStatus(memberId);
  
  return {
    shouldShowCrown: isActiveBoardMember,
    crownProps: {
      className: "w-4 h-4",
      style: { color: '#FFD700' },
      "aria-label": "Actief bestuurslid"
    }
  };
}
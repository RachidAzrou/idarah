import { useQuery } from "@tanstack/react-query";

export function useBoardMemberStatus(memberId?: string) {
  const { data: boardMember } = useQuery({
    queryKey: ["/api/board/members", "by-member", memberId],
    enabled: !!memberId,
    staleTime: 30000, // Cache for 30 seconds
    // Custom query function since we need a different API call structure
    queryFn: async () => {
      const response = await fetch(`/api/board/members?memberId=${memberId}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to fetch board member status');
      }
      const data = await response.json();
      return data.length > 0 ? data[0] : null;
    }
  });

  return {
    isActiveBoardMember: boardMember?.boardMember?.status === 'ACTIEF',
    boardMemberRole: boardMember?.boardMember?.role,
    boardMember: boardMember?.boardMember,
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
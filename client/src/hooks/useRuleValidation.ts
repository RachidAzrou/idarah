import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export interface VotingRightsStatus {
  eligible: boolean;
  hasOverride: boolean;
  reason: string;
  warnings: string[];
}

export interface RuleOverride {
  id: string;
  memberId: string;
  ruleScope: 'STEMRECHT' | 'VERKIESBAAR';
  overrideValue: boolean;
  reason: string;
  overriddenBy: string;
  overriddenAt: string;
  active: boolean;
}

export const useVotingRights = (memberId: string) => {
  return useQuery<VotingRightsStatus>({
    queryKey: [`/api/members/${memberId}/voting-rights`],
    enabled: !!memberId,
  });
};

export const useVotingRightsOverride = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      memberId, 
      overrideValue, 
      reason 
    }: { 
      memberId: string; 
      overrideValue: boolean; 
      reason: string; 
    }) => {
      const response = await apiRequest('POST', `/api/members/${memberId}/voting-rights/override`, {
        overrideValue,
        reason
      });
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate voting rights query for this member
      queryClient.invalidateQueries({ 
        queryKey: [`/api/members/${variables.memberId}/voting-rights`] 
      });
      
      // Also invalidate member list to refresh any voting rights indicators
      queryClient.invalidateQueries({ 
        queryKey: ['/api/members'] 
      });
    },
  });
};

export const useRuleValidation = () => {
  const validateVotingRights = (member: any): { 
    isValid: boolean; 
    warnings: string[]; 
    reasons: string[] 
  } => {
    const warnings: string[] = [];
    const reasons: string[] = [];
    let isValid = true;

    // Age validation for voting rights
    if (member.birthDate) {
      const birthDate = new Date(member.birthDate);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      if (age < 18) {
        isValid = false;
        warnings.push('⚠️ Lid is jonger dan 18 jaar');
        reasons.push('Minimumleeftijd voor stemrecht is 18 jaar');
      }
    }

    // Category validation
    if (member.category === 'STUDENT' || member.category === 'JEUGD') {
      isValid = false;
      warnings.push(`⚠️ Categorie '${member.category}' heeft normaliter geen stemrecht`);
      reasons.push('Studenten en jeugdleden hebben volgens standaard regels geen stemrecht');
    }

    // Active membership check
    if (!member.active) {
      isValid = false;
      warnings.push('⚠️ Lid is niet actief');
      reasons.push('Alleen actieve leden hebben stemrecht');
    }

    return { isValid, warnings, reasons };
  };

  return {
    validateVotingRights
  };
};
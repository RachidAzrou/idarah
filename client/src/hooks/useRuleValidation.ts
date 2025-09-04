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

// Hook for getting organizational rules from the database
export const useOrganizationRules = () => {
  return useQuery({
    queryKey: ['/api/rules'],
  });
};

export const useRuleValidation = () => {
  const { data: rules = [] } = useOrganizationRules();
  
  const validateVotingRights = (member: any): { 
    isValid: boolean; 
    warnings: string[]; 
    reasons: string[] 
  } => {
    const warnings: string[] = [];
    const reasons: string[] = [];
    let isValid = true;

    // Get voting rules from the database
    const votingRules = rules.filter((rule: any) => 
      rule.scope === 'STEMRECHT' && rule.active
    );

    // If no custom rules exist, apply default validation
    if (votingRules.length === 0) {
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
      if (member.category === 'STUDENT') {
        isValid = false;
        warnings.push(`⚠️ Categorie '${member.category}' heeft normaliter geen stemrecht`);
        reasons.push('Studenten hebben volgens standaard regels geen stemrecht');
      }

      // Active membership check
      if (!member.active) {
        isValid = false;
        warnings.push('⚠️ Lid is niet actief');
        reasons.push('Alleen actieve leden hebben stemrecht');
      }
    } else {
      // Apply custom rules from the database
      for (const rule of votingRules) {
        const params = rule.parameters || {};
        
        // Check minimum years (if rule exists)
        if (params.minYears) {
          const membershipYears = member.createdAt ? 
            (Date.now() - new Date(member.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 365) 
            : 0;
          
          if (membershipYears < params.minYears) {
            isValid = false;
            warnings.push(`⚠️ ${rule.name || 'Regel overtreden'}`);
            reasons.push(`Minimaal ${params.minYears} jaar lidmaatschap vereist`);
          }
        }
        
        // Check minimum age
        if (params.minAge && member.birthDate) {
          const birthDate = new Date(member.birthDate);
          const today = new Date();
          let age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }

          if (age < params.minAge) {
            isValid = false;
            warnings.push(`⚠️ ${rule.name || 'Regel overtreden'}`);
            reasons.push(`Minimumleeftijd ${params.minAge} jaar vereist`);
          }
        }
        
        // Check categories (if restricted)
        if (params.categories && params.categories.length > 0) {
          if (!params.categories.includes(member.category)) {
            isValid = false;
            warnings.push(`⚠️ ${rule.name || 'Regel overtreden'}`);
            reasons.push(`Categorie '${member.category}' komt niet voor in toegestane categorieën`);
          }
        }
      }
      
      // Always check if member is active
      if (!member.active) {
        isValid = false;
        warnings.push('⚠️ Lid is niet actief');
        reasons.push('Alleen actieve leden hebben stemrecht');
      }
    }

    return { isValid, warnings, reasons };
  };

  return {
    validateVotingRights
  };
};
import { useQuery } from "@tanstack/react-query";
import type { 
  MoneyPoint, 
  CategorySlice, 
  StackedMonth, 
  FeeStatusMonth, 
  TopMember, 
  MethodSlice 
} from "@shared/schema";

// Rapportage filters interface
export interface ReportFilters {
  from?: string;
  to?: string;
  types?: string[];
  categories?: string[];
  methods?: string[];
  statuses?: string[];
}

/**
 * Hook voor cashflow rapportage
 */
export function useCashflowSeries(filters: ReportFilters = {}) {
  return useQuery({
    queryKey: ['/api/reports/cashflow', filters],
    staleTime: 5 * 60 * 1000, // 5 minuten
    select: (data): MoneyPoint[] => data || [],
  });
}

/**
 * Hook voor categorie breakdown (inkomsten of uitgaven)
 */
export function useCategoryBreakdown(
  filters: ReportFilters = {}, 
  kind: "income" | "expense" = "expense"
) {
  return useQuery({
    queryKey: ['/api/reports/categories', { ...filters, kind }],
    staleTime: 5 * 60 * 1000,
    select: (data): CategorySlice[] => data || [],
  });
}

/**
 * Hook voor gestapelde categorie data per maand
 */
export function useStackedByCategory(filters: ReportFilters = {}) {
  return useQuery({
    queryKey: ['/api/reports/stacked-by-category', filters],
    staleTime: 5 * 60 * 1000,
    select: (data): StackedMonth[] => data || [],
  });
}

/**
 * Hook voor fee status trend over tijd
 */
export function useFeeStatusTrend(filters: ReportFilters = {}) {
  return useQuery({
    queryKey: ['/api/reports/fee-status-trend', filters],
    staleTime: 5 * 60 * 1000,
    select: (data): FeeStatusMonth[] => data || [],
  });
}

/**
 * Hook voor top leden per totaal bedrag
 */
export function useTopMembers(filters: ReportFilters = {}) {
  return useQuery({
    queryKey: ['/api/reports/top-members', filters],
    staleTime: 5 * 60 * 1000,
    select: (data): TopMember[] => data || [],
  });
}

/**
 * Hook voor betaalmethode breakdown
 */
export function useMethodBreakdown(filters: ReportFilters = {}) {
  return useQuery({
    queryKey: ['/api/reports/methods', filters],
    staleTime: 5 * 60 * 1000,
    select: (data): MethodSlice[] => data || [],
  });
}

/**
 * Hook voor reconciliatie data
 */
export function useBankStatements() {
  return useQuery({
    queryKey: ['/api/finance/statements'],
    staleTime: 30 * 1000, // 30 seconden
  });
}

export function useBankTransactions(filters: {
  status?: string;
  from?: string;
  to?: string;
  side?: 'CREDIT' | 'DEBET';
  category?: string;
  vendor?: string;
  q?: string;
} = {}) {
  return useQuery({
    queryKey: ['/api/finance/bank-transactions', filters],
    staleTime: 30 * 1000,
  });
}

/**
 * Hook voor expense categories
 */
export function useExpenseCategories() {
  return useQuery({
    queryKey: ['/api/finance/categories'],
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook voor vendors
 */
export function useVendors() {
  return useQuery({
    queryKey: ['/api/finance/vendors'],
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook voor match rules
 */
export function useMatchRules() {
  return useQuery({
    queryKey: ['/api/finance/rules'],
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Utility hook voor combined financiële rapportage
 */
export function useFinancialDashboard(filters: ReportFilters = {}) {
  const cashflow = useCashflowSeries(filters);
  const categoryExpenses = useCategoryBreakdown(filters, "expense");
  const categoryIncome = useCategoryBreakdown(filters, "income");
  const feeStatusTrend = useFeeStatusTrend(filters);
  const topMembers = useTopMembers(filters);
  const methodBreakdown = useMethodBreakdown(filters);

  return {
    cashflow,
    categoryExpenses,
    categoryIncome,
    feeStatusTrend,
    topMembers,
    methodBreakdown,
    loading: cashflow.isLoading || 
             categoryExpenses.isLoading || 
             categoryIncome.isLoading || 
             feeStatusTrend.isLoading || 
             topMembers.isLoading || 
             methodBreakdown.isLoading,
    error: cashflow.error || 
           categoryExpenses.error || 
           categoryIncome.error || 
           feeStatusTrend.error || 
           topMembers.error || 
           methodBreakdown.error,
  };
}
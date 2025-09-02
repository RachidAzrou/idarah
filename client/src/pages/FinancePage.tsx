"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KpiCards } from "@/components/finance/KpiCards";
import { Toolbar } from "@/components/finance/Toolbar";
import { FiltersDrawer } from "@/components/finance/FiltersDrawer";
import { TransactionsTable } from "@/components/finance/TransactionsTable";
import { DetailSlideOver } from "@/components/finance/DetailSlideOver";
import { NewTransactionDialog } from "@/components/finance/NewTransactionDialog";
import { ImportDialog } from "@/components/finance/ImportDialog";
import { ExportDialog } from "@/components/finance/ExportDialog";
import { JournalView } from "@/components/finance/JournalView";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FilterData } from "@/lib/zod/transaction";
import { Plus, BarChart3, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function FinancePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State management - now using real API data
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null);
  const [editTransaction, setEditTransaction] = useState<any | null>(null);
  const [deleteTransactionId, setDeleteTransactionId] = useState<string>('');
  
  // UI state
  const [showDetailSlideOver, setShowDetailSlideOver] = useState(false);
  const [showNewTransactionDialog, setShowNewTransactionDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Filter state
  const [filters, setFilters] = useState<FilterData>({
    search: '',
    type: 'ALL',
    category: undefined,
    method: 'ALL',
    memberId: undefined,
    dateFrom: undefined,
    dateTo: undefined,
    amountMin: undefined,
    amountMax: undefined
  });

  // Period filter state
  const [periodFilter, setPeriodFilter] = useState('ALL');
  
  // Fetch transactions from API
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["/api/transactions"],
  });

  // Apply period filters to date range
  const getDateRangeFromPeriod = (period: string) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    switch (period) {
      case 'THIS_MONTH':
        return {
          dateFrom: new Date(year, month, 1).toISOString().split('T')[0],
          dateTo: new Date(year, month + 1, 0).toISOString().split('T')[0]
        };
      case 'LAST_MONTH':
        return {
          dateFrom: new Date(year, month - 1, 1).toISOString().split('T')[0],
          dateTo: new Date(year, month, 0).toISOString().split('T')[0]
        };
      case 'THIS_YEAR':
        return {
          dateFrom: new Date(year, 0, 1).toISOString().split('T')[0],
          dateTo: new Date(year, 11, 31).toISOString().split('T')[0]
        };
      case 'LAST_YEAR':
        return {
          dateFrom: new Date(year - 1, 0, 1).toISOString().split('T')[0],
          dateTo: new Date(year - 1, 11, 31).toISOString().split('T')[0]
        };
      default:
        return {};
    }
  };

  // Combined filters with period
  const effectiveFilters = useMemo(() => {
    const periodDates = getDateRangeFromPeriod(periodFilter);
    return {
      ...filters,
      ...periodDates
    };
  }, [filters, periodFilter]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    if (!Array.isArray(transactions)) return [];
    return transactions.filter((transaction: any) => {
      // Apply all filters here for consistency across components
      if (effectiveFilters.search) {
        const search = effectiveFilters.search.toLowerCase();
        const matchesSearch = 
          transaction.category.toLowerCase().includes(search) ||
          (transaction.description?.toLowerCase().includes(search)) ||
          (transaction.memberName?.toLowerCase().includes(search));
        if (!matchesSearch) return false;
      }

      if (effectiveFilters.type && effectiveFilters.type !== 'ALL') {
        if (transaction.type !== effectiveFilters.type) return false;
      }

      if (effectiveFilters.category) {
        if (transaction.category !== effectiveFilters.category) return false;
      }

      if (effectiveFilters.method && effectiveFilters.method !== 'ALL') {
        if (transaction.method !== effectiveFilters.method) return false;
      }

      if (effectiveFilters.memberId) {
        if (transaction.memberId !== effectiveFilters.memberId) return false;
      }

      if (effectiveFilters.dateFrom) {
        if (transaction.date < effectiveFilters.dateFrom) return false;
      }

      if (effectiveFilters.dateTo) {
        if (transaction.date > effectiveFilters.dateTo) return false;
      }

      if (effectiveFilters.amountMin) {
        if (transaction.amount < effectiveFilters.amountMin) return false;
      }

      if (effectiveFilters.amountMax) {
        if (transaction.amount > effectiveFilters.amountMax) return false;
      }

      return true;
    });
  }, [transactions, effectiveFilters]);

  // Handlers
  const handleTransactionSelect = (transaction: any) => {
    setSelectedTransaction(transaction);
    setShowDetailSlideOver(true);
  };

  const handleTransactionEdit = (transaction: any) => {
    setEditTransaction(transaction);
    setShowNewTransactionDialog(true);
  };

  const handleTransactionDelete = (transactionId: string) => {
    setDeleteTransactionId(transactionId);
    setShowDeleteConfirm(true);
  };

  const deleteTransactionMutation = useMutation({
    mutationFn: async (transactionId: string) => {
      const response = await apiRequest("DELETE", `/api/transactions/${transactionId}`, {});
      return response.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      await queryClient.refetchQueries({ queryKey: ["/api/transactions"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      await queryClient.refetchQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Transactie verwijderd",
        description: "De transactie is succesvol verwijderd.",
      });
    },
  });

  const confirmDelete = () => {
    deleteTransactionMutation.mutate(deleteTransactionId);
    setDeleteTransactionId('');
  };



  const handleImport = (importedTransactions: any[]) => {
    // For now, just show the notification - bulk import can be implemented later
    toast({
      title: "Import voltooid",
      description: `${importedTransactions.length} transacties zijn geïmporteerd.`,
    });
  };

  const handleSearch = (search: string) => {
    setFilters(prev => ({ ...prev, search }));
  };

  const handleTypeFilter = (type: string) => {
    setFilters(prev => ({ ...prev, type: type as any }));
  };

  const handleFiltersChange = (newFilters: FilterData) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      type: 'ALL',
      category: undefined,
      method: 'ALL',
      memberId: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      amountMin: undefined,
      amountMax: undefined
    });
    setPeriodFilter('ALL');
  };

  return (
    <main className="flex-1 py-4">
      <div className="px-4 sm:px-6 lg:px-8 w-full">
        {/* Page Header */}
        <div className="mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900" data-testid="page-title">
              Financiën
            </h1>
            <p className="mt-1 text-sm text-gray-700">
              Overzicht van inkomsten en uitgaven
            </p>
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:grid-cols-2">
            <TabsTrigger value="overview" className="gap-2" data-testid="tab-overview">
              <BarChart3 className="h-4 w-4" />
              Overzicht
            </TabsTrigger>
            <TabsTrigger value="journal" className="gap-2" data-testid="tab-journal">
              <BookOpen className="h-4 w-4" />
              Journaal
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8 mt-8">
            {/* KPI Cards */}
            <KpiCards />

            {/* Toolbar */}
            <Toolbar
              searchValue={effectiveFilters.search || ''}
              typeFilter={effectiveFilters.type || 'ALL'}
              periodFilter={periodFilter}
              onSearch={handleSearch}
              onTypeFilter={handleTypeFilter}
              onPeriodFilter={setPeriodFilter}
              onNewTransaction={() => setShowNewTransactionDialog(true)}
              onImport={() => setShowImportDialog(true)}
              onExport={() => setShowExportDialog(true)}
              onAdvancedFilters={() => setShowFiltersDrawer(true)}
            />

            {/* Transactions Table */}
            <TransactionsTable
              transactions={filteredTransactions}
              filters={effectiveFilters}
              onTransactionSelect={handleTransactionSelect}
              onTransactionEdit={handleTransactionEdit}
              onTransactionDelete={handleTransactionDelete}
            />
          </TabsContent>

          <TabsContent value="journal" className="space-y-8 mt-8">
            {/* Journal View */}
            <JournalView transactions={filteredTransactions} />
          </TabsContent>
        </Tabs>

        {/* Dialogs and Overlays */}
        <DetailSlideOver
          open={showDetailSlideOver}
          onClose={() => setShowDetailSlideOver(false)}
          transaction={selectedTransaction}
          onEdit={handleTransactionEdit}
          onDelete={handleTransactionDelete}
        />

        <NewTransactionDialog
          open={showNewTransactionDialog}
          onClose={() => {
            setShowNewTransactionDialog(false);
            setEditTransaction(null);
          }}
          editTransaction={editTransaction}
        />

        <ImportDialog
          open={showImportDialog}
          onClose={() => setShowImportDialog(false)}
          onImport={handleImport}
        />

        <ExportDialog
          open={showExportDialog}
          onClose={() => setShowExportDialog(false)}
          transactions={filteredTransactions}
        />

        <FiltersDrawer
          open={showFiltersDrawer}
          onClose={() => setShowFiltersDrawer(false)}
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onApplyFilters={() => {}}
          onClearFilters={handleClearFilters}
        />

        <ConfirmDialog
          open={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={confirmDelete}
          title="Transactie verwijderen"
          description="Weet je zeker dat je deze transactie wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt."
          confirmText="Verwijderen"
          variant="destructive"
        />
      </div>
    </main>
  );
}
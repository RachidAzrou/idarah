import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Link } from "wouter";
import { KpiCards } from "@/components/fees/kpi-cards";
import { NewFeeDialog } from "@/components/fees/new-fee-dialog";
import { Toolbar } from "@/components/fees/toolbar";
import { FeesTable } from "@/components/fees/fees-table";
import { FeeDetailSlideout } from "@/components/fees/fee-detail-slideout";
import { ImportDialog } from "@/components/fees/import-dialog";
import { SepaDialog } from "@/components/fees/sepa-dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Lidgelden() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Data state - now using real API
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedFee, setSelectedFee] = useState<any | null>(null);

  // Filters and search
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [amountMin, setAmountMin] = useState<number | undefined>();
  const [amountMax, setAmountMax] = useState<number | undefined>();
  const [paidFrom, setPaidFrom] = useState<Date | undefined>();
  const [paidTo, setPaidTo] = useState<Date | undefined>();
  const [onlyWithMandate, setOnlyWithMandate] = useState(false);
  const [onlyOverdue, setOnlyOverdue] = useState(false);

  // Table state
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [sortBy, setSortBy] = useState("periodStart");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Dialog state
  const [showDetailSlideout, setShowDetailSlideout] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showSepaDialog, setShowSepaDialog] = useState(false);
  const [showChangeMethodDialog, setShowChangeMethodDialog] = useState(false);
  const [showNewFeeDialog, setShowNewFeeDialog] = useState(false);

  // Fetch membership fees from API
  const { data: allFees = [], isLoading } = useQuery({
    queryKey: ["/api/fees"],
  });

  // Apply filters and sorting
  const filteredFees = useMemo(() => {
    if (!allFees?.length) return [];
    
    return allFees.filter((fee: any) => {
      // Search filter
      const searchMatch = searchTerm === "" || 
        fee.memberName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fee.memberNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fee.type?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Status filter
      const statusMatch = statusFilter === "all" || fee.status === statusFilter;
      
      // Year filter
      const yearMatch = yearFilter === "all" || 
        new Date(fee.periodStart).getFullYear().toString() === yearFilter;
      
      // Method filter
      const methodMatch = methodFilter === "all" || fee.method === methodFilter;
      
      // Category filter
      const categoryMatch = categoryFilter === "all" || fee.type === categoryFilter;
      
      return searchMatch && statusMatch && yearMatch && methodMatch && categoryMatch;
    }).sort((a: any, b: any) => {
      const aValue = a[sortBy as keyof typeof a];
      const bValue = b[sortBy as keyof typeof b];
      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [allFees, searchTerm, statusFilter, yearFilter, methodFilter, categoryFilter, sortBy, sortOrder]);

  // Paginate results
  const paginatedResult = useMemo(() => {
    const start = (page - 1) * perPage;
    const end = start + perPage;
    const items = filteredFees.slice(start, end);
    return {
      items,
      totalCount: filteredFees.length,
      totalPages: Math.ceil(filteredFees.length / perPage),
      currentPage: page,
      hasNext: page < Math.ceil(filteredFees.length / perPage),
      hasPrev: page > 1
    };
  }, [filteredFees, page, perPage]);

  // Selected fees for bulk actions
  const selectedFees = allFees.filter(fee => selectedIds.includes(fee.id));
  const sepaSelectedFees = selectedFees.filter(fee => fee.method === "SEPA" && fee.status === "OPEN" && fee.hasMandate);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const handleRowAction = (action: string, fee: Fee) => {
    switch (action) {
      case "markPaid":
        handleMarkPaid([fee]);
        break;
      case "viewDetail":
        setSelectedFee(fee);
        setShowDetailSlideout(true);
        break;
      case "changeMethod":
        setSelectedFee(fee);
        setShowChangeMethodDialog(true);
        break;
      case "delete":
        handleDeleteFee(fee);
        break;
    }
  };

  const markPaidMutation = useMutation({
    mutationFn: async (feeId: string) => {
      const response = await apiRequest("PUT", `/api/fees/${feeId}/mark-paid`, {});
      return response.json();
    },
    onSuccess: async (result, feeId) => {
      // Optimistic update - markeer fee als betaald
      queryClient.setQueryData(["/api/fees"], (oldData: any) => {
        if (!Array.isArray(oldData)) return oldData;
        return oldData.map((fee: any) => 
          fee.id === feeId ? { ...fee, status: 'PAID', paidDate: new Date().toISOString() } : fee
        );
      });
      
      await queryClient.invalidateQueries({ queryKey: ["/api/fees"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Lidgeld gemarkeerd als betaald",
        description: "De betaalstatus is bijgewerkt.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Fout",
        description: "Kon lidgeld niet markeren als betaald.",
      });
    },
  });

  const deleteFeeMutation = useMutation({
    mutationFn: async (feeId: string) => {
      const response = await apiRequest("DELETE", `/api/fees/${feeId}`, {});
      return response.json();
    },
    onSuccess: async (result, feeId) => {
      // Optimistic update - verwijder fee uit lijst
      queryClient.setQueryData(["/api/fees"], (oldData: any) => {
        if (!Array.isArray(oldData)) return oldData;
        return oldData.filter((fee: any) => fee.id !== feeId);
      });
      
      await queryClient.invalidateQueries({ queryKey: ["/api/fees"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Lidgeld verwijderd",
        description: "Het lidgeld is verwijderd.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive", 
        title: "Fout",
        description: "Kon lidgeld niet verwijderen.",
      });
    },
  });

  const changeMethodMutation = useMutation({
    mutationFn: async ({ feeId, method }: { feeId: string; method: string }) => {
      const response = await apiRequest("PUT", `/api/fees/${feeId}`, { method });
      return response.json();
    },
    onSuccess: async (result, { feeId }) => {
      // Optimistic update - verander method
      queryClient.setQueryData(["/api/fees"], (oldData: any) => {
        if (!Array.isArray(oldData)) return oldData;
        return oldData.map((fee: any) => 
          fee.id === feeId ? { ...fee, method: result.method } : fee
        );
      });
      
      await queryClient.invalidateQueries({ queryKey: ["/api/fees"] });
      setShowChangeMethodDialog(false);
      toast({
        title: "Betaalmethode gewijzigd",
        description: "De betaalmethode is bijgewerkt.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive", 
        title: "Fout",
        description: "Kon betaalmethode niet wijzigen.",
      });
    },
  });

  const handleMarkPaid = (fees: any[]) => {
    fees.forEach(fee => markPaidMutation.mutate(fee.id));
    setSelectedIds(prev => prev.filter(id => !fees.find(f => f.id === id)));
  };

  const handleDeleteFee = (fee: Fee) => {
    if (confirm(`Weet je zeker dat je het lidgeld voor ${fee.memberName} (${fee.period}) wilt verwijderen?`)) {
      deleteFeeMutation.mutate(fee.id);
    }
  };

  const handleBulkMarkPaid = () => {
    handleMarkPaid(selectedFees);
  };

  const handleGenerateSepa = () => {
    setShowSepaDialog(true);
  };

  const handleSepaGenerate = (batchRef: string, executionDate: string) => {
    console.log("SEPA batch generated:", { batchRef, executionDate, fees: sepaSelectedFees });
    setSelectedIds([]);
  };

  const handleImport = (matches: any[]) => {
    console.log("Importing payments:", matches);
    // In a real app, this would update the fees and call an API
  };

  const handleExport = () => {
    // Generate CSV export
    const csvContent = [
      ["Lidnummer", "Naam", "Periode", "Bedrag", "Status", "Methode", "Betaald op"].join(","),
      ...filteredFees.map(fee => [
        fee.memberNumber,
        `"${fee.memberFirstName} ${fee.memberLastName}"`,
        `"${fee.periodStart} - ${fee.periodEnd}"`,
        fee.amount.toString(),
        fee.status,
        fee.method,
        fee.paidAt || ""
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `lidgelden-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const resetAllFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setYearFilter("all");
    setMethodFilter("all");
    setCategoryFilter("all");
    setAmountMin(undefined);
    setAmountMax(undefined);
    setPaidFrom(undefined);
    setPaidTo(undefined);
    setOnlyWithMandate(false);
    setOnlyOverdue(false);
  };

  return (
    <main className="flex-1 py-4">
      <div className="px-4 sm:px-6 lg:px-8 w-full">
        {/* Page Header */}
        <div className="mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900" data-testid="page-title">Lidgelden</h1>
            <p className="mt-1 text-sm text-gray-700">Beheer lidgelden, automatiseer incasso's en volg betalingen op</p>
          </div>
        </div>

        {/* KPI Cards */}
        <KpiCards fees={allFees} />

        {/* Toolbar */}
        <div className="mb-6">
          <Toolbar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            yearFilter={yearFilter}
            onYearFilterChange={setYearFilter}
            methodFilter={methodFilter}
            onMethodFilterChange={setMethodFilter}
            selectedCount={selectedIds.length}
            sepaSelectedCount={sepaSelectedFees.length}
            onExport={handleExport}
            onImport={() => setShowImportDialog(true)}
            onGenerateSepa={handleGenerateSepa}
            onBulkMarkPaid={handleBulkMarkPaid}
            categoryFilter={categoryFilter}
            onCategoryFilterChange={setCategoryFilter}
            amountMin={amountMin}
            onAmountMinChange={setAmountMin}
            amountMax={amountMax}
            onAmountMaxChange={setAmountMax}
            paidFrom={paidFrom}
            onPaidFromChange={setPaidFrom}
            paidTo={paidTo}
            onPaidToChange={setPaidTo}
            onlyWithMandate={onlyWithMandate}
            onOnlyWithMandateChange={setOnlyWithMandate}
            onlyOverdue={onlyOverdue}
            onOnlyOverdueChange={setOnlyOverdue}
            onResetFilters={resetAllFilters}
            newButton={
              <Button 
                className="flex items-center gap-2"
                onClick={() => setShowNewFeeDialog(true)}
              >
                <Plus className="h-4 w-4" />
                Nieuw lidgeld
              </Button>
            }
          />
        </div>

        {/* Table */}
        <FeesTable
          fees={paginatedResult.items}
          total={filteredFees.length}
          page={page}
          perPage={perPage}
          onPageChange={setPage}
          onPerPageChange={(newPerPage) => {
            setPerPage(newPerPage);
            setPage(1);
          }}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onRowAction={handleRowAction}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          loading={isLoading}
        />

        {/* Dialogs */}
        <FeeDetailSlideout
          fee={selectedFee}
          open={showDetailSlideout}
          onClose={() => {
            setShowDetailSlideout(false);
            setSelectedFee(null);
          }}
          onMarkPaid={(fee) => {
            handleMarkPaid([fee]);
            setShowDetailSlideout(false);
            setSelectedFee(null);
          }}
        />

        <ImportDialog
          open={showImportDialog}
          onClose={() => setShowImportDialog(false)}
          fees={allFees.filter(fee => fee.status === "OPEN")}
          onImport={handleImport}
        />

        <SepaDialog
          open={showSepaDialog}
          onClose={() => setShowSepaDialog(false)}
          fees={selectedFees}
          onGenerate={handleSepaGenerate}
        />

        <NewFeeDialog
          open={showNewFeeDialog}
          onOpenChange={setShowNewFeeDialog}
          onSuccess={() => {
            // Data wordt automatisch bijgewerkt via optimistic updates
          }}
        />

        <Dialog open={showChangeMethodDialog} onOpenChange={setShowChangeMethodDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Betaalmethode wijzigen</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>Wijzig de betaalmethode voor {selectedFee?.memberName} ({selectedFee?.period})</p>
              <Select 
                defaultValue={selectedFee?.method}
                onValueChange={(value) => {
                  if (selectedFee) {
                    changeMethodMutation.mutate({ feeId: selectedFee.id, method: value });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer betaalmethode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SEPA">SEPA</SelectItem>
                  <SelectItem value="BANCONTACT">Bancontact</SelectItem>
                  <SelectItem value="TRANSFER">Overschrijving</SelectItem>
                  <SelectItem value="CASH">Contant</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
}
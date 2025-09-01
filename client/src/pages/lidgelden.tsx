import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { KpiCards } from "@/components/fees/kpi-cards";
import { Toolbar } from "@/components/fees/toolbar";
import { FiltersDrawer } from "@/components/fees/filters-drawer";
import { FeesTable } from "@/components/fees/fees-table";
import { FeeDetailSlideout } from "@/components/fees/fee-detail-slideout";
import { ImportDialog } from "@/components/fees/import-dialog";
import { SepaDialog } from "@/components/fees/sepa-dialog";
import { generateMockFees, filterFees, sortFees, paginateFees, markPaid } from "@/lib/mock/fees";
import { Fee } from "@shared/fees-schema";

export default function Lidgelden() {
  // Data state
  const [allFees] = useState<Fee[]>(() => generateMockFees());
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedFee, setSelectedFee] = useState<Fee | null>(null);

  // Filters and search
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [advancedFilters, setAdvancedFilters] = useState({
    periodFrom: undefined as Date | undefined,
    periodTo: undefined as Date | undefined,
    categories: [] as string[],
    amountMin: undefined as number | undefined,
    amountMax: undefined as number | undefined,
    paidFrom: undefined as Date | undefined,
    paidTo: undefined as Date | undefined,
    onlyWithMandate: false,
    onlyOverdue: false,
  });

  // Table state
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [sortBy, setSortBy] = useState("periodStart");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Dialog state
  const [showDetailSlideout, setShowDetailSlideout] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showSepaDialog, setShowSepaDialog] = useState(false);

  // Apply filters and sorting
  const filteredFees = useMemo(() => {
    const filters = {
      search: searchTerm,
      status: statusFilter,
      year: yearFilter,
      method: methodFilter,
      ...advancedFilters,
    };
    
    const filtered = filterFees(allFees, filters);
    return sortFees(filtered, sortBy, sortOrder);
  }, [allFees, searchTerm, statusFilter, yearFilter, methodFilter, advancedFilters, sortBy, sortOrder]);

  // Paginate results
  const paginatedResult = useMemo(() => {
    return paginateFees(filteredFees, page, perPage);
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
        // TODO: Implement method change dialog
        console.log("Change method for", fee.id);
        break;
    }
  };

  const handleMarkPaid = (fees: Fee[]) => {
    // In a real app, this would call an API
    console.log("Marking paid:", fees.map(f => f.id));
    // For now, just remove from selection
    setSelectedIds(prev => prev.filter(id => !fees.find(f => f.id === id)));
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

  const resetAdvancedFilters = () => {
    setAdvancedFilters({
      periodFrom: undefined,
      periodTo: undefined,
      categories: [],
      amountMin: undefined,
      amountMax: undefined,
      paidFrom: undefined,
      paidTo: undefined,
      onlyWithMandate: false,
      onlyOverdue: false,
    });
  };

  return (
    <div className="container mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lidgelden</h1>
          <p className="text-gray-600 mt-1">
            Beheer lidgelden, automatiseer incasso's en volg betalingen op
          </p>
        </div>
        <div className="flex gap-3">
          <FiltersDrawer
            filters={advancedFilters}
            onFiltersChange={setAdvancedFilters as any}
            onReset={resetAdvancedFilters}
          />
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nieuw lidgeld
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <KpiCards fees={allFees} />

      {/* Toolbar */}
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
      />

      {/* Table */}
      <FeesTable
        fees={paginatedResult.data}
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
    </div>
  );
}
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { KpiCards } from "@/components/fees/kpi-cards";
import { Toolbar } from "@/components/fees/toolbar";
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

  // Apply filters and sorting
  const filteredFees = useMemo(() => {
    const filters = {
      search: searchTerm,
      status: statusFilter,
      year: yearFilter,
      method: methodFilter,
      categories: categoryFilter === "all" ? [] : [categoryFilter],
      amountMin,
      amountMax,
      paidFrom,
      paidTo,
      onlyWithMandate,
      onlyOverdue,
    };
    
    const filtered = filterFees(allFees, filters);
    return sortFees(filtered, sortBy, sortOrder);
  }, [allFees, searchTerm, statusFilter, yearFilter, methodFilter, categoryFilter, amountMin, amountMax, paidFrom, paidTo, onlyWithMandate, onlyOverdue, sortBy, sortOrder]);

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
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Nieuw lidgeld
              </Button>
            }
          />
        </div>

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
    </main>
  );
}
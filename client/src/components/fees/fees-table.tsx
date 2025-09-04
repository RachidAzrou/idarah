import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, CreditCard, Check, Clock, AlertTriangle } from "lucide-react";
import { Fee } from "@shared/fees-schema";
import { formatCurrencyBE, formatPeriodBE, formatDateBE } from "@/lib/format";
import { RowActions } from "./row-actions";

interface FeesTableProps {
  fees: any[];
  total: number;
  page: number;
  perPage: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onRowAction: (action: string, fee: any) => void;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSort?: (field: string) => void;
  loading?: boolean;
}

export function FeesTable({
  fees,
  total,
  page,
  perPage,
  onPageChange,
  onPerPageChange,
  selectedIds,
  onSelectionChange,
  onRowAction,
  sortBy,
  sortOrder,
  onSort,
  loading = false,
}: FeesTableProps) {
  const totalPages = Math.ceil(total / perPage);
  const startIndex = (page - 1) * perPage + 1;
  const endIndex = Math.min(page * perPage, total);

  const isAllSelected = fees?.length > 0 && fees.every(fee => selectedIds.includes(fee.id));
  const isPartiallySelected = fees?.some(fee => selectedIds.includes(fee.id)) && !isAllSelected;

  const handleSelectAll = () => {
    if (isAllSelected) {
      onSelectionChange(selectedIds.filter(id => !fees?.find(fee => fee.id === id)));
    } else {
      onSelectionChange([...selectedIds, ...(fees?.map(fee => fee.id).filter(id => !selectedIds.includes(id)) || [])]);
    }
  };

  const handleSelectRow = (feeId: string) => {
    if (selectedIds.includes(feeId)) {
      onSelectionChange(selectedIds.filter(id => id !== feeId));
    } else {
      onSelectionChange([...selectedIds, feeId]);
    }
  };

  const SortableHeader = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <TableHead 
      className="cursor-pointer hover:bg-gray-50 select-none"
      onClick={() => onSort?.(field)}
    >
      <div className="flex items-center gap-2">
        {children}
        {sortBy === field && (
          <ArrowUpDown className={`h-4 w-4 ${sortOrder === "desc" ? "rotate-180" : ""}`} />
        )}
      </div>
    </TableHead>
  );

  if (loading) {
    return (
      <div className="glass-card border-0">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">Laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="glass-card card-hover animate-fade-in group border-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={isAllSelected}
                  ref={(el) => {
                    if (el) (el as any).indeterminate = isPartiallySelected;
                  }}
                  onCheckedChange={handleSelectAll}
                  aria-label="Selecteer alle rijen"
                />
              </TableHead>
              <SortableHeader field="memberNumber">Lidnummer</SortableHeader>
              <SortableHeader field="memberName">Naam</SortableHeader>
              <SortableHeader field="periodStart">Periode</SortableHeader>
              <SortableHeader field="amount">Bedrag</SortableHeader>
              <SortableHeader field="method">Methode</SortableHeader>
              <SortableHeader field="status">Status</SortableHeader>
              <SortableHeader field="paidAt">Betaald op</SortableHeader>
              <TableHead className="text-right">Acties</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!fees?.length ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12">
                  <div className="flex flex-col items-center justify-center px-4 text-center">
                    <div className="flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                      <CreditCard className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Geen lidgelden gevonden
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                      Pas je filters aan om resultaten te zien
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              fees?.map((fee) => (
                <TableRow 
                  key={fee.id}
                  className={selectedIds.includes(fee.id) ? "bg-blue-50" : ""}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(fee.id)}
                      onCheckedChange={() => handleSelectRow(fee.id)}
                      aria-label={`Selecteer rij ${fee.memberNumber}`}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {fee.memberNumber}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{fee.memberLastName}, {fee.memberFirstName}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatPeriodBE(fee.periodStart, fee.periodEnd)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrencyBE(fee.amount)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {fee.method === 'SEPA' ? 'SEPA' : 
                     fee.method === 'BANK_TRANSFER' ? 'Overschrijving' :
                     fee.method === 'BANCONTACT' ? 'Bancontact' : 'Contant'}
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="flex items-center gap-2">
                      {fee.status === 'PAID' && (
                        <>
                          <Check className="h-4 w-4 text-green-600" />
                          <span className="text-green-600 font-medium">Betaald</span>
                        </>
                      )}
                      {fee.status === 'OPEN' && (
                        <>
                          <Clock className="h-4 w-4 text-orange-500" />
                          <span className="text-orange-500 font-medium">Openstaand</span>
                        </>
                      )}
                      {fee.status === 'OVERDUE' && (
                        <>
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          <span className="text-red-600 font-medium">Vervallen</span>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {fee.paidAt ? formatDateBE(fee.paidAt) : "-"}
                  </TableCell>
                  <TableCell>
                    <RowActions 
                      fee={fee}
                      onAction={(action) => onRowAction(action, fee)}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <span>Rijen per pagina:</span>
            <select
              value={perPage}
              onChange={(e) => onPerPageChange(Number(e.target.value))}
              className="border rounded px-2 py-1"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="ml-4">
              {startIndex}-{endIndex} van {total}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(1)}
              disabled={page === 1}
              aria-label="Eerste pagina"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              aria-label="Vorige pagina"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-3 py-1 text-sm">
              Pagina {page} van {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
              aria-label="Volgende pagina"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(totalPages)}
              disabled={page === totalPages}
              aria-label="Laatste pagina"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
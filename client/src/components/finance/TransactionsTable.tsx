"use client";

import React, { useState, useMemo, useCallback } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/ui/StatusChip";
import { MethodChip } from "@/components/ui/MethodChip";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDateBE, formatCurrencyBE } from "@/lib/format";
import { Transaction } from "@/lib/mock/transactions";
import { FilterData } from "@/lib/zod/transaction";
import { ChevronUp, ChevronDown, MoreHorizontal } from "lucide-react";
import { RowActions } from "./RowActions";

interface TransactionsTableProps {
  transactions: Transaction[];
  filters: FilterData;
  onTransactionSelect: (transaction: Transaction) => void;
  onTransactionEdit: (transaction: Transaction) => void;
  onTransactionDelete: (transactionId: string) => void;
  loading?: boolean;
}

type SortField = 'date' | 'amount' | 'category' | 'type';
type SortDirection = 'asc' | 'desc';

const TransactionsTable = React.memo(function TransactionsTable({
  transactions,
  filters,
  onTransactionSelect,
  onTransactionEdit,
  onTransactionDelete,
  loading = false
}: TransactionsTableProps) {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Filter and sort transactions (optimized)
  const filteredAndSortedTransactions = useMemo(() => {
    // Early return if no transactions
    if (!transactions || transactions.length === 0) return [];
    
    let filtered = transactions;

    // Apply filters with optimized string operations
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(t => {
        const category = t.category?.toLowerCase() || '';
        const description = t.description?.toLowerCase() || '';
        const memberName = t.memberName?.toLowerCase() || '';
        return category.includes(search) || description.includes(search) || memberName.includes(search);
      });
    }

    if (filters.type && filters.type !== 'ALL') {
      filtered = filtered.filter(t => t.type === filters.type);
    }

    if (filters.category) {
      filtered = filtered.filter(t => t.category === filters.category);
    }

    if (filters.method && filters.method !== 'ALL') {
      filtered = filtered.filter(t => t.method === filters.method);
    }

    if (filters.memberId) {
      filtered = filtered.filter(t => t.memberId === filters.memberId);
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(t => t.date >= filters.dateFrom!);
    }

    if (filters.dateTo) {
      filtered = filtered.filter(t => t.date <= filters.dateTo!);
    }

    if (filters.amountMin) {
      filtered = filtered.filter(t => t.amount >= filters.amountMin!);
    }

    if (filters.amountMax) {
      filtered = filtered.filter(t => t.amount <= filters.amountMax!);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'date':
          aValue = new Date(a.date);
          bValue = new Date(b.date);
          break;
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'category':
          aValue = a.category;
          bValue = b.category;
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [transactions, filters, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredAndSortedTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 
      <ChevronUp className="w-4 h-4" /> : 
      <ChevronDown className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded mb-2"></div>
        ))}
      </div>
    );
  }

  if (filteredAndSortedTransactions.length === 0) {
    return (
      <EmptyState
        title="Geen transacties gevonden"
        description="Er zijn geen transacties die voldoen aan de geselecteerde filters."
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="glass-card card-hover animate-fade-in group rounded-lg border-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50 select-none"
                onClick={() => handleSort('date')}
              >
                <div className="flex items-center gap-2">
                  Datum
                  <SortIcon field="date" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50 select-none"
                onClick={() => handleSort('type')}
              >
                <div className="flex items-center gap-2">
                  Type
                  <SortIcon field="type" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50 select-none"
                onClick={() => handleSort('category')}
              >
                <div className="flex items-center gap-2">
                  Categorie
                  <SortIcon field="category" />
                </div>
              </TableHead>
              <TableHead>Lid</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50 select-none text-right"
                onClick={() => handleSort('amount')}
              >
                <div className="flex items-center justify-end gap-2">
                  Bedrag
                  <SortIcon field="amount" />
                </div>
              </TableHead>
              <TableHead>Methode</TableHead>
              <TableHead>Omschrijving</TableHead>
              <TableHead className="text-right">Acties</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTransactions.map((transaction) => (
              <TableRow 
                key={transaction.id}
                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900"
                onClick={() => onTransactionSelect(transaction)}
                data-testid={`row-transaction-${transaction.id}`}
              >
                <TableCell className="font-medium">
                  {formatDateBE(transaction.date)}
                </TableCell>
                <TableCell>
                  {transaction.type === 'INCOME' ? 'Inkomsten' : 'Uitgaven'}
                </TableCell>
                <TableCell>{transaction.category}</TableCell>
                <TableCell className={transaction.memberName ? "text-gray-900 dark:text-gray-100" : "text-gray-400"}>
                  {transaction.memberName || '-'}
                </TableCell>
                <TableCell className={`text-right font-medium ${transaction.type === 'INCOME' 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
                }`}>
                  {transaction.type === 'INCOME' ? '+' : '-'}{formatCurrencyBE(transaction.amount)}
                </TableCell>
                <TableCell>
                  {transaction.method === 'SEPA' ? 'SEPA' : 
                   transaction.method === 'OVERSCHRIJVING' ? 'Overschrijving' : 
                   transaction.method === 'BANCONTACT' ? 'Bancontact' : 'Contant'}
                </TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {transaction.description || '-'}
                </TableCell>
                <TableCell>
                  <RowActions
                    transaction={transaction}
                    onEdit={onTransactionEdit}
                    onDelete={onTransactionDelete}
                    onView={onTransactionSelect}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Toont {(currentPage - 1) * itemsPerPage + 1} tot {Math.min(currentPage * itemsPerPage, filteredAndSortedTransactions.length)} van {filteredAndSortedTransactions.length} transacties
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              data-testid="button-prev-page"
            >
              Vorige
            </Button>
            <div className="flex items-center px-3 text-sm">
              Pagina {currentPage} van {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              data-testid="button-next-page"
            >
              Volgende
            </Button>
          </div>
        </div>
      )}
    </div>
  );
});

export { TransactionsTable };
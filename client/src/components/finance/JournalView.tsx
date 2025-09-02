"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDateBE, formatCurrencyBE } from "@/lib/format";
import { Transaction } from "@/lib/mock/transactions";
import { MethodChip } from "@/components/ui/MethodChip";
import { MdOutbox } from "react-icons/md";
import { HiInboxIn, HiInbox } from "react-icons/hi";
import { CreditCard } from "lucide-react";

interface JournalViewProps {
  transactions: Transaction[];
}

export function JournalView({ transactions }: JournalViewProps) {
  const { debitTransactions, creditTransactions, totals } = useMemo(() => {
    const debit = transactions.filter(t => t.type === 'EXPENSE').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const credit = transactions.filter(t => t.type === 'INCOME').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const debitTotal = debit.reduce((sum, t) => sum + t.amount, 0);
    const creditTotal = credit.reduce((sum, t) => sum + t.amount, 0);
    
    return {
      debitTransactions: debit,
      creditTransactions: credit,
      totals: {
        debit: debitTotal,
        credit: creditTotal,
        balance: creditTotal - debitTotal
      }
    };
  }, [transactions]);

  const TransactionRow = ({ transaction }: { transaction: Transaction }) => (
    <TableRow>
      <TableCell className="text-sm">{formatDateBE(transaction.date)}</TableCell>
      <TableCell className="text-sm">{transaction.category}</TableCell>
      <TableCell className="text-sm">
        {transaction.memberName ? (
          <span className="text-gray-900 dark:text-gray-100">
            {transaction.memberName}
          </span>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </TableCell>
      <TableCell className="text-sm">
        {transaction.method === 'SEPA' ? 'SEPA' : 
         transaction.method === 'OVERSCHRIJVING' ? 'Overschrijving' : 
         transaction.method === 'BANCONTACT' ? 'Bancontact' : 'Contant'}
      </TableCell>
      <TableCell className="text-sm max-w-[150px] truncate">
        {transaction.description || '-'}
      </TableCell>
      <TableCell className="text-right font-medium">
        {formatCurrencyBE(transaction.amount)}
      </TableCell>
    </TableRow>
  );

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Debet</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">{formatCurrencyBE(totals.debit)}</p>
              <div className="flex items-center space-x-1">
                <span className="text-xs font-medium text-red-600 dark:text-red-400">
                  {debitTransactions.length} transacties
                </span>
              </div>
            </div>
            <div className="w-8 h-8 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <MdOutbox className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Credit</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">{formatCurrencyBE(totals.credit)}</p>
              <div className="flex items-center space-x-1">
                <span className="text-xs font-medium text-green-600 dark:text-green-400">
                  {creditTransactions.length} transacties
                </span>
              </div>
            </div>
            <div className="w-8 h-8 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <HiInboxIn className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Saldo</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">{formatCurrencyBE(Math.abs(totals.balance))}</p>
              <div className="flex items-center space-x-1">
                <span className={`text-xs font-medium ${
                  totals.balance >= 0 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {totals.balance >= 0 ? 'Overschot' : 'Tekort'}
                </span>
              </div>
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              totals.balance > 0 
                ? 'bg-green-50 dark:bg-green-900/20' 
                : totals.balance < 0
                ? 'bg-red-50 dark:bg-red-900/20'
                : 'bg-gray-50 dark:bg-gray-900/20'
            }`}>
              <HiInbox className={`h-4 w-4 ${
                totals.balance > 0 
                  ? 'text-green-600 dark:text-green-400' 
                  : totals.balance < 0
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-gray-600 dark:text-gray-400'
              }`} />
            </div>
          </div>
        </div>
      </div>

      {/* Journal Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Debet (Uitgaven) */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MdOutbox className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Debet</h3>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">{debitTransactions.length} transacties</span>
            </div>
          </div>
          <div className="p-6">
            <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-900">
                    <TableHead className="text-xs font-medium">Datum</TableHead>
                    <TableHead className="text-xs font-medium">Categorie</TableHead>
                    <TableHead className="text-xs font-medium">Lid</TableHead>
                    <TableHead className="text-xs font-medium">Methode</TableHead>
                    <TableHead className="text-xs font-medium">Omschrijving</TableHead>
                    <TableHead className="text-xs font-medium text-right">Bedrag</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="max-h-80 overflow-y-auto">
                  {debitTransactions.length > 0 ? (
                    debitTransactions.map((transaction) => (
                      <TransactionRow key={transaction.id} transaction={transaction} />
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12">
                        <div className="flex flex-col items-center justify-center px-4 text-center">
                          <div className="flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                            <CreditCard className="w-8 h-8 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                            Geen uitgaven gevonden
                          </h3>
                          <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                            Uitgaven worden hier weergegeven wanneer ze worden toegevoegd.
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        {/* Credit (Inkomsten) */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HiInboxIn className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Credit</h3>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">{creditTransactions.length} transacties</span>
            </div>
          </div>
          <div className="p-6">
            <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-900">
                    <TableHead className="text-xs font-medium">Datum</TableHead>
                    <TableHead className="text-xs font-medium">Categorie</TableHead>
                    <TableHead className="text-xs font-medium">Lid</TableHead>
                    <TableHead className="text-xs font-medium">Methode</TableHead>
                    <TableHead className="text-xs font-medium">Omschrijving</TableHead>
                    <TableHead className="text-xs font-medium text-right">Bedrag</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="max-h-80 overflow-y-auto">
                  {creditTransactions.length > 0 ? (
                    creditTransactions.map((transaction) => (
                      <TransactionRow key={transaction.id} transaction={transaction} />
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12">
                        <div className="flex flex-col items-center justify-center px-4 text-center">
                          <div className="flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                            <CreditCard className="w-8 h-8 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                            Geen inkomsten gevonden
                          </h3>
                          <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                            Inkomsten worden hier weergegeven wanneer ze worden toegevoegd.
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>

      {/* Balance Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Journaal Saldo</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Overzicht van de balans tussen debet en credit</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatCurrencyBE(totals.debit)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Totaal Debet</div>
            </div>
            
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatCurrencyBE(totals.credit)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Totaal Credit</div>
            </div>
            
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className={`text-2xl font-bold ${
                totals.balance >= 0 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {formatCurrencyBE(Math.abs(totals.balance))}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Saldo ({totals.balance >= 0 ? 'Overschot' : 'Tekort'})
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
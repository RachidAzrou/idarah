"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDateBE, formatCurrencyBE } from "@/lib/format";
import { Transaction } from "@/lib/mock/transactions";
import { MethodChip } from "@/components/ui/MethodChip";

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
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Debet (Uitgaven)</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">{formatCurrencyBE(totals.debit)}</p>
              <div className="flex items-center space-x-1">
                <span className="text-xs font-medium text-red-600 dark:text-red-400">
                  {debitTransactions.length} transacties
                </span>
              </div>
            </div>
            <div className="w-8 h-8 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <div className="h-4 w-4 text-red-600 dark:text-red-400 font-bold">-</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Credit (Inkomsten)</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">{formatCurrencyBE(totals.credit)}</p>
              <div className="flex items-center space-x-1">
                <span className="text-xs font-medium text-green-600 dark:text-green-400">
                  {creditTransactions.length} transacties
                </span>
              </div>
            </div>
            <div className="w-8 h-8 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <div className="h-4 w-4 text-green-600 dark:text-green-400 font-bold">+</div>
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
              totals.balance >= 0 
                ? 'bg-green-50 dark:bg-green-900/20' 
                : 'bg-red-50 dark:bg-red-900/20'
            }`}>
              <div className={`h-4 w-4 font-bold ${
                totals.balance >= 0 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {totals.balance >= 0 ? '=' : '!'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Journal Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Debet (Uitgaven) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
              Debet (Uitgaven)
              <Badge variant="outline" className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-800">
                {debitTransactions.length}
              </Badge>
            </CardTitle>
            <CardDescription>
              Alle uitgaande transacties
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-red-50 dark:bg-red-900/10">
                    <TableHead className="text-xs">Datum</TableHead>
                    <TableHead className="text-xs">Categorie</TableHead>
                    <TableHead className="text-xs">Lid</TableHead>
                    <TableHead className="text-xs">Methode</TableHead>
                    <TableHead className="text-xs">Omschrijving</TableHead>
                    <TableHead className="text-xs text-right">Bedrag</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="max-h-80 overflow-y-auto">
                  {debitTransactions.length > 0 ? (
                    debitTransactions.map((transaction) => (
                      <TransactionRow key={transaction.id} transaction={transaction} />
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500 dark:text-gray-400 py-8">
                        Geen uitgaven gevonden
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            
            {debitTransactions.length > 0 && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Totaal Debet:</span>
                  <span className="text-lg font-bold text-red-600 dark:text-red-400">
                    {formatCurrencyBE(totals.debit)}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Credit (Inkomsten) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600 dark:text-green-400 flex items-center gap-2">
              Credit (Inkomsten)
              <Badge variant="outline" className="text-green-600 dark:text-green-400 border-green-200 dark:border-green-800">
                {creditTransactions.length}
              </Badge>
            </CardTitle>
            <CardDescription>
              Alle inkomende transacties
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-green-50 dark:bg-green-900/10">
                    <TableHead className="text-xs">Datum</TableHead>
                    <TableHead className="text-xs">Categorie</TableHead>
                    <TableHead className="text-xs">Lid</TableHead>
                    <TableHead className="text-xs">Methode</TableHead>
                    <TableHead className="text-xs">Omschrijving</TableHead>
                    <TableHead className="text-xs text-right">Bedrag</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="max-h-80 overflow-y-auto">
                  {creditTransactions.length > 0 ? (
                    creditTransactions.map((transaction) => (
                      <TransactionRow key={transaction.id} transaction={transaction} />
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500 dark:text-gray-400 py-8">
                        Geen inkomsten gevonden
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            
            {creditTransactions.length > 0 && (
              <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/10 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Totaal Credit:</span>
                  <span className="text-lg font-bold text-green-600 dark:text-green-400">
                    {formatCurrencyBE(totals.credit)}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Balance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Journaal Saldo</CardTitle>
          <CardDescription>
            Overzicht van de balans tussen debet en credit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-lg">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {formatCurrencyBE(totals.debit)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Totaal Debet</div>
            </div>
            
            <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrencyBE(totals.credit)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Totaal Credit</div>
            </div>
            
            <div className={`p-4 rounded-lg ${
              totals.balance >= 0 
                ? 'bg-green-50 dark:bg-green-900/10' 
                : 'bg-red-50 dark:bg-red-900/10'
            }`}>
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
        </CardContent>
      </Card>
    </div>
  );
}
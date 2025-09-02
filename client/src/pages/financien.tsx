import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, TrendingUp, Download, Search, Plus, Euro, ArrowUpRight, ArrowDownRight, CreditCard } from "lucide-react";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { useState } from "react";

export default function Financien() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ["/api/transactions"],
  });

  const { data: fees } = useQuery({
    queryKey: ["/api/fees"],
  });

  const { data: reports } = useQuery({
    queryKey: ["/api/financial/reports"],
  });

  const calculateFinancialStats = () => {
    const income = Array.isArray(transactions) ? transactions.filter((t: any) => t.type === 'INCOME').reduce((sum: number, t: any) => sum + Math.abs(parseFloat(t.amount)), 0) : 0;
    const expenses = Array.isArray(transactions) ? transactions.filter((t: any) => t.type === 'EXPENSE').reduce((sum: number, t: any) => sum + Math.abs(parseFloat(t.amount)), 0) : 0;
    const balance = income - expenses;
    const openFees = Array.isArray(fees) ? fees.filter((f: any) => f.status === 'OPEN').reduce((sum: number, f: any) => sum + parseFloat(f.amount), 0) : 0;

    return { income, expenses, balance, openFees };
  };

  const stats = calculateFinancialStats();

  const filteredTransactions = transactions?.filter((transaction: any) =>
    transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.category.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (transactionsLoading) {
    return (
          <main className="flex-1 py-8">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
            </div>
          </main>
    );
  }

  return (
        <main className="flex-1 py-8">
          <div className="px-4 sm:px-6 lg:px-8">
            {/* Page Header */}
            <div className="mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900" data-testid="page-title">Financiën</h1>
                <p className="mt-1 text-sm text-gray-700">Financieel overzicht en transactiebeheer</p>
              </div>
            </div>

            {/* Financial Stats Cards */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              <Card>
                <CardContent className="px-6 py-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center">
                        <ArrowUpRight className="h-5 w-5 text-green-600" />
                      </div>
                    </div>
                    <div className="ml-4 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Totale Inkomsten</dt>
                        <dd className="text-2xl font-bold text-gray-900" data-testid="total-income">
                          {formatCurrency(stats.income)}
                        </dd>
                      </dl>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center text-sm text-green-600">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      +8% deze maand
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="px-6 py-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center">
                        <ArrowDownRight className="h-5 w-5 text-red-600" />
                      </div>
                    </div>
                    <div className="ml-4 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Totale Uitgaven</dt>
                        <dd className="text-2xl font-bold text-gray-900" data-testid="total-expenses">
                          {formatCurrency(stats.expenses)}
                        </dd>
                      </dl>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-sm text-gray-500">
                      Operationele kosten
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="px-6 py-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Euro className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                    <div className="ml-4 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Netto Saldo</dt>
                        <dd className={`text-2xl font-bold ${stats.balance >= 0 ? 'text-green-600' : 'text-red-600'}`} data-testid="net-balance">
                          {formatCurrency(stats.balance)}
                        </dd>
                      </dl>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-sm text-gray-500">
                      Inkomsten - Uitgaven
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="px-6 py-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center">
                        <BarChart3 className="h-5 w-5 text-orange-600" />
                      </div>
                    </div>
                    <div className="ml-4 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Openstaande Lidgelden</dt>
                        <dd className="text-2xl font-bold text-gray-900" data-testid="outstanding-fees">
                          {formatCurrency(stats.openFees)}
                        </dd>
                      </dl>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-sm text-orange-600">
                      Te innen bedrag
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="transactions" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="transactions" data-testid="tab-transactions">Transacties</TabsTrigger>
                <TabsTrigger value="reports" data-testid="tab-reports">Rapportages</TabsTrigger>
                <TabsTrigger value="sepa" data-testid="tab-sepa">SEPA Export</TabsTrigger>
              </TabsList>

              <TabsContent value="transactions" className="space-y-6">
                {/* Search and Filters */}
                <Card>
                  <CardContent className="px-6 py-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Zoek op beschrijving of categorie..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                          data-testid="search-transactions"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" data-testid="filter-transactions">
                          Filter
                        </Button>
                        <Button variant="outline" size="sm" data-testid="export-transactions">
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Transactions Table */}
                <Card>
                  <CardHeader className="px-6 py-6 border-b border-gray-200">
                    <CardTitle>Transactie Overzicht</CardTitle>
                    <p className="text-sm text-gray-500">{filteredTransactions.length} transacties gevonden</p>
                  </CardHeader>
                  
                  <CardContent className="p-0">
                    {filteredTransactions.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 px-4 text-center" data-testid="no-transactions">
                        <div className="flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                          <CreditCard className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                          {searchTerm ? 'Geen transacties gevonden' : 'Nog geen transacties toegevoegd'}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                          {searchTerm ? 'Probeer je zoekcriteria aan te passen' : 'Transacties worden hier weergegeven wanneer ze worden toegevoegd.'}
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datum</th>
                              <th scope="col" className="sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                              <th scope="col" className="sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categorie</th>
                              <th scope="col" className="sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Beschrijving</th>
                              <th scope="col" className="sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bedrag</th>
                              <th scope="col" className="sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Methode</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {filteredTransactions.map((transaction: any) => (
                              <tr key={transaction.id} className="hover:bg-gray-50" data-testid={`transaction-row-${transaction.id}`}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" data-testid={`transaction-date-${transaction.id}`}>
                                  {formatDate(transaction.date)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <Badge 
                                    variant={transaction.type === 'INCOME' ? 'default' : 'destructive'}
                                    className={transaction.type === 'INCOME' ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-red-100 text-red-800 hover:bg-red-100'}
                                    data-testid={`transaction-type-${transaction.id}`}
                                  >
                                    <div className="flex items-center">
                                      {transaction.type === 'INCOME' ? (
                                        <ArrowUpRight className="h-3 w-3 mr-1" />
                                      ) : (
                                        <ArrowDownRight className="h-3 w-3 mr-1" />
                                      )}
                                      {transaction.type === 'INCOME' ? 'Inkomst' : 'Uitgave'}
                                    </div>
                                  </Badge>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" data-testid={`transaction-category-${transaction.id}`}>
                                  {transaction.category}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900" data-testid={`transaction-description-${transaction.id}`}>
                                  {transaction.description || 'Geen beschrijving'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900" data-testid={`transaction-amount-${transaction.id}`}>
                                  <span className={transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}>
                                    {transaction.type === 'INCOME' ? '+' : '-'}{formatCurrency(transaction.amount)}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" data-testid={`transaction-method-${transaction.id}`}>
                                  {transaction.method || 'Niet opgegeven'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reports" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Revenue Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Maandelijkse Inkomsten</CardTitle>
                      <p className="text-sm text-gray-500">Ontwikkeling over de laatste 12 maanden</p>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64 bg-gray-50 rounded-xl flex items-center justify-center text-gray-500 text-sm" data-testid="revenue-chart">
                        Grafiek: Maandelijkse inkomsten ontwikkeling
                      </div>
                    </CardContent>
                  </Card>

                  {/* Category Breakdown */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Uitgaven per Categorie</CardTitle>
                      <p className="text-sm text-gray-500">Verdeling van uitgaven</p>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64 bg-gray-50 rounded-xl flex items-center justify-center text-gray-500 text-sm" data-testid="category-chart">
                        Grafiek: Uitgaven verdeling per categorie
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Financial Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Financiële Samenvatting</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600">{formatCurrency(stats.income)}</div>
                        <div className="text-sm text-gray-500">Totale Inkomsten</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-red-600">{formatCurrency(stats.expenses)}</div>
                        <div className="text-sm text-gray-500">Totale Uitgaven</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-3xl font-bold ${stats.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(stats.balance)}
                        </div>
                        <div className="text-sm text-gray-500">Netto Resultaat</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="sepa" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>SEPA Export Beheer</CardTitle>
                    <p className="text-sm text-gray-500">Genereer SEPA betalingsbestanden voor automatische incasso</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="bg-blue-50 rounded-xl p-6">
                        <h4 className="font-semibold text-blue-900 mb-2">SEPA Batch Genereren</h4>
                        <p className="text-sm text-blue-700 mb-4">
                          Selecteer openstaande lidgelden met SEPA betaalmethode om een betalingsbatch te genereren.
                        </p>
                        <Button data-testid="generate-sepa">
                          Nieuwe SEPA Batch Genereren
                        </Button>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 mb-4">Recente SEPA Exports</h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                            <div>
                              <div className="font-medium">SEPA-2025-001</div>
                              <div className="text-sm text-gray-500">15 transacties • €375.00</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className="bg-green-100 text-green-800">Gegenereerd</Badge>
                              <Button variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
  );
}

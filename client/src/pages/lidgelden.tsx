import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Topbar from "@/components/layout/topbar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FeeForm } from "@/components/forms/fee-form";
import { Plus, Search, MoreVertical, Filter, Download, CreditCard, Check, Clock, AlertTriangle } from "lucide-react";
import { formatCurrency, formatDate, getFeeStatusLabel, getPaymentMethodLabel } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Lidgelden() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showNewFeeDialog, setShowNewFeeDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: fees, isLoading } = useQuery({
    queryKey: ["/api/fees"],
  });

  const { data: members } = useQuery({
    queryKey: ["/api/members"],
  });

  const markPaidMutation = useMutation({
    mutationFn: async (feeId: string) => {
      const response = await apiRequest("PUT", `/api/fees/${feeId}/mark-paid`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Lidgeld gemarkeerd als betaald",
        description: "Het lidgeld is succesvol gemarkeerd als betaald.",
      });
    },
  });

  const getMemberName = (memberId: string) => {
    const member = members?.find((m: any) => m.id === memberId);
    return member ? `${member.firstName} ${member.lastName}` : 'Onbekend lid';
  };

  const getMemberNumber = (memberId: string) => {
    const member = members?.find((m: any) => m.id === memberId);
    return member?.memberNumber || '';
  };

  const filteredFees = fees?.filter((fee: any) => {
    const memberName = getMemberName(fee.memberId).toLowerCase();
    const memberNumber = getMemberNumber(fee.memberId).toLowerCase();
    const matchesSearch = memberName.includes(searchTerm.toLowerCase()) || 
                         memberNumber.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || fee.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PAID':
        return <Check className="h-4 w-4 text-green-600" />;
      case 'OVERDUE':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-orange-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'OVERDUE':
        return 'bg-red-100 text-red-800 hover:bg-red-100';
      default:
        return 'bg-orange-100 text-orange-800 hover:bg-orange-100';
    }
  };

  const handleMarkPaid = (feeId: string) => {
    markPaidMutation.mutate(feeId);
  };

  const calculateStats = () => {
    const totalFees = fees?.length || 0;
    const paidFees = fees?.filter((f: any) => f.status === 'PAID').length || 0;
    const openFees = fees?.filter((f: any) => f.status === 'OPEN').length || 0;
    const overdueFees = fees?.filter((f: any) => f.status === 'OVERDUE').length || 0;
    const totalAmount = fees?.reduce((sum: number, f: any) => sum + parseFloat(f.amount), 0) || 0;
    const paidAmount = fees?.filter((f: any) => f.status === 'PAID').reduce((sum: number, f: any) => sum + parseFloat(f.amount), 0) || 0;

    return { totalFees, paidFees, openFees, overdueFees, totalAmount, paidAmount };
  };

  const stats = calculateStats();

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="lg:pl-60 flex flex-col flex-1">
          <Topbar />
          <main className="flex-1 py-8">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="lg:pl-60 flex flex-col flex-1">
        <Topbar />
        
        <main className="flex-1 py-8">
          <div className="px-4 sm:px-6 lg:px-8">
            {/* Page Header */}
            <div className="sm:flex sm:items-center sm:justify-between mb-8">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900" data-testid="page-title">Lidgelden</h1>
                  <p className="mt-2 text-sm text-gray-700">Beheer en volg alle lidmaatschapsbijdragen</p>
                </div>
              </div>
              <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                <Dialog open={showNewFeeDialog} onOpenChange={setShowNewFeeDialog}>
                  <DialogTrigger asChild>
                    <Button className="inline-flex items-center gap-x-2 rounded-2xl px-6 py-3" data-testid="button-new-fee">
                      <Plus className="h-4 w-4" />
                      Nieuw Lidgeld
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <FeeForm
                      onSuccess={() => setShowNewFeeDialog(false)}
                      onCancel={() => setShowNewFeeDialog(false)}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              <Card>
                <CardContent className="px-6 py-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                    <div className="ml-4 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Totaal Lidgelden</dt>
                        <dd className="text-2xl font-bold text-gray-900" data-testid="total-fees">{stats.totalFees}</dd>
                      </dl>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-sm text-gray-500">
                      {formatCurrency(stats.totalAmount)} totaal
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="px-6 py-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center">
                        <Check className="h-5 w-5 text-green-600" />
                      </div>
                    </div>
                    <div className="ml-4 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Betaald</dt>
                        <dd className="text-2xl font-bold text-gray-900" data-testid="paid-fees">{stats.paidFees}</dd>
                      </dl>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-sm text-green-600">
                      {formatCurrency(stats.paidAmount)} ontvangen
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="px-6 py-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center">
                        <Clock className="h-5 w-5 text-orange-600" />
                      </div>
                    </div>
                    <div className="ml-4 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Openstaand</dt>
                        <dd className="text-2xl font-bold text-gray-900" data-testid="open-fees">{stats.openFees}</dd>
                      </dl>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-sm text-orange-600">
                      {formatCurrency(stats.totalAmount - stats.paidAmount)} openstaand
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="px-6 py-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      </div>
                    </div>
                    <div className="ml-4 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Achterstallig</dt>
                        <dd className="text-2xl font-bold text-gray-900" data-testid="overdue-fees">{stats.overdueFees}</dd>
                      </dl>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-sm text-red-600">
                      Aandacht vereist
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters and Search */}
            <Card className="mb-6">
              <CardContent className="px-6 py-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Zoek op lidnaam of lidnummer..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                      data-testid="search-fees"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-40" data-testid="filter-status">
                        <SelectValue placeholder="Status filter" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alle statussen</SelectItem>
                        <SelectItem value="OPEN">Openstaand</SelectItem>
                        <SelectItem value="PAID">Betaald</SelectItem>
                        <SelectItem value="OVERDUE">Achterstallig</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" data-testid="export-button">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Fees Table */}
            <Card>
              <CardHeader className="px-6 py-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Lidgelden Overzicht</h3>
                    <p className="text-sm text-gray-500">{filteredFees.length} lidgelden gevonden</p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                {filteredFees.length === 0 ? (
                  <div className="p-6 text-center text-gray-500" data-testid="no-fees">
                    {searchTerm || statusFilter !== "all" ? 'Geen lidgelden gevonden voor deze filters' : 'Nog geen lidgelden toegevoegd'}
                  </div>
                ) : (
                  <div className="overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lid</th>
                          <th scope="col" className="sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Periode</th>
                          <th scope="col" className="sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bedrag</th>
                          <th scope="col" className="sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th scope="col" className="sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Betaalmethode</th>
                          <th scope="col" className="sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aangemaakt</th>
                          <th scope="col" className="sticky top-0 relative px-6 py-3"><span className="sr-only">Acties</span></th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredFees.map((fee: any) => (
                          <tr key={fee.id} className="hover:bg-gray-50" data-testid={`fee-row-${fee.id}`}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900" data-testid={`fee-member-${fee.id}`}>
                                  {getMemberName(fee.memberId)}
                                </div>
                                <div className="text-sm text-gray-500" data-testid={`fee-member-number-${fee.id}`}>
                                  {getMemberNumber(fee.memberId)}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" data-testid={`fee-period-${fee.id}`}>
                              <div>
                                <div>{formatDate(fee.periodStart)}</div>
                                <div className="text-gray-500">tot {formatDate(fee.periodEnd)}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900" data-testid={`fee-amount-${fee.id}`}>
                              {formatCurrency(fee.amount)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge 
                                className={getStatusColor(fee.status)}
                                data-testid={`fee-status-${fee.id}`}
                              >
                                <div className="flex items-center">
                                  {getStatusIcon(fee.status)}
                                  <span className="ml-1">{getFeeStatusLabel(fee.status)}</span>
                                </div>
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" data-testid={`fee-method-${fee.id}`}>
                              {fee.method ? getPaymentMethodLabel(fee.method) : 'Niet opgegeven'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" data-testid={`fee-created-${fee.id}`}>
                              {formatDate(fee.createdAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-500" data-testid={`fee-actions-${fee.id}`}>
                                    <MoreVertical className="h-5 w-5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {fee.status === 'OPEN' && (
                                    <DropdownMenuItem 
                                      onClick={() => handleMarkPaid(fee.id)}
                                      className="text-green-600"
                                    >
                                      Markeren als betaald
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem>
                                    Bewerken
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    Details bekijken
                                  </DropdownMenuItem>
                                  {fee.status === 'OPEN' && (
                                    <DropdownMenuItem>
                                      Herinnering sturen
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}

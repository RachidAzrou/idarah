import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { LiveCard } from "@/components/cards/live-card";
import { CardCanvas } from "@/components/card/CardCanvas";
import { apiRequest } from "@/lib/queryClient";
import { 
  Search, 
  Filter, 
  Eye, 
  RefreshCw, 
  Trash2,
  CreditCard,
  Users,
  CheckCircle2,
  Clock,
  MoreHorizontal,
  Plus,
  ExternalLink,
  AlertTriangle,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import { CiExport, CiCreditCardOff } from "react-icons/ci";
import { MdOutlineBrowserUpdated } from "react-icons/md";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import type { Member, CardMeta, Tenant } from "@shared/schema";

interface CardWithMember {
  member: Member;
  cardMeta: CardMeta | null;
}

interface CardStats {
  totalActive: number;
  validPercentage: number;
  lastUpdated: Date | null;
}

interface SortConfig {
  key: string | null;
  direction: 'asc' | 'desc';
}

function getMemberCategoryLabel(category: string): string {
  switch (category) {
    case 'STUDENT':
      return 'Student';
    case 'STANDAARD':
      return 'Volwassen';
    case 'SENIOR':
      return 'Senior';
    default:
      return category;
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'ACTUEEL':
      return 'Actueel';
    case 'MOMENTOPNAME':
      return 'Momentopname';
    case 'VERLOPEN':
      return 'Verlopen';
    default:
      return status;
  }
}

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case 'ACTUEEL':
      return 'default';
    case 'MOMENTOPNAME':
      return 'secondary';
    case 'VERLOPEN':
      return 'destructive';
    default:
      return 'outline';
  }
}

export default function LidkaartenPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [previewCard, setPreviewCard] = useState<CardWithMember | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch cards data
  const { data: cards = [], isLoading: cardsLoading } = useQuery<CardWithMember[]>({
    queryKey: ['/api/cards'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/cards');
      return response.json();
    },
  });

  // Fetch card statistics
  const { data: stats } = useQuery<CardStats>({
    queryKey: ['/api/cards/stats'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/cards/stats');
      return response.json();
    },
  });

  // Fetch tenant data for card preview
  const { data: tenant } = useQuery<Tenant>({
    queryKey: ['/api/tenant/current'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/tenant/current');
      return response.json();
    },
  });

  // Create card mutation
  const createCardMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const response = await apiRequest('POST', `/api/cards/${memberId}/create`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cards'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cards/stats'] });
      toast({ title: "Lidkaart aangemaakt", description: "De kaart is succesvol aangemaakt." });
    },
    onError: () => {
      toast({ 
        title: "Fout", 
        description: "Kon de kaart niet aanmaken. Probeer opnieuw.", 
        variant: "destructive" 
      });
    },
  });

  // Regenerate card mutation
  const regenerateCardMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const response = await apiRequest('POST', `/api/cards/${memberId}/regenerate`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cards'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cards/stats'] });
      toast({ title: "Lidkaart geregenereerd", description: "De kaart is succesvol bijgewerkt met nieuwe tokens." });
    },
    onError: () => {
      toast({ 
        title: "Fout", 
        description: "Kon de kaart niet regenereren. Probeer opnieuw.", 
        variant: "destructive" 
      });
    },
  });

  // Deactivate card mutation
  const deactivateCardMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const response = await apiRequest('POST', `/api/cards/${memberId}/deactivate`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cards'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cards/stats'] });
      toast({ title: "Lidkaart gedeactiveerd", description: "De kaart is verlopen en niet meer geldig." });
    },
    onError: () => {
      toast({ 
        title: "Fout", 
        description: "Kon de kaart niet deactiveren. Probeer opnieuw.", 
        variant: "destructive" 
      });
    },
  });

  // Sort and selection functions
  const handleSort = (key: string) => {
    const direction = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key, direction });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredCards.map(({ member }) => member.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (memberId: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, memberId]);
    } else {
      setSelectedIds(selectedIds.filter(id => id !== memberId));
    }
  };

  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) {
      return <ChevronUp className="h-3 w-3 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="h-3 w-3 text-gray-700" />
      : <ChevronDown className="h-3 w-3 text-gray-700" />;
  };

  // Filter and sort cards based on search, filters, and sort config
  const filteredCards = useMemo(() => {
    let filtered = cards.filter(({ member, cardMeta }) => {
      // Search filter
      const searchMatch = searchTerm === '' || 
        member.memberNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter
      const statusMatch = statusFilter === 'all' || 
        (cardMeta?.status === statusFilter) ||
        (statusFilter === 'geen-kaart' && !cardMeta);

      // Category filter  
      const categoryMatch = categoryFilter === 'all' || member.category === categoryFilter;

      return searchMatch && statusMatch && categoryMatch;
    });

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortConfig.key) {
          case 'memberNumber':
            aValue = a.member.memberNumber;
            bValue = b.member.memberNumber;
            break;
          case 'name':
            aValue = `${a.member.lastName} ${a.member.firstName}`;
            bValue = `${b.member.lastName} ${b.member.firstName}`;
            break;
          case 'category':
            aValue = a.member.category;
            bValue = b.member.category;
            break;
          case 'status':
            aValue = a.cardMeta?.status || 'GEEN_KAART';
            bValue = b.cardMeta?.status || 'GEEN_KAART';
            break;
          case 'validUntil':
            aValue = a.cardMeta?.validUntil || '';
            bValue = b.cardMeta?.validUntil || '';
            break;
          case 'lastRenderedAt':
            aValue = a.cardMeta?.lastRenderedAt || '';
            bValue = b.cardMeta?.lastRenderedAt || '';
            break;
          default:
            return 0;
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [cards, searchTerm, statusFilter, categoryFilter, sortConfig]);

  const handlePreview = (cardData: CardWithMember) => {
    setPreviewCard(cardData);
  };

  const handleCreateCard = (memberId: string) => {
    createCardMutation.mutate(memberId);
  };

  const handleRegenerateCard = (memberId: string) => {
    regenerateCardMutation.mutate(memberId);
  };

  const handleDeactivateCard = (memberId: string) => {
    deactivateCardMutation.mutate(memberId);
  };


  const handleViewCard = (member: Member) => {
    const cardUrl = `/card/${member.id}`;
    // Open in new tab/window for PWA installation
    window.open(cardUrl, '_blank');
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    toast({ title: "Export", description: "Export functionaliteit wordt binnenkort toegevoegd." });
  };

  return (
    <main className="flex-1 py-4">
      <div className="px-4 sm:px-6 lg:px-8 w-full">
        {/* Page Header */}
        <div className="border-b border-gray-200 pb-5 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900" data-testid="page-title">Lidkaarten</h1>
            <p className="mt-1 text-sm text-gray-700">Beheer alle digitale lidkaarten van uw leden</p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500 mb-1">Actieve Lidkaarten</p>
              <p className="text-lg font-bold text-gray-900 mb-1">{stats?.totalActive || 0}</p>
              <div className="flex items-center space-x-1">
                <span className="text-xs font-medium text-green-600">
                  kaarten met status 'Actueel'
                </span>
              </div>
            </div>
            <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center">
              <CreditCard className="h-4 w-4 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500 mb-1">Geen Kaart</p>
              <p className="text-lg font-bold text-gray-900 mb-1">
                {filteredCards.filter(({ cardMeta }) => 
                  !cardMeta
                ).length}
              </p>
              <div className="flex items-center space-x-1">
                <span className="text-xs font-medium text-amber-500">
                  leden zonder lidkaart
                </span>
              </div>
            </div>
            <div className="w-8 h-8 bg-amber-50 rounded-full flex items-center justify-center">
              <CiCreditCardOff className="h-4 w-4 text-amber-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500 mb-1">Laatst Bijgewerkt</p>
              <p className="text-lg font-bold text-gray-900 mb-1">
                {stats?.lastUpdated 
                  ? format(new Date(stats.lastUpdated), 'dd MMM', { locale: nl })
                  : 'N.v.t.'
                }
              </p>
              <div className="flex items-center space-x-1">
                <span className="text-xs font-medium text-amber-500">
                  meest recente kaartupdate
                </span>
              </div>
            </div>
            <div className="w-8 h-8 bg-amber-50 rounded-full flex items-center justify-center">
              <MdOutlineBrowserUpdated className="h-4 w-4 text-amber-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500 mb-1">Verlopen Kaarten</p>
              <p className="text-lg font-bold text-gray-900 mb-1">
                {filteredCards.filter(({ cardMeta }) => 
                  cardMeta?.status === 'VERLOPEN'
                ).length}
              </p>
              <div className="flex items-center space-x-1">
                <span className="text-xs font-medium text-red-500">
                  kaarten met status 'Verlopen'
                </span>
              </div>
            </div>
            <div className="w-8 h-8 bg-red-50 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </div>
          </div>
        </div>
      </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Search and Export Button */}
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Zoek op lidnummer of naam..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-16 h-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                    data-testid="input-search"
                  />
                </div>
                
                <div className="flex gap-2 lg:flex-shrink-0">
                  {selectedIds.length > 0 && (
                    <div className="flex gap-2 mr-2">
                      <Badge variant="secondary" className="px-3 py-1">
                        {selectedIds.length} geselecteerd
                      </Badge>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedIds([])}
                        className="h-8"
                      >
                        Wis selectie
                      </Button>
                    </div>
                  )}
                  <Button 
                    variant="outline" 
                    onClick={handleExport}
                    className="h-10 px-4 border-gray-200 hover:border-gray-300"
                    data-testid="export-button"
                  >
                    <CiExport className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[160px] h-9 border-gray-200" data-testid="select-status">
                    <SelectValue placeholder="Alle statussen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle statussen</SelectItem>
                    <SelectItem value="ACTUEEL">Actueel</SelectItem>
                    <SelectItem value="VERLOPEN">Verlopen</SelectItem>
                    <SelectItem value="geen-kaart">Geen kaart</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[170px] h-9 border-gray-200" data-testid="select-category">
                    <SelectValue placeholder="Alle categorieën" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle categorieën</SelectItem>
                    <SelectItem value="STUDENT">Student</SelectItem>
                    <SelectItem value="STANDAARD">Standaard</SelectItem>
                    <SelectItem value="SENIOR">Senior</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

      {/* Cards Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedIds.length === filteredCards.length && filteredCards.length > 0}
                  onCheckedChange={handleSelectAll}
                  aria-label="Selecteer alle kaarten"
                />
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('memberNumber')}
              >
                <div className="flex items-center gap-2">
                  Lidnummer
                  {getSortIcon('memberNumber')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-2">
                  Naam
                  {getSortIcon('name')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('category')}
              >
                <div className="flex items-center gap-2">
                  Categorie
                  {getSortIcon('category')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center gap-2">
                  Status
                  {getSortIcon('status')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('validUntil')}
              >
                <div className="flex items-center gap-2">
                  Geldig tot
                  {getSortIcon('validUntil')}
                </div>
              </TableHead>
              <TableHead>Versie</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('lastRenderedAt')}
              >
                <div className="flex items-center gap-2">
                  Laatste update
                  {getSortIcon('lastRenderedAt')}
                </div>
              </TableHead>
              <TableHead className="text-right">Acties</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cardsLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Lidkaarten laden...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredCards.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  Geen lidkaarten gevonden die voldoen aan de filters
                </TableCell>
              </TableRow>
            ) : (
              filteredCards.map(({ member, cardMeta }) => (
                <TableRow 
                  key={member.id}
                  className={selectedIds.includes(member.id) ? "bg-blue-50" : ""}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(member.id)}
                      onCheckedChange={(checked) => handleSelectRow(member.id, !!checked)}
                      aria-label={`Selecteer ${member.firstName} ${member.lastName}`}
                    />
                  </TableCell>
                  <TableCell className="font-mono">{member.memberNumber}</TableCell>
                  <TableCell className="font-medium">
                    {member.firstName} {member.lastName}
                  </TableCell>
                  <TableCell>{getMemberCategoryLabel(member.category)}</TableCell>
                  <TableCell>
                    {cardMeta ? getStatusLabel(cardMeta.status) : 'Geen kaart'}
                  </TableCell>
                  <TableCell>
                    {cardMeta?.validUntil 
                      ? format(new Date(cardMeta.validUntil), 'dd/MM/yyyy', { locale: nl })
                      : '-'
                    }
                  </TableCell>
                  <TableCell>{cardMeta?.version || '-'}</TableCell>
                  <TableCell>
                    {cardMeta?.lastRenderedAt 
                      ? format(new Date(cardMeta.lastRenderedAt), 'dd/MM/yyyy HH:mm', { locale: nl })
                      : '-'
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          data-testid={`actions-menu-${member.id}`}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        {cardMeta ? (
                          <>
                            <DropdownMenuItem 
                              onClick={() => handlePreview({ member, cardMeta })}
                              className="flex items-center gap-2"
                            >
                              <Eye className="h-4 w-4" />
                              Bekijken
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleRegenerateCard(member.id)}
                              disabled={regenerateCardMutation.isPending}
                              className="flex items-center gap-2"
                            >
                              <RefreshCw className={`h-4 w-4 ${regenerateCardMutation.isPending ? 'animate-spin' : ''}`} />
                              Genereer
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <DropdownMenuItem 
                            onClick={() => handleCreateCard(member.id)}
                            disabled={createCardMutation.isPending}
                            className="flex items-center gap-2"
                          >
                            <Plus className="h-4 w-4" />
                            Maak kaart aan
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Preview Modal */}
      <Dialog open={!!previewCard} onOpenChange={() => setPreviewCard(null)}>
        <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Lidkaart Preview</DialogTitle>
          </DialogHeader>
          
          {previewCard && tenant && (
            <div className="space-y-4">
              <div className="relative aspect-[16/10] rounded-lg overflow-hidden border border-gray-200">
                <CardCanvas className="rounded-lg">
                  <LiveCard
                    member={previewCard.member}
                    cardMeta={previewCard.cardMeta!}
                    tenant={tenant}
                    standalone={true}
                    className="h-full w-full"
                  />
                </CardCanvas>
              </div>
              
              <div className="flex items-center justify-end gap-2 pt-4 border-t">
                <Button
                  onClick={() => handleRegenerateCard(previewCard.member.id)}
                  disabled={regenerateCardMutation.isPending}
                  variant="outline"
                  className="gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${regenerateCardMutation.isPending ? 'animate-spin' : ''}`} />
                  Regenereren
                </Button>
                
                <Button
                  onClick={() => handleViewCard(previewCard.member)}
                  variant="outline"
                  className="gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Kaart openen
                </Button>
                
                <Button
                  onClick={() => setPreviewCard(null)}
                  variant="default"
                >
                  Sluiten
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </main>
  );
}
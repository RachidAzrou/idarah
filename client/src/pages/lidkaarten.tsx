import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { LiveCard } from "@/components/cards/live-card";
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  RefreshCw, 
  Trash2,
  CreditCard,
  Users,
  CheckCircle2,
  Clock,
  MoreHorizontal
} from "lucide-react";
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
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch cards data
  const { data: cards = [], isLoading: cardsLoading } = useQuery<CardWithMember[]>({
    queryKey: ['/api/cards'],
    queryFn: async () => {
      const response = await fetch('/api/cards');
      if (!response.ok) throw new Error('Failed to fetch cards');
      return response.json();
    },
  });

  // Fetch card statistics
  const { data: stats } = useQuery<CardStats>({
    queryKey: ['/api/cards/stats'],
    queryFn: async () => {
      const response = await fetch('/api/cards/stats');
      if (!response.ok) throw new Error('Failed to fetch card stats');
      return response.json();
    },
  });

  // Fetch tenant data for card preview
  const { data: tenant } = useQuery<Tenant>({
    queryKey: ['/api/tenant/current'],
    queryFn: async () => {
      const response = await fetch('/api/tenant/current');
      if (!response.ok) throw new Error('Failed to fetch tenant');
      return response.json();
    },
  });

  // Regenerate card mutation
  const regenerateCardMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const response = await fetch(`/api/cards/${memberId}/regenerate`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to regenerate card');
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
      const response = await fetch(`/api/cards/${memberId}/deactivate`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to deactivate card');
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

  // Filter cards based on search and filters
  const filteredCards = useMemo(() => {
    return cards.filter(({ member, cardMeta }) => {
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
  }, [cards, searchTerm, statusFilter, categoryFilter]);

  const handlePreview = (cardData: CardWithMember) => {
    setPreviewCard(cardData);
  };

  const handleRegenerateCard = (memberId: string) => {
    regenerateCardMutation.mutate(memberId);
  };

  const handleDeactivateCard = (memberId: string) => {
    deactivateCardMutation.mutate(memberId);
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    toast({ title: "Export", description: "Export functionaliteit wordt binnenkort toegevoegd." });
  };

  return (
    <main className="flex-1 py-4">
      <div className="px-4 sm:px-6 lg:px-8 w-full">
        {/* Page Header */}
        <div className="mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900" data-testid="page-title">Lidkaarten</h1>
            <p className="mt-1 text-sm text-gray-700">Beheer alle digitale lidkaarten van uw leden</p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500 mb-1">Actieve Lidkaarten</p>
              <p className="text-lg font-bold text-gray-900 mb-1">{stats?.totalActive || 0}</p>
              <div className="flex items-center space-x-1">
                <span className="text-xs font-medium text-blue-600">
                  kaarten met status 'Actueel'
                </span>
              </div>
            </div>
            <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
              <CreditCard className="h-4 w-4 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500 mb-1">Geldigheidspercentage</p>
              <p className="text-lg font-bold text-gray-900 mb-1">{stats?.validPercentage || 0}%</p>
              <div className="flex items-center space-x-1">
                <span className="text-xs font-medium text-green-600">
                  leden met geldige kaart
                </span>
              </div>
            </div>
            <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
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
              <Clock className="h-4 w-4 text-amber-500" />
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
                  <Button 
                    variant="outline" 
                    onClick={handleExport}
                    className="h-10 px-4 border-gray-200 hover:border-gray-300 gap-2"
                    data-testid="export-button"
                  >
                    <Download className="h-4 w-4" />
                    Exporteer
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
                    <SelectItem value="MOMENTOPNAME">Momentopname</SelectItem>
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
                    <SelectItem value="STANDAARD">Volwassen</SelectItem>
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
              <TableHead>Lidnummer</TableHead>
              <TableHead>Naam</TableHead>
              <TableHead>Categorie</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Geldig tot</TableHead>
              <TableHead>Versie</TableHead>
              <TableHead>Laatste update</TableHead>
              <TableHead className="text-right">Acties</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cardsLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Lidkaarten laden...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredCards.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Geen lidkaarten gevonden die voldoen aan de filters
                </TableCell>
              </TableRow>
            ) : (
              filteredCards.map(({ member, cardMeta }) => (
                <TableRow key={member.id}>
                  <TableCell className="font-mono">{member.memberNumber}</TableCell>
                  <TableCell className="font-medium">
                    {member.firstName} {member.lastName}
                  </TableCell>
                  <TableCell>{getMemberCategoryLabel(member.category)}</TableCell>
                  <TableCell>
                    {cardMeta ? (
                      <Badge variant={getStatusVariant(cardMeta.status)}>
                        {getStatusLabel(cardMeta.status)}
                      </Badge>
                    ) : (
                      <Badge variant="outline">Geen kaart</Badge>
                    )}
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
                    <div className="flex items-center justify-end gap-2">
                      {cardMeta && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handlePreview({ member, cardMeta })}
                            data-testid={`button-preview-${member.id}`}
                            aria-label="Bekijk kaart"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRegenerateCard(member.id)}
                            disabled={regenerateCardMutation.isPending}
                            data-testid={`button-regenerate-${member.id}`}
                            aria-label="Regenereer kaart"
                          >
                            <RefreshCw className={`h-4 w-4 ${regenerateCardMutation.isPending ? 'animate-spin' : ''}`} />
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                data-testid={`button-deactivate-${member.id}`}
                                aria-label="Deactiveer kaart"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Kaart deactiveren</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Weet je zeker dat je de kaart van {member.firstName} {member.lastName} wilt deactiveren?
                                  Deze actie kan niet ongedaan worden gemaakt.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuleren</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeactivateCard(member.id)}
                                  disabled={deactivateCardMutation.isPending}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Deactiveren
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                    </div>
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
              <div className="bg-gray-50 p-4 rounded-lg">
                <LiveCard
                  member={previewCard.member}
                  cardMeta={previewCard.cardMeta!}
                  tenant={tenant}
                  standalone={false}
                />
              </div>
              
              <div className="flex items-center gap-2 pt-4 border-t">
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
                  onClick={() => toast({ title: "Export", description: "Export functionaliteit wordt binnenkort toegevoegd." })}
                  variant="outline"
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Exporteren
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
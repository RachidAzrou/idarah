import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BoardMemberForm } from "@/components/forms/board-member-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Crown, Plus, Edit, CalendarX, Phone, Mail, User } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

interface BoardMemberWithMember {
  boardMember: {
    id: string;
    memberId?: string;
    externalName?: string;
    email?: string;
    phone?: string;
    role: string;
    status: 'ACTIEF' | 'INACTIEF';
    termStart: string;
    termEnd?: string;
    responsibilities?: string;
    orderIndex: number;
    avatarUrl?: string;
  };
  member?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  };
}

const roleLabels = {
  VOORZITTER: "Voorzitter",
  ONDERVERZITTER: "Ondervoorzitter",
  SECRETARIS: "Secretaris",
  PENNINGMEESTER: "Penningmeester",
  BESTUURSLID: "Bestuurslid",
  ADVISEUR: "Adviseur"
};

const roleColors = {
  VOORZITTER: "bg-purple-100 text-purple-800",
  ONDERVERZITTER: "bg-blue-100 text-blue-800",
  SECRETARIS: "bg-green-100 text-green-800",
  PENNINGMEESTER: "bg-orange-100 text-orange-800",
  BESTUURSLID: "bg-gray-100 text-gray-800",
  ADVISEUR: "bg-yellow-100 text-yellow-800"
};

export default function Bestuur() {
  const [activeTab, setActiveTab] = useState("overzicht");
  const [statusFilter, setStatusFilter] = useState("ACTIEF");
  const [roleFilter, setRoleFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewMemberDialog, setShowNewMemberDialog] = useState(false);
  const [selectedBoardMember, setSelectedBoardMember] = useState<any>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Check if user has write permissions (not MEDEWERKER)
  const canEdit = user?.role !== 'MEDEWERKER';

  const { data: boardMembers, isLoading } = useQuery({
    queryKey: ["/api/board/members", { status: statusFilter, role: roleFilter, q: searchTerm }],
    staleTime: 10000,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      if (roleFilter && roleFilter !== 'all') params.append('role', roleFilter);
      if (searchTerm) params.append('q', searchTerm);
      
      const url = `/api/board/members${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url, { credentials: 'include' });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch board members: ${response.statusText}`);
      }
      
      return response.json();
    },
  });

  // Mutation for creating new board member
  const createBoardMemberMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/board/members', 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/board/members"] });
      setShowNewMemberDialog(false);
      toast({
        title: "Bestuurslid toegevoegd",
        description: "Het nieuwe bestuurslid is succesvol toegevoegd.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fout",
        description: error.message || "Er is een fout opgetreden bij het toevoegen van het bestuurslid.",
        variant: "destructive",
      });
    },
  });

  const handleCreateBoardMember = (formData: any) => {
    createBoardMemberMutation.mutate(formData);
  };

  const getName = (item: BoardMemberWithMember) => {
    if (item.member) {
      return `${item.member.firstName} ${item.member.lastName}`;
    }
    return item.boardMember.externalName || "Onbekend";
  };

  const getContact = (item: BoardMemberWithMember) => {
    const email = item.member?.email || item.boardMember.email;
    const phone = item.member?.phone || item.boardMember.phone;
    return { email, phone };
  };

  const filteredBoardMembers = (boardMembers as BoardMemberWithMember[] || [])?.filter((item: BoardMemberWithMember) => {
    const name = getName(item);
    const matchesSearch = !searchTerm || 
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.boardMember.role.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === "all" || item.boardMember.role === roleFilter;
    const matchesStatus = item.boardMember.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  }) || [];

  return (
    <div className="px-4 sm:px-6 lg:px-8 w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" data-testid="page-title">Mijn Bestuur</h1>
          <p className="text-sm text-gray-600 mt-1" data-testid="page-description">
            Beheer bestuursleden en hun mandaten
          </p>
        </div>
{canEdit && (
          <Button
            onClick={() => setShowNewMemberDialog(true)}
            className="flex items-center gap-2"
            data-testid="button-new-board-member"
          >
            <Plus className="w-4 h-4" />
            Nieuw Bestuurslid
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-2 w-auto" data-testid="board-tabs">
          <TabsTrigger value="overzicht" data-testid="tab-overview">Overzicht</TabsTrigger>
          <TabsTrigger value="historiek" data-testid="tab-history">Historiek</TabsTrigger>
        </TabsList>

        <TabsContent value="overzicht" className="space-y-6">
          {/* Filters */}
          <div className="flex gap-4 items-center">
            <Input
              placeholder="Zoek op naam of rol..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-xs"
              data-testid="input-search"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]" data-testid="select-status-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIEF">Actief</SelectItem>
                <SelectItem value="INACTIEF">Inactief</SelectItem>
              </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[160px]" data-testid="select-role-filter">
                <SelectValue placeholder="Alle rollen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle rollen</SelectItem>
                <SelectItem value="VOORZITTER">Voorzitter</SelectItem>
                <SelectItem value="ONDERVERZITTER">Ondervoorzitter</SelectItem>
                <SelectItem value="SECRETARIS">Secretaris</SelectItem>
                <SelectItem value="PENNINGMEESTER">Penningmeester</SelectItem>
                <SelectItem value="BESTUURSLID">Bestuurslid</SelectItem>
                <SelectItem value="ADVISEUR">Adviseur</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Board Members Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="board-members-grid">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))
            ) : filteredBoardMembers.length === 0 ? (
              <div className="col-span-full text-center py-12" data-testid="empty-state">
                <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Geen bestuursleden gevonden</h3>
                <p className="text-gray-500 mb-4">Voeg je eerste bestuurslid toe</p>
                <Button onClick={() => setShowNewMemberDialog(true)} data-testid="button-add-first-member">
                  <Plus className="w-4 h-4 mr-2" />
                  Voeg Bestuurslid Toe
                </Button>
              </div>
            ) : (
              filteredBoardMembers.map((item: BoardMemberWithMember) => {
                const { email, phone } = getContact(item);
                const name = getName(item);
                
                return (
                  <Card key={item.boardMember.id} className="hover:shadow-lg transition-shadow" data-testid={`card-board-member-${item.boardMember.id}`}>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={item.boardMember.avatarUrl} />
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            {name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-base" data-testid={`text-name-${item.boardMember.id}`}>{name}</CardTitle>
                            {item.boardMember.status === 'ACTIEF' && (
                              <Crown 
                                className="w-4 h-4 text-yellow-500" 
                                style={{ color: '#FFD700' }}
                                aria-label="Actief bestuurslid"
                                data-testid={`crown-${item.boardMember.id}`}
                              />
                            )}
                          </div>
                          <Badge 
                            className={`text-xs ${roleColors[item.boardMember.role as keyof typeof roleColors] || 'bg-gray-100 text-gray-800'}`}
                            data-testid={`badge-role-${item.boardMember.id}`}
                          >
                            {roleLabels[item.boardMember.role as keyof typeof roleLabels]}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <User className="w-4 h-4" />
                          <span data-testid={`text-status-${item.boardMember.id}`}>
                            {item.boardMember.status === 'ACTIEF' ? 'Actief mandaat' : 'Beëindigd mandaat'}
                          </span>
                        </div>
                        <div className="text-gray-600">
                          <strong>Mandaat:</strong> {format(new Date(item.boardMember.termStart), 'dd MMM yyyy', { locale: nl })}
                          {item.boardMember.termEnd && ` - ${format(new Date(item.boardMember.termEnd), 'dd MMM yyyy', { locale: nl })}`}
                        </div>
                        {email && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Mail className="w-4 h-4" />
                            <span className="truncate" data-testid={`text-email-${item.boardMember.id}`}>{email}</span>
                          </div>
                        )}
                        {phone && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Phone className="w-4 h-4" />
                            <span data-testid={`text-phone-${item.boardMember.id}`}>{phone}</span>
                          </div>
                        )}
                        {item.boardMember.responsibilities && (
                          <div className="text-gray-600 text-xs mt-3 p-2 bg-gray-50 rounded">
                            <strong>Verantwoordelijkheden:</strong>
                            <p className="mt-1" data-testid={`text-responsibilities-${item.boardMember.id}`}>
                              {item.boardMember.responsibilities}
                            </p>
                          </div>
                        )}
{canEdit && (
                          <div className="flex gap-2 pt-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setSelectedBoardMember(item)}
                              data-testid={`button-edit-${item.boardMember.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            {item.boardMember.status === 'ACTIEF' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                data-testid={`button-end-term-${item.boardMember.id}`}
                              >
                                <CalendarX className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="historiek" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bestuur Historiek</CardTitle>
              <CardDescription>
                Overzicht van alle voormalige bestuursleden en hun mandaten
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-center py-8" data-testid="history-placeholder">
                Historiek functionaliteit wordt binnenkort toegevoegd
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* New Board Member Dialog */}
      {canEdit && (
        <Dialog open={showNewMemberDialog} onOpenChange={setShowNewMemberDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nieuw Bestuurslid</DialogTitle>
            </DialogHeader>
            <BoardMemberForm
              onSubmit={handleCreateBoardMember}
              onCancel={() => setShowNewMemberDialog(false)}
              isLoading={createBoardMemberMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Board Member Dialog */}
      {canEdit && (
        <Dialog open={!!selectedBoardMember} onOpenChange={() => setSelectedBoardMember(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Bestuurslid Bewerken</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-gray-500 text-center" data-testid="edit-member-placeholder">
                Bewerken formulier wordt binnenkort toegevoegd
              </p>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setSelectedBoardMember(null)} data-testid="button-cancel-edit">
                  Annuleren
                </Button>
                <Button data-testid="button-save-edit">
                  Opslaan
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
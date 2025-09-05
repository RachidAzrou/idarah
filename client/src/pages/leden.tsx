import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { MemberForm } from "@/components/forms/member-form";
import { Toolbar } from "@/components/members/toolbar";
import { MembersTable } from "@/components/members/members-table";
import { FiltersDrawer } from "@/components/members/filters-drawer";
import { MemberImportDialog } from "@/components/members/member-import-dialog";
import { MemberDetailDialog } from "@/components/members/member-detail-dialog";
import { ExportDialog } from "@/components/members/export-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { FiUserPlus } from "react-icons/fi";
import { Edit2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface FilterValues {
  categories: string[];
  statuses: string[];
  genders: string[];
  joinDateFrom: string;
  joinDateTo: string;
  paymentStatuses: string[];
  onlyActivePayments: boolean;
}

const initialFilters: FilterValues = {
  categories: [],
  statuses: [],
  genders: [],
  joinDateFrom: "",
  joinDateTo: "",
  paymentStatuses: [],
  onlyActivePayments: false,
};

export default function Leden() {
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [votingRightsFilter, setVotingRightsFilter] = useState("");
  const [joinDateFrom, setJoinDateFrom] = useState<Date | undefined>();
  const [joinDateTo, setJoinDateTo] = useState<Date | undefined>();
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [showNewMemberDialog, setShowNewMemberDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);
  const [showMemberDetail, setShowMemberDetail] = useState(false);
  const [showEditMember, setShowEditMember] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [advancedFilters, setAdvancedFilters] = useState<FilterValues>(initialFilters);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: members, isLoading, isFetching } = useQuery({
    queryKey: ["/api/members"],
    staleTime: 5000, // 5 seconds for member data
  });

  const updateMemberMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PUT", `/api/members/${id}`, data);
      return response.json();
    },
    onSuccess: async (updatedMember, variables) => {
      // Optimistic update - update member in lijst
      queryClient.setQueryData(["/api/members"], (oldData: any) => {
        if (!Array.isArray(oldData)) return oldData;
        return oldData.map((member: any) => 
          member.id === variables.id ? { ...member, ...variables.data } : member
        );
      });
      
      await queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      toast({
        title: "Lid bijgewerkt",
        description: "De wijzigingen zijn opgeslagen.",
      });
    },
  });

  const deleteMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const response = await apiRequest("DELETE", `/api/members/${memberId}`);
      return response;
    },
    onSuccess: async (result, deletedMemberId) => {
      // Optimistic update - verwijder member uit lijst
      queryClient.setQueryData(["/api/members"], (oldData: any) => {
        if (!Array.isArray(oldData)) return oldData;
        return oldData.filter((member: any) => member.id !== deletedMemberId);
      });
      
      // Update dashboard stats optimistically
      queryClient.setQueryData(["/api/dashboard/stats"], (oldStats: any) => {
        if (!oldStats) return oldStats;
        return {
          ...oldStats,
          totalMembers: (parseInt(oldStats.totalMembers) - 1).toString(),
          activeMembers: (parseInt(oldStats.activeMembers) - 1).toString(),
        };
      });
      
      await queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Lid verwijderd",
        description: "Het lid is permanent verwijderd uit het systeem.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fout bij verwijderen",
        description: "Er is een fout opgetreden bij het verwijderen van het lid.",
        variant: "destructive",
      });
    },
  });

  const importMembersMutation = useMutation({
    mutationFn: async (membersData: any[]) => {
      const importedMembers = [];
      
      for (const memberData of membersData) {
        try {
          const response = await apiRequest("POST", "/api/members", memberData);
          const member = await response.json();
          importedMembers.push(member);
        } catch (error) {
          console.error('Error importing member:', memberData.memberNumber, error);
          throw error;
        }
      }
      
      return importedMembers;
    },
    onSuccess: async (importedMembers, variables) => {
      // Optimistic update - voeg geïmporteerde members toe
      queryClient.setQueryData(["/api/members"], (oldData: any) => {
        if (!Array.isArray(oldData)) return importedMembers;
        return [...importedMembers, ...oldData];
      });
      
      // Update dashboard stats optimistically
      queryClient.setQueryData(["/api/dashboard/stats"], (oldStats: any) => {
        if (!oldStats) return oldStats;
        const activeCount = importedMembers.filter((m: any) => m.active).length;
        return {
          ...oldStats,
          totalMembers: (parseInt(oldStats.totalMembers) + importedMembers.length).toString(),
          activeMembers: (parseInt(oldStats.activeMembers) + activeCount).toString(),
        };
      });
      
      await queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Import voltooid",
        description: `${importedMembers.length} leden succesvol geïmporteerd.`,
      });
      setShowImportDialog(false);
    },
    onError: (error) => {
      console.error('Import error:', error);
      toast({
        title: "Import fout",
        description: "Er is een fout opgetreden bij het importeren van de leden.",
        variant: "destructive",
      });
    },
  });

  // Advanced filtering logic
  const filteredMembers = useMemo(() => {
    if (!members || !Array.isArray(members)) return [];
    
    return members.filter((member: any) => {
      // Search filter
      const searchMatch = searchTerm === "" || 
        `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.memberNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Status filter
      const statusMatch = statusFilter === "all" || 
        (statusFilter === "ACTIEF" && member.active) ||
        (statusFilter === "INACTIEF" && !member.active);
      
      // Category filter  
      const categoryMatch = categoryFilter === "all" || member.category === categoryFilter;
      
      // Voting rights filter (based on age and category)
      const votingRightsMatch = votingRightsFilter === "" || 
        (votingRightsFilter === "yes" && (member.category === "STANDAARD" || member.category === "SENIOR")) ||
        (votingRightsFilter === "no" && (member.category === "STUDENT" || member.category === "JEUGD"));
      
      // Date range filter
      let dateMatch = true;
      if (joinDateFrom || joinDateTo) {
        const memberDate = new Date(member.createdAt);
        if (joinDateFrom) {
          dateMatch = dateMatch && memberDate >= joinDateFrom;
        }
        if (joinDateTo) {
          dateMatch = dateMatch && memberDate <= joinDateTo;
        }
      }
      
      // Payment status filter (mock for now)
      const paymentMatch = paymentStatusFilter === "all";
      
      // Advanced filters (keep existing logic as backup)
      const categoryAdvancedMatch = advancedFilters.categories.length === 0 || 
        advancedFilters.categories.includes(member.category);
      
      const statusAdvancedMatch = advancedFilters.statuses.length === 0 || 
        advancedFilters.statuses.includes(member.active ? 'ACTIEF' : 'INACTIEF');
      
      const genderAdvancedMatch = advancedFilters.genders.length === 0 || 
        advancedFilters.genders.includes(member.gender);
      
      // Advanced date range filter
      let dateAdvancedMatch = true;
      if (advancedFilters.joinDateFrom || advancedFilters.joinDateTo) {
        const memberDate = new Date(member.createdAt);
        if (advancedFilters.joinDateFrom) {
          dateAdvancedMatch = dateAdvancedMatch && memberDate >= new Date(advancedFilters.joinDateFrom);
        }
        if (advancedFilters.joinDateTo) {
          dateAdvancedMatch = dateAdvancedMatch && memberDate <= new Date(advancedFilters.joinDateTo);
        }
      }
      
      return searchMatch && statusMatch && categoryMatch && votingRightsMatch && 
             dateMatch && paymentMatch && categoryAdvancedMatch && 
             statusAdvancedMatch && genderAdvancedMatch && dateAdvancedMatch;
    });
  }, [members, searchTerm, statusFilter, categoryFilter, votingRightsFilter, joinDateFrom, joinDateTo, paymentStatusFilter, advancedFilters]);
  
  // Pagination
  const totalMembers = filteredMembers.length;
  const paginatedMembers = useMemo(() => {
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    return filteredMembers.slice(startIndex, endIndex);
  }, [filteredMembers, page, perPage]);

  const toggleMemberStatus = (memberId: string, currentStatus: boolean) => {
    updateMemberMutation.mutate({
      id: memberId,
      data: { active: !currentStatus }
    });
  };

  const handleRowAction = (action: string, memberId: string) => {
    switch (action) {
      case 'view':
        toast({ title: "Lid bekijken", description: `Bekijk details van lid ${memberId}` });
        break;
      case 'edit':
        toast({ title: "Lid bewerken", description: `Bewerk lid ${memberId}` });
        break;
      case 'toggleStatus':
        const member = Array.isArray(members) ? members.find((m: any) => m.id === memberId) : null;
        if (member) {
          toggleMemberStatus(memberId, member.active);
        }
        break;
      case 'delete':
        deleteMemberMutation.mutate(memberId);
        break;
    }
  };

  const handleBulkAction = (action: string, memberIds: string[]) => {
    switch (action) {
      case 'export':
        toast({ title: "Export", description: `${memberIds.length} leden geëxporteerd` });
        break;
      case 'deactivate':
        toast({ title: "Bulk deactivatie", description: `${memberIds.length} leden gedeactiveerd` });
        break;
    }
  };

  const handleMemberView = (memberId: string) => {
    const member = filteredMembers.find((m: any) => m.id === memberId);
    if (member) {
      setSelectedMember(member);
      setShowMemberDetail(true);
    }
  };

  const handleMemberEdit = (memberId: string) => {
    const member = filteredMembers.find((m: any) => m.id === memberId);
    if (member) {
      setSelectedMember(member);
      setShowEditMember(true);
    }
  };

  const handleMemberToggleStatus = (memberId: string, currentStatus: boolean) => {
    const newStatus = currentStatus ? 'INACTIVE' : 'ACTIVE';
    updateMemberMutation.mutate({ id: memberId, data: { status: newStatus } });
  };

  const handleMemberDelete = (memberId: string) => {
    deleteMemberMutation.mutate(memberId);
  };

  const handleExport = () => {
    setShowExportDialog(true);
  };

  const handleImport = () => {
    setShowImportDialog(true);
  };

  const handleImportMembers = (membersData: any[]) => {
    importMembersMutation.mutate(membersData);
  };

  const handleAdvancedFilters = (filters: FilterValues) => {
    setAdvancedFilters(filters);
    setShowFiltersDrawer(false);
  };

  return (
    <main className="flex-1 py-4">
      {/* Fixed Page Header */}
      <div className="sticky top-0 z-30 bg-background border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-3">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent tracking-tight" data-testid="page-title">Ledenbeheer</h1>
          <p className="mt-1 text-sm text-gray-600 font-medium">Beheer alle leden van uw organisatie</p>
        </div>
      </div>
      
      <div className="px-4 sm:px-6 lg:px-8 w-full pt-4">

      <Toolbar 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        votingRightsFilter={votingRightsFilter}
        onVotingRightsFilterChange={setVotingRightsFilter}
        joinDateFrom={joinDateFrom}
        onJoinDateFromChange={setJoinDateFrom}
        joinDateTo={joinDateTo}
        onJoinDateToChange={setJoinDateTo}
        paymentStatusFilter={paymentStatusFilter}
        onPaymentStatusFilterChange={setPaymentStatusFilter}
        onFiltersClick={() => setShowFiltersDrawer(true)}
        onExportClick={handleExport}
        onImportClick={handleImport}
        onNewMemberClick={() => setShowNewMemberDialog(true)}
        totalMembers={totalMembers}
        isLoading={isLoading}
      />

      <MembersTable
        members={paginatedMembers}
        total={totalMembers}
        page={page}
        perPage={perPage}
        onPageChange={setPage}
        onPerPageChange={setPerPage}
        onRowAction={handleRowAction}
        onBulkAction={handleBulkAction}
        onView={handleMemberView}
        onEdit={handleMemberEdit}
        onToggleStatus={handleMemberToggleStatus}
        onDelete={handleMemberDelete}
        loading={isLoading}
      />

      {/* Dialogs */}
      <Dialog open={showNewMemberDialog} onOpenChange={setShowNewMemberDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FiUserPlus className="h-5 w-5" />
              Nieuw Lid Toevoegen
            </DialogTitle>
            <DialogDescription>
              Voeg een nieuw lid toe aan de ledenlijst.
            </DialogDescription>
          </DialogHeader>
          <MemberForm 
            onSubmit={(data) => {
              // Add mutation logic here
              setShowNewMemberDialog(false);
            }}
            onCancel={() => setShowNewMemberDialog(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showEditMember} onOpenChange={setShowEditMember}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="h-5 w-5" />
              Lid Bewerken
            </DialogTitle>
            <DialogDescription>
              Bewerk de gegevens van {selectedMember?.firstName} {selectedMember?.lastName}.
            </DialogDescription>
          </DialogHeader>
          {selectedMember && (
            <MemberForm 
              initialData={selectedMember}
              onSubmit={(data) => {
                updateMemberMutation.mutate({ id: selectedMember.id, data });
                setShowEditMember(false);
              }}
              onCancel={() => setShowEditMember(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      <MemberImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onImport={handleImportMembers}
      />

      <MemberDetailDialog
        open={showMemberDetail}
        onOpenChange={setShowMemberDetail}
        member={selectedMember}
      />

      <ExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        members={filteredMembers}
      />

      <FiltersDrawer
        open={showFiltersDrawer}
        onOpenChange={setShowFiltersDrawer}
        filters={advancedFilters}
        onFiltersChange={handleAdvancedFilters}
      />
      </div>
    </main>
  );
}
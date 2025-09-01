import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { MemberForm } from "@/components/forms/member-form";
import { Toolbar } from "@/components/members/toolbar";
import { MembersTable } from "@/components/members/members-table";
import { FiltersDrawer } from "@/components/members/filters-drawer";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { FiUserPlus } from "react-icons/fi";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [votingRightsFilter, setVotingRightsFilter] = useState("");
  const [joinDateFrom, setJoinDateFrom] = useState<Date | undefined>();
  const [joinDateTo, setJoinDateTo] = useState<Date | undefined>();
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [showNewMemberDialog, setShowNewMemberDialog] = useState(false);
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<FilterValues>(initialFilters);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: members, isLoading } = useQuery({
    queryKey: ["/api/members"],
  });

  const updateMemberMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PUT", `/api/members/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      toast({
        title: "Lid bijgewerkt",
        description: "De wijzigingen zijn opgeslagen.",
      });
    },
  });

  // Advanced filtering logic
  const filteredMembers = useMemo(() => {
    if (!members) return [];
    
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
        (votingRightsFilter === "yes" && (member.category === "VOLWASSEN" || member.category === "SENIOR")) ||
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
        const member = members?.find((m: any) => m.id === memberId);
        if (member) {
          toggleMemberStatus(memberId, member.active);
        }
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

  const handleExport = () => {
    toast({ title: "Export", description: "Alle leden geëxporteerd" });
  };

  const handleImport = () => {
    toast({ title: "Import", description: "Import functie geopend" });
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setCategoryFilter("all");
    setVotingRightsFilter("");
    setJoinDateFrom(undefined);
    setJoinDateTo(undefined);
    setPaymentStatusFilter("all");
    setAdvancedFilters(initialFilters);
    setPage(1);
    toast({ title: "Filters gereset", description: "Alle filters zijn gewist" });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePerPageChange = (newPerPage: number) => {
    setPerPage(newPerPage);
    setPage(1); // Reset to first page
  };


  return (
    <main className="flex-1 py-4">
      <div className="px-4 sm:px-6 lg:px-8 w-full">
        {/* Page Header */}
        <div className="mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900" data-testid="page-title">Ledenbeheer</h1>
            <p className="mt-1 text-sm text-gray-700">Beheer je verenigingsleden en hun gegevens</p>
          </div>
        </div>

        {/* Toolbar */}
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
          onExport={handleExport}
          onImport={handleImport}
          onNewMember={() => setShowNewMemberDialog(true)}
          onMoreFilters={handleResetFilters}
        />

        {/* Members Table */}
        <MembersTable
          members={paginatedMembers}
          total={totalMembers}
          page={page}
          perPage={perPage}
          onPageChange={handlePageChange}
          onPerPageChange={handlePerPageChange}
          onRowAction={handleRowAction}
          onBulkAction={handleBulkAction}
          loading={isLoading}
        />

        {/* New Member Dialog */}
        <Dialog open={showNewMemberDialog} onOpenChange={setShowNewMemberDialog}>
          <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FiUserPlus className="h-5 w-5" />
                Nieuw Lid Toevoegen
              </DialogTitle>
              <DialogDescription>
                Voeg een nieuw lid toe aan de ledenadministratie
              </DialogDescription>
            </DialogHeader>
            <MemberForm
              onSuccess={() => setShowNewMemberDialog(false)}
              onCancel={() => setShowNewMemberDialog(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Filters Drawer */}
        <FiltersDrawer
          open={showFiltersDrawer}
          onOpenChange={setShowFiltersDrawer}
          filters={advancedFilters}
          onFiltersChange={setAdvancedFilters}
        />
      </div>
    </main>
  );
}

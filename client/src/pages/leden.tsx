import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MemberForm } from "@/components/forms/member-form";
import { Plus, Search, MoreVertical, Filter, Download, Users } from "lucide-react";
import { getUserInitials } from "@/lib/auth";
import { formatDate, getMemberCategoryLabel } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Leden() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewMemberDialog, setShowNewMemberDialog] = useState(false);
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

  const filteredMembers = members?.filter((member: any) =>
    `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.memberNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const toggleMemberStatus = (memberId: string, currentStatus: boolean) => {
    updateMemberMutation.mutate({
      id: memberId,
      data: { active: !currentStatus }
    });
  };

  if (isLoading) {
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
                <h1 className="text-2xl font-bold text-gray-900" data-testid="page-title">Leden</h1>
                <p className="mt-1 text-sm text-gray-700">Beheer en bekijk alle leden van de moskee</p>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              <Card>
                <CardContent className="px-6 py-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                    <div className="ml-4 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Totaal Leden</dt>
                        <dd className="text-2xl font-bold text-gray-900" data-testid="total-members">{members?.length || 0}</dd>
                      </dl>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="px-6 py-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center">
                        <Users className="h-5 w-5 text-green-600" />
                      </div>
                    </div>
                    <div className="ml-4 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Actieve Leden</dt>
                        <dd className="text-2xl font-bold text-gray-900" data-testid="active-members">
                          {members?.filter((m: any) => m.active).length || 0}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="px-6 py-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-purple-100 rounded-xl flex items-center justify-center">
                        <Users className="h-5 w-5 text-purple-600" />
                      </div>
                    </div>
                    <div className="ml-4 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Studenten</dt>
                        <dd className="text-2xl font-bold text-gray-900" data-testid="student-members">
                          {members?.filter((m: any) => m.category === 'STUDENT').length || 0}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="px-6 py-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center">
                        <Users className="h-5 w-5 text-orange-600" />
                      </div>
                    </div>
                    <div className="ml-4 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Senioren</dt>
                        <dd className="text-2xl font-bold text-gray-900" data-testid="senior-members">
                          {members?.filter((m: any) => m.category === 'SENIOR').length || 0}
                        </dd>
                      </dl>
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
                      placeholder="Zoek op naam, lidnummer of e-mail..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                      data-testid="search-members"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" data-testid="filter-button">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                    <Button variant="outline" size="sm" data-testid="export-button">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Members Table */}
            <Card>
              <CardHeader className="px-6 py-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Ledenlijst</h3>
                    <p className="text-sm text-gray-500">{filteredMembers.length} leden gevonden</p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                {filteredMembers.length === 0 ? (
                  <div className="p-6 text-center text-gray-500" data-testid="no-members">
                    {searchTerm ? 'Geen leden gevonden voor deze zoekopdracht' : 'Nog geen leden toegevoegd'}
                  </div>
                ) : (
                  <div className="overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lid</th>
                          <th scope="col" className="sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lidnummer</th>
                          <th scope="col" className="sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categorie</th>
                          <th scope="col" className="sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                          <th scope="col" className="sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th scope="col" className="sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Toegevoegd</th>
                          <th scope="col" className="sticky top-0 relative px-6 py-3"><span className="sr-only">Acties</span></th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredMembers.map((member: any) => (
                          <tr key={member.id} className="hover:bg-gray-50" data-testid={`member-row-${member.id}`}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                                    <span className="text-sm font-medium text-primary-foreground">
                                      {getUserInitials(`${member.firstName} ${member.lastName}`)}
                                    </span>
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900" data-testid={`member-name-${member.id}`}>
                                    {member.firstName} {member.lastName}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {member.gender === 'M' ? 'Man' : 'Vrouw'}
                                    {member.birthDate && ` • ${formatDate(member.birthDate)}`}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900" data-testid={`member-number-${member.id}`}>
                              {member.memberNumber}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge 
                                variant={member.category === 'STUDENT' ? 'secondary' : member.category === 'SENIOR' ? 'outline' : 'default'}
                                data-testid={`member-category-${member.id}`}
                              >
                                {getMemberCategoryLabel(member.category)}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" data-testid={`member-contact-${member.id}`}>
                              {member.email && <div>{member.email}</div>}
                              {member.phone && <div>{member.phone}</div>}
                              {!member.email && !member.phone && <span className="text-gray-400">Geen contact</span>}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge 
                                variant={member.active ? 'default' : 'destructive'}
                                className={member.active ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}
                                data-testid={`member-status-${member.id}`}
                              >
                                <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${member.active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                {member.active ? 'Actief' : 'Inactief'}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" data-testid={`member-created-${member.id}`}>
                              {formatDate(member.createdAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-500" data-testid={`member-actions-${member.id}`}>
                                    <MoreVertical className="h-5 w-5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    Bewerken
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    Lidgeld toevoegen
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    Digitale kaart
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => toggleMemberStatus(member.id, member.active)}
                                    className={member.active ? 'text-red-600' : 'text-green-600'}
                                  >
                                    {member.active ? 'Deactiveren' : 'Activeren'}
                                  </DropdownMenuItem>
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
  );
}

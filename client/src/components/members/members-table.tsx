import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { RowActions } from "./row-actions";
import { ChevronUp, ChevronDown, Users, UserX } from "lucide-react";
import { CiExport } from "react-icons/ci";
import { formatDate, getMemberCategoryLabel } from "@/lib/format";
import { getUserInitials } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface Member {
  id: string;
  memberNumber: string;
  firstName: string;
  lastName: string;
  email?: string;
  category: string;
  active: boolean;
  createdAt: string;
  gender?: string;
  birthDate?: string;
}

interface SortConfig {
  key: keyof Member | null;
  direction: 'asc' | 'desc';
}

interface MembersTableProps {
  members: Member[];
  total: number;
  page: number;
  perPage: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  onRowAction: (action: string, memberId: string) => void;
  onBulkAction: (action: string, memberIds: string[]) => void;
  loading?: boolean;
}

export function MembersTable({
  members,
  total,
  page,
  perPage,
  onPageChange,
  onPerPageChange,
  onRowAction,
  onBulkAction,
  loading = false
}: MembersTableProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });

  const handleSort = (key: keyof Member) => {
    const direction = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key, direction });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(members.map(m => m.id));
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

  const handleBulkExport = () => {
    onBulkAction('export', selectedIds);
    setSelectedIds([]);
  };

  const handleBulkDeactivate = () => {
    onBulkAction('deactivate', selectedIds);
    setSelectedIds([]);
  };

  const getSortIcon = (key: keyof Member) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? 
      <ChevronUp className="h-4 w-4" /> : 
      <ChevronDown className="h-4 w-4" />;
  };

  const totalPages = Math.ceil(total / perPage);
  const startItem = (page - 1) * perPage + 1;
  const endItem = Math.min(page * perPage, total);

  if (loading) {
    return <SkeletonTable />;
  }

  return (
    <Card className="shadow-sm border border-gray-200">
      {selectedIds.length > 0 && (
        <div className="px-6 py-4 bg-blue-50 border-b border-blue-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">
              {selectedIds.length} geselecteerd
            </span>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleBulkExport}
                className="border-blue-200 text-blue-700 hover:bg-blue-100"
                data-testid="bulk-export"
              >
                <CiExport className="h-4 w-4 mr-2" />
                Export selectie
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleBulkDeactivate}
                className="border-red-200 text-red-700 hover:bg-red-100"
                data-testid="bulk-deactivate"
              >
                <UserX className="h-4 w-4 mr-2" />
                Markeer inactief
              </Button>
            </div>
          </div>
        </div>
      )}

      <CardHeader className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Ledenlijst</h3>
            <p className="text-sm text-gray-500">
              {startItem}-{endItem} van {total} leden
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Per pagina:</span>
              <Select value={perPage.toString()} onValueChange={(value) => onPerPageChange(Number(value))}>
                <SelectTrigger className="w-20 h-8" data-testid="per-page-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {members.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="sticky top-0 w-12 px-6 py-3 text-left">
                    <Checkbox
                      checked={selectedIds.length === members.length && members.length > 0}
                      onCheckedChange={handleSelectAll}
                      aria-label="Selecteer alle leden"
                    />
                  </th>
                  <th 
                    className="sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('memberNumber')}
                  >
                    <div className="flex items-center gap-2">
                      Lidnummer
                      {getSortIcon('memberNumber')}
                    </div>
                  </th>
                  <th 
                    className="sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('lastName')}
                  >
                    <div className="flex items-center gap-2">
                      Naam
                      {getSortIcon('lastName')}
                    </div>
                  </th>
                  <th className="sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    Voornaam
                  </th>
                  <th className="sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categorie
                  </th>
                  <th 
                    className="sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('createdAt')}
                  >
                    <div className="flex items-center gap-2">
                      Inschrijvingsdatum
                      {getSortIcon('createdAt')}
                    </div>
                  </th>
                  <th className="sticky top-0 px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acties
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {members.map((member) => (
                  <tr 
                    key={member.id} 
                    className={cn(
                      "hover:bg-gray-50 transition-colors",
                      selectedIds.includes(member.id) && "bg-blue-50"
                    )}
                    data-testid={`member-row-${member.id}`}
                  >
                    <td className="px-6 py-4">
                      <Checkbox
                        checked={selectedIds.includes(member.id)}
                        onCheckedChange={(checked) => handleSelectRow(member.id, !!checked)}
                        aria-label={`Selecteer ${member.firstName} ${member.lastName}`}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-mono font-medium text-gray-900">
                        {member.memberNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-xs font-medium text-blue-700">
                              {getUserInitials(`${member.firstName} ${member.lastName}`)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {member.lastName}
                          </div>
                          <div className="text-sm text-gray-500 lg:hidden">
                            {member.firstName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden lg:table-cell">
                      {member.firstName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={member.active ? 'ACTIEF' : 'INACTIEF'} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="secondary" className="text-xs">
                        {getMemberCategoryLabel(member.category)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(member.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <RowActions
                        memberId={member.id}
                        memberName={`${member.firstName} ${member.lastName}`}
                        isActive={member.active}
                        onView={(id) => onRowAction('view', id)}
                        onEdit={(id) => onRowAction('edit', id)}
                        onToggleStatus={(id, currentStatus) => onRowAction('toggleStatus', id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(page - 1)}
                disabled={page === 1}
                data-testid="prev-page"
              >
                Vorige
              </Button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <Button
                    key={pageNum}
                    variant={page === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange(pageNum)}
                    className={page === pageNum ? "bg-blue-600 hover:bg-blue-700" : ""}
                    data-testid={`page-${pageNum}`}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(page + 1)}
                disabled={page === totalPages}
                data-testid="next-page"
              >
                Volgende
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

function SkeletonTable() {
  return (
    <Card className="shadow-sm border border-gray-200">
      <CardHeader className="px-6 py-4 border-b border-gray-200">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/6"></div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-0">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="px-6 py-4 border-b border-gray-200 animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="w-4 h-4 bg-gray-200 rounded"></div>
                <div className="w-16 h-4 bg-gray-200 rounded"></div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                  <div className="space-y-1">
                    <div className="w-24 h-4 bg-gray-200 rounded"></div>
                    <div className="w-16 h-3 bg-gray-200 rounded"></div>
                  </div>
                </div>
                <div className="w-16 h-4 bg-gray-200 rounded"></div>
                <div className="w-12 h-6 bg-gray-200 rounded-full"></div>
                <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
                <div className="w-20 h-4 bg-gray-200 rounded"></div>
                <div className="w-8 h-4 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="p-12 text-center">
      <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">Geen leden gevonden</h3>
      <p className="text-gray-500">
        Voeg je eerste lid toe om te beginnen met het beheren van je ledenbestand.
      </p>
    </div>
  );
}
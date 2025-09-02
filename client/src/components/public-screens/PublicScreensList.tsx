"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PublicScreen } from "@/lib/mock/public-screens";
import { ScreenCard } from "./ScreenCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PublicScreensListProps {
  onEdit: (screen: PublicScreen) => void;
  onDelete: (screenName: string) => void;
}

export function PublicScreensList({ onEdit, onDelete }: PublicScreensListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: screens = [], isLoading } = useQuery({
    queryKey: ['/api/public-screens']
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`/api/public-screens/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({ active })
      });
      if (!response.ok) throw new Error('Failed to update screen');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/public-screens'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`/api/public-screens/${id}`, {
        method: 'DELETE',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });
      if (!response.ok) throw new Error('Failed to delete screen');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/public-screens'] });
    }
  });

  const filteredScreens = useMemo(() => {
    return screens.filter(screen => {
      const matchesSearch = screen.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === "ALL" || screen.type === typeFilter;
      const matchesStatus = statusFilter === "ALL" || 
        (statusFilter === "ACTIVE" && screen.active) ||
        (statusFilter === "INACTIVE" && !screen.active);
      
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [screens, searchTerm, typeFilter, statusFilter]);

  const handleToggleStatus = (screen: PublicScreen) => {
    toggleStatusMutation.mutate({ id: screen.id, active: !screen.active });
  };

  const handleDelete = (screen: PublicScreen) => {
    deleteMutation.mutate(screen.id);
    onDelete(screen.name);
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Schermen laden...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Zoek schermen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="search-screens"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-48" data-testid="filter-type">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Alle types</SelectItem>
            <SelectItem value="LEDENLIJST">Ledenlijst</SelectItem>
            <SelectItem value="MEDEDELINGEN">Mededelingen</SelectItem>
            <SelectItem value="MULTIMEDIA">Multimedia</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48" data-testid="filter-status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Alle statussen</SelectItem>
            <SelectItem value="ACTIVE">Actief</SelectItem>
            <SelectItem value="INACTIVE">Inactief</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results */}
      {filteredScreens.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-2">Geen schermen gevonden</div>
          <div className="text-sm text-gray-500">
            {searchTerm || typeFilter !== "ALL" || statusFilter !== "ALL" 
              ? "Probeer je zoekcriteria aan te passen" 
              : "Maak je eerste publiek scherm aan"
            }
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredScreens.map(screen => (
            <ScreenCard
              key={screen.id}
              screen={screen}
              onEdit={() => onEdit(screen)}
              onToggleStatus={() => handleToggleStatus(screen)}
              onDelete={() => handleDelete(screen)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
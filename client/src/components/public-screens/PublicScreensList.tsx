"use client";

import { useState, useMemo } from "react";
import { publicScreensStore, PublicScreen } from "@/lib/mock/public-screens";
import { ScreenCard } from "./ScreenCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

interface PublicScreensListProps {
  onEdit: (screen: PublicScreen) => void;
  onDelete: (screenName: string) => void;
}

export function PublicScreensList({ onEdit, onDelete }: PublicScreensListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  
  const screens = publicScreensStore.list();

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
    publicScreensStore.update(screen.id, { active: !screen.active });
    // Force re-render by updating key
    setSearchTerm(prev => prev);
  };

  const handleDelete = (screen: PublicScreen) => {
    publicScreensStore.remove(screen.id);
    onDelete(screen.name);
    // Force re-render
    setSearchTerm(prev => prev);
  };

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
            <SelectItem value="PAYMENT_MATRIX">Betaalstatus</SelectItem>
            <SelectItem value="ANNOUNCEMENTS">Mededelingen</SelectItem>
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
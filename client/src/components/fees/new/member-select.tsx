import { useState, useMemo } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface MemberSelectProps {
  value?: string;
  onChange: (memberId: string) => void;
  error?: string;
  members?: any[];
}

export function MemberSelect({ value, onChange, error, members = [] }: MemberSelectProps) {
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const selectedMember = value ? members.find((m: any) => m.id === value) : null;
  
  // Filter members based on input
  const filteredMembers = useMemo(() => {
    if (!inputValue.trim()) return members;
    
    const searchTerm = inputValue.toLowerCase();
    return members.filter((member: any) => 
      member.firstName.toLowerCase().includes(searchTerm) ||
      member.lastName.toLowerCase().includes(searchTerm) ||
      member.memberNumber.includes(searchTerm) ||
      `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchTerm) ||
      `${member.lastName}, ${member.firstName}`.toLowerCase().includes(searchTerm)
    );
  }, [inputValue, members]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setShowSuggestions(newValue.length > 0);
    
    // Clear selection if input is changed
    if (selectedMember && newValue !== `${selectedMember.lastName}, ${selectedMember.firstName}`) {
      onChange("");
    }
  };

  const handleMemberSelect = (member: any) => {
    onChange(member.id);
    setInputValue(`${member.lastName}, ${member.firstName}`);
    setShowSuggestions(false);
  };

  const handleClearSelection = () => {
    onChange("");
    setInputValue("");
    setShowSuggestions(false);
  };

  const displayValue = selectedMember 
    ? `${selectedMember.lastName}, ${selectedMember.firstName}`
    : inputValue;

  return (
    <div className="space-y-2 relative">
      <div className="relative">
        <Input
          value={displayValue}
          onChange={handleInputChange}
          onFocus={() => setShowSuggestions(inputValue.length > 0 || !selectedMember)}
          onBlur={() => {
            // Delay hiding suggestions to allow for clicks
            setTimeout(() => setShowSuggestions(false), 200);
          }}
          placeholder="Typ een naam of lidnummer..."
          className={cn(
            "w-full h-10 border-gray-200 pr-8",
            error && "border-red-500"
          )}
          data-testid="member-select"
        />
        {selectedMember && (
          <button
            type="button"
            onClick={handleClearSelection}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && !selectedMember && filteredMembers.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {filteredMembers.slice(0, 10).map((member) => (
            <div
              key={member.id}
              onClick={() => handleMemberSelect(member)}
              className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
            >
              <div className="flex flex-col">
                <span className="font-medium">
                  {member.lastName}, {member.firstName}
                </span>
                <span className="text-xs text-gray-500">
                  #{member.memberNumber} • {member.category}
                </span>
              </div>
              <Badge 
                variant={member.hasMandate ? "default" : "secondary"}
                className={cn(
                  "text-xs",
                  member.hasMandate 
                    ? "bg-green-100 text-green-800 border-green-200" 
                    : "bg-gray-100 text-gray-600 border-gray-200"
                )}
              >
                {member.hasMandate ? "MANDAAT" : "GEEN MANDAAT"}
              </Badge>
            </div>
          ))}
          {filteredMembers.length > 10 && (
            <div className="p-2 text-xs text-gray-500 text-center border-t">
              {filteredMembers.length - 10} meer resultaten... typ verder om te filteren
            </div>
          )}
        </div>
      )}

      {showSuggestions && !selectedMember && filteredMembers.length === 0 && inputValue.trim() && (
        <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <div className="text-sm text-gray-500 text-center">
            Geen leden gevonden voor "{inputValue}"
          </div>
        </div>
      )}
      
      {selectedMember && (
        <div className="flex items-center gap-2 mt-2">
          <Badge 
            variant={selectedMember.hasMandate ? "default" : "secondary"}
            className={cn(
              "text-xs",
              selectedMember.hasMandate 
                ? "bg-green-100 text-green-800 border-green-200" 
                : "bg-gray-100 text-gray-600 border-gray-200"
            )}
          >
            {selectedMember.hasMandate ? "SEPA mandaat: JA" : "SEPA mandaat: NEE"}
          </Badge>
          <span className="text-sm text-gray-600">
            Categorie: {selectedMember.category}
          </span>
        </div>
      )}
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
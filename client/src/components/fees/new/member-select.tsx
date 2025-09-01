import { useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { membersLite, type MemberLite } from "../../../../../lib/mock/members-lite";

interface MemberSelectProps {
  value?: string;
  onChange: (memberId: string) => void;
  error?: string;
}

export function MemberSelect({ value, onChange, error }: MemberSelectProps) {
  const [open, setOpen] = useState(false);
  
  const selectedMember = value ? membersLite.find(m => m.id === value) : null;
  
  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between h-10 border-gray-200",
              error && "border-red-500",
              !selectedMember && "text-muted-foreground"
            )}
            data-testid="member-select"
          >
            {selectedMember ? (
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="truncate">
                  {selectedMember.lastName}, {selectedMember.firstName}
                </span>
                <span className="text-xs text-gray-500 font-mono">
                  #{selectedMember.memberNumber}
                </span>
              </div>
            ) : (
              "Selecteer een lid..."
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput 
              placeholder="Zoek op naam, e-mail of lidnummer..." 
              className="h-9"
            />
            <CommandEmpty>Geen leden gevonden.</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-y-auto">
              {membersLite.map((member) => (
                <CommandItem
                  key={member.id}
                  value={`${member.firstName} ${member.lastName} ${member.memberNumber}`}
                  onSelect={() => {
                    onChange(member.id);
                    setOpen(false);
                  }}
                  className="flex items-center justify-between p-2"
                >
                  <div className="flex items-center gap-2">
                    <Check
                      className={cn(
                        "h-4 w-4",
                        selectedMember?.id === member.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {member.lastName}, {member.firstName}
                      </span>
                      <span className="text-xs text-gray-500">
                        #{member.memberNumber} • {member.category}
                      </span>
                    </div>
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
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      
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
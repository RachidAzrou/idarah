import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  BarChart3, 
  Monitor, 
  Settings, 
  Search,
  User,
  Euro
} from "lucide-react";

interface CommandItem {
  id: string;
  title: string;
  description?: string;
  href: string;
  icon: React.ComponentType<any>;
  group: string;
}

const commands: CommandItem[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    description: "Overzicht van uw organisatie",
    href: "/dashboard",
    icon: LayoutDashboard,
    group: "Navigatie"
  },
  {
    id: "leden",
    title: "Leden",
    description: "Beheer leden en hun gegevens",
    href: "/leden",
    icon: Users,
    group: "Navigatie"
  },
  {
    id: "lidgelden",
    title: "Lidgelden",
    description: "Beheer lidgelden en betalingen",
    href: "/lidgelden",
    icon: CreditCard,
    group: "Navigatie"
  },
  {
    id: "financien",
    title: "Financiën",
    description: "Overzicht van inkomsten en uitgaven",
    href: "/financien",
    icon: BarChart3,
    group: "Navigatie"
  },
  {
    id: "publieke-schermen",
    title: "Publieke Schermen",
    description: "Beheer publieke displays",
    href: "/publieke-schermen",
    icon: Monitor,
    group: "Navigatie"
  },
  {
    id: "instellingen",
    title: "Instellingen",
    description: "Organisatie en systeem instellingen",
    href: "/instellingen",
    icon: Settings,
    group: "Navigatie"
  },
  // Quick actions
  {
    id: "nieuwe-lid",
    title: "Nieuw Lid Toevoegen",
    description: "Voeg een nieuw lid toe aan de organisatie",
    href: "/leden?action=new",
    icon: User,
    group: "Acties"
  },
  {
    id: "lidgeld-genereren",
    title: "Lidgeld Genereren",
    description: "Genereer lidgelden voor een periode",
    href: "/lidgelden?action=generate",
    icon: Euro,
    group: "Acties"
  }
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = (href: string) => {
    setOpen(false);
    setLocation(href);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Zoek alles..." />
      <CommandList>
        <CommandEmpty>Geen resultaten gevonden.</CommandEmpty>
        
        {["Navigatie", "Acties"].map((group) => {
          const groupCommands = commands.filter(cmd => cmd.group === group);
          if (groupCommands.length === 0) return null;
          
          return (
            <CommandGroup key={group} heading={group}>
              {groupCommands.map((command) => {
                const Icon = command.icon;
                return (
                  <CommandItem
                    key={command.id}
                    value={`${command.title} ${command.description}`}
                    onSelect={() => handleSelect(command.href)}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-col">
                      <span className="font-medium">{command.title}</span>
                      {command.description && (
                        <span className="text-xs text-muted-foreground">
                          {command.description}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          );
        })}
      </CommandList>
    </CommandDialog>
  );
}
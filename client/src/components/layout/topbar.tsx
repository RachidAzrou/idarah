import { Search, Menu, Command, HelpCircle } from "lucide-react";
import { LuBellRing } from "react-icons/lu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { getUserInitials } from "@/lib/auth";
import { cn } from "@/lib/utils";

export default function Topbar() {
  const { user } = useAuth();

  return (
    <header className="topbar lg:pl-64">
      {/* Mobile menu button */}
      <Button variant="ghost" size="sm" className="-m-2.5 p-2.5 text-foreground lg:hidden focus-ring" data-testid="mobile-menu-button">
        <Menu className="h-5 w-5" />
        <span className="sr-only">Open sidebar</span>
      </Button>

      {/* Search */}
      <div className="flex flex-1 justify-center">
        <div className="relative w-full max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          <Input
            id="search-field"
            className={cn(
              "w-full pl-10 pr-16 h-9 bg-muted/50 border-0 focus-visible:bg-background",
              "placeholder:text-muted-foreground text-sm"
            )}
            placeholder="Zoek alles... (⌘K)"
            type="search"
            name="search"
            data-testid="search-input"
          />
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <kbd className="hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 sm:flex">
              <Command className="h-3 w-3" />K
            </kbd>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-x-3">
        {/* Help */}
        <Button variant="ghost" size="sm" className="h-9 w-9 focus-ring" data-testid="help-button">
          <HelpCircle className="h-4 w-4" />
          <span className="sr-only">Help</span>
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="sm" className="relative h-9 w-9 focus-ring" data-testid="notifications-button">
          <LuBellRing className="h-4 w-4" />
          <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 text-xs flex items-center justify-center p-0 border-2 border-background" data-testid="notification-count">
            3
          </Badge>
          <span className="sr-only">View notifications</span>
        </Button>

        {/* Profile dropdown */}
        {user && (
          <div className="relative">
            <Button variant="ghost" size="sm" className="h-9 w-9 focus-ring" data-testid="profile-button">
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-primary-foreground">
                  {getUserInitials(user.name)}
                </span>
              </div>
              <span className="sr-only">Open user menu</span>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}

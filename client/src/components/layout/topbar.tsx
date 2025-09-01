import { Search, Bell, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { getUserInitials } from "@/lib/auth";

export default function Topbar() {
  const { user } = useAuth();

  return (
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      {/* Mobile menu button */}
      <Button variant="ghost" size="sm" className="-m-2.5 p-2.5 text-gray-700 lg:hidden" data-testid="mobile-menu-button">
        <Menu className="h-6 w-6" />
      </Button>

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        {/* Search */}
        <div className="relative flex flex-1 max-w-lg">
          <Search className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-gray-400 ml-3" />
          <Input 
            id="search-field"
            className="block h-full w-full border-0 py-0 pl-10 pr-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm bg-transparent"
            placeholder="Zoek leden, lidgelden..."
            type="search"
            name="search"
            data-testid="search-input"
          />
        </div>

        <div className="flex items-center gap-x-4 lg:gap-x-6">
          {/* Notifications */}
          <Button variant="ghost" size="sm" className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500 relative" data-testid="notifications-button">
            <Bell className="h-6 w-6" />
            <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 text-xs flex items-center justify-center p-0" data-testid="notification-count">
              3
            </Badge>
          </Button>

          {/* Profile dropdown */}
          {user && (
            <div className="relative">
              <Button variant="ghost" size="sm" className="-m-1.5 flex items-center p-1.5" data-testid="profile-button">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-primary-foreground">
                    {getUserInitials(user.name)}
                  </span>
                </div>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

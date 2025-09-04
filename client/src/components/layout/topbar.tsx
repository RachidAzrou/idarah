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
    <header className="glass-card border-0 rounded-none bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200/50 sticky top-0 z-50 lg:pl-64">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Left side - Mobile menu and Logo */}
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-10 w-10 text-gray-600 hover:text-gray-900 hover:bg-gray-100 lg:hidden transition-colors" 
            data-testid="mobile-menu-button"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open sidebar</span>
          </Button>
          
          {/* Brand/Logo area for mobile */}
          <div className="lg:hidden">
            <h1 className="text-lg font-semibold text-gray-900">Ledenbeheer</h1>
          </div>
        </div>

        {/* Center - Search */}
        <div className="flex flex-1 justify-center max-w-lg mx-4">
          <div className="relative w-full">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              id="search-field"
              className={cn(
                "w-full pl-10 pr-16 h-10 bg-white/60 border border-gray-200",
                "focus:border-blue-300 focus:ring-2 focus:ring-blue-500/20",
                "placeholder:text-gray-500 text-sm rounded-lg",
                "hover:border-gray-300 transition-all duration-200"
              )}
              placeholder="Zoek leden, transacties... (⌘K)"
              type="search"
              name="search"
              data-testid="search-input"
            />
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <kbd className="hidden h-6 select-none items-center gap-1 rounded-md border border-gray-200 bg-gray-50 px-2 font-mono text-[11px] font-medium text-gray-500 opacity-100 sm:flex">
                <Command className="h-3 w-3" />K
              </kbd>
            </div>
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          {/* Help */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-10 w-10 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors" 
            data-testid="help-button"
          >
            <HelpCircle className="h-4 w-4" />
            <span className="sr-only">Help</span>
          </Button>

          {/* Notifications */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="relative h-10 w-10 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors" 
            data-testid="notifications-button"
          >
            <LuBellRing className="h-4 w-4" />
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 text-xs flex items-center justify-center p-0 border-2 border-white shadow-sm" 
              data-testid="notification-count"
            >
              3
            </Badge>
            <span className="sr-only">View notifications</span>
          </Button>

          {/* Profile dropdown */}
          {user && (
            <div className="relative ml-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-10 px-3 text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2" 
                data-testid="profile-button"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm">
                  <span className="text-sm font-medium text-white">
                    {getUserInitials(user.name)}
                  </span>
                </div>
                <div className="hidden sm:flex flex-col items-start text-left">
                  <span className="text-sm font-medium text-gray-900 leading-none">
                    {user.name}
                  </span>
                  <span className="text-xs text-gray-500 leading-none mt-0.5">
                    {user.role}
                  </span>
                </div>
                <span className="sr-only">Open user menu</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

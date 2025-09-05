import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  BarChart3, 
  Monitor, 
  Settings,
  Building2,
  IdCard,
  Mail,
  Menu,
  X,
  LogOut,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import darahLogo from "@assets/idarah (1)_1757094079436.png";
import { getUserInitials } from "@/lib/auth";
import { useAuth } from "@/hooks/use-auth";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Leden", href: "/leden", icon: Users },
  { name: "Lidkaarten", href: "/lidkaarten", icon: IdCard },
  { name: "Lidgelden", href: "/lidgelden", icon: CreditCard },
  { name: "Financiën", href: "/financien", icon: BarChart3 },
  { name: "Mijn Bestuur", href: "/bestuur", icon: Building2 },
  { name: "Berichten", href: "/berichten", icon: Mail },
  { name: "Publieke Schermen", href: "/publieke-schermen", icon: Monitor },
  { name: "Instellingen", href: "/instellingen", icon: Settings },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const sidebarContent = (
    <div className="flex grow flex-col gap-y-2 overflow-y-auto bg-sidebar border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex h-28 shrink-0 items-center justify-center px-4 pt-4" data-testid="logo">
        <Link href="/dashboard" className="flex items-center justify-center w-full">
          <img 
            src={darahLogo} 
            alt="DARAH Logo" 
            className="w-52 h-12 sm:w-56 sm:h-13 lg:w-60 lg:h-14 object-contain scale-[3]"
          />
        </Link>
      </div>

      {/* User Section */}
      {user && (
        <div className="border-b border-sidebar-border px-6 pb-4">
          <Link href="/profiel" className="flex items-center gap-x-3 px-2 py-2 rounded-xl hover:bg-sidebar-accent transition-all duration-300 ease-out">
            <div className="h-8 w-8 bg-sidebar-primary text-sidebar-primary-foreground rounded-full flex items-center justify-center text-sm font-medium" data-testid="user-avatar">
              {getUserInitials(user.name)}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="text-sm font-medium text-sidebar-foreground" data-testid="user-name">{user.name}</p>
              <p className="text-xs text-blue-600 font-medium" data-testid="user-role">{user.role}</p>
            </div>
          </Link>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex flex-1 flex-col px-6">
        <ul role="list" className="flex flex-1 flex-col gap-y-2">
          <li>
            <ul role="list" className="space-y-1">
              {navigation.map((item) => {
                const isActive = location === item.href || (item.href !== "/dashboard" && location.startsWith(item.href));
                const Icon = item.icon;
                
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        "group relative flex gap-x-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 ease-out focus-ring",
                        isActive
                          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-blue-500/20 scale-105 border border-blue-400/30"
                          : "text-sidebar-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent hover:shadow-md hover:scale-102 hover:-translate-y-0.5"
                      )}
                      data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                      )}
                      <Icon className={cn("h-5 w-5 shrink-0", isActive ? "text-sidebar-primary-foreground" : "")} />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </li>
        </ul>
      </nav>

      {/* Logout Button */}
      {user && (
        <div className="mt-auto border-t border-sidebar-border p-6">
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-x-3 px-4 py-3 text-sm font-medium text-white hover:text-white hover:bg-red-50"
            onClick={logout}
            data-testid="logout-button"
          >
            <LogOut className="h-5 w-5" />
            Uitloggen
          </Button>
        </div>
      )}

    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        {sidebarContent}
      </aside>

      {/* Mobile Header */}
      <div className="sticky top-0 z-40 flex items-center gap-x-6 bg-sidebar px-4 py-4 shadow-sm sm:px-6 lg:hidden">
        <Button
          variant="ghost"
          size="sm"
          className="-m-2.5 p-2.5"
          onClick={() => setMobileMenuOpen(true)}
          data-testid="mobile-menu-toggle"
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Menu openen</span>
        </Button>
        <div className="flex-1 text-sm font-semibold leading-6 text-sidebar-foreground">
          <Link href="/dashboard">
            <img 
              src={darahLogo} 
              alt="DARAH Logo" 
              className="h-8 object-contain"
            />
          </Link>
        </div>
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full">
                <div className="h-8 w-8 bg-sidebar-primary text-sidebar-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                  {getUserInitials(user.name)}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profiel</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Uitloggen</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div className="relative z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/25" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed inset-0 flex">
            <div className="relative mr-16 flex w-full max-w-xs flex-1">
              <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="-m-2.5 p-2.5"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <X className="h-6 w-6 text-white" />
                  <span className="sr-only">Menu sluiten</span>
                </Button>
              </div>
              {sidebarContent}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
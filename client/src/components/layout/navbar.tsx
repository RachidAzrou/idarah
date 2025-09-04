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
  Search,
  Bell,
  Command,
  HelpCircle,
  Menu,
  ChevronDown,
  IdCard,
  User,
  Crown,
  Mail
} from "lucide-react";
import { RiMoneyEuroCircleLine, RiUserStarLine } from "react-icons/ri";
import { PiHandCoinsFill } from "react-icons/pi";
import darahLogo from "@assets/DARAH_1756909309495.png";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getUserInitials } from "@/lib/auth";
import { useAuth } from "@/hooks/use-auth";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Leden", href: "/leden", icon: Users },
  { name: "Lidkaarten", href: "/lidkaarten", icon: IdCard },
  { name: "Lidgelden", href: "/lidgelden", icon: PiHandCoinsFill },
  { name: "Financiën", href: "/financien", icon: RiMoneyEuroCircleLine },
  { name: "Berichten", href: "/berichten", icon: Mail },
  { name: "Mijn Bestuur", href: "/bestuur", icon: RiUserStarLine },
  { name: "Publieke Schermen", href: "/publieke-schermen", icon: Monitor },
  { name: "Instellingen", href: "/instellingen", icon: Settings },
];

export default function Navbar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-sidebar-border bg-sidebar backdrop-blur supports-[backdrop-filter]:bg-sidebar/95">
      <div className="w-full flex h-12 items-center px-4 sm:px-6 lg:px-8">
        {/* Logo - helemaal links */}
        <div className="flex items-center">
          <Link href="/dashboard" className="flex items-center space-x-3">
            <img 
              src={darahLogo} 
              alt="DARAH Logo" 
              className="w-20 h-5 xs:w-24 xs:h-6 sm:w-28 sm:h-7 md:w-32 md:h-8 object-contain"
            />
          </Link>
        </div>

        {/* Navigation - in het midden */}
        <div className="flex-1 flex justify-center">
          <nav className="hidden md:flex items-center space-x-4">
            {navigation.map((item) => {
              const isActive = location === item.href || (item.href !== "/dashboard" && location.startsWith(item.href));
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-x-1 px-2 py-1.5 text-sm font-medium rounded-md transition-all duration-200",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                      : "text-sidebar-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent"
                  )}
                  data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Mobile Menu - alleen op mobiel */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="md:hidden h-9 w-9 text-sidebar-foreground hover:bg-sidebar-accent focus-ring" data-testid="mobile-menu-button">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open navigation menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <DropdownMenuItem key={item.name} asChild>
                    <Link href={item.href} className="flex items-center gap-x-2">
                      <Icon className="h-4 w-4" />
                      {item.name}
                    </Link>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Profiel - helemaal rechts */}
        <div className="flex items-center">
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center gap-x-3 h-9 px-3 text-sidebar-foreground hover:bg-sidebar-accent focus-ring" data-testid="profile-button">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-primary-foreground">
                      {getUserInitials(user.name)}
                    </span>
                  </div>
                  <div className="hidden sm:flex flex-col items-start">
                    <span className="text-sm font-medium text-sidebar-foreground">{user.name}</span>
                    <span className="text-xs text-sidebar-foreground/70">{user.role}</span>
                  </div>
                  <span className="sr-only">Open user menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/profiel" className="flex items-center gap-x-2" data-testid="profile-link">
                    <User className="h-4 w-4" />
                    Mijn Profiel
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout} data-testid="logout-button">
                  Uitloggen
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
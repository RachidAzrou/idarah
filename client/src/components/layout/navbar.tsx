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
  { name: "Mijn Bestuur", href: "/bestuur", icon: RiUserStarLine },
  { name: "Berichten", href: "/berichten", icon: Mail },
  { name: "Publieke Schermen", href: "/publieke-schermen", icon: Monitor },
  { name: "Instellingen", href: "/instellingen", icon: Settings },
];

export default function Navbar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-sidebar-border bg-sidebar backdrop-blur supports-[backdrop-filter]:bg-sidebar/95">
      <div className="w-full flex h-12 items-center pl-0 pr-4 sm:pr-6 lg:pr-8">
        {/* Logo - helemaal links */}
        <div className="flex items-center">
          <Link href="/dashboard" className="flex items-center">
            <img 
              src={darahLogo} 
              alt="DARAH Logo" 
              className="w-56 h-14 xs:w-60 xs:h-15 sm:w-64 sm:h-16 md:w-72 md:h-18 lg:w-80 lg:h-20 object-contain object-left ml-4"
            />
          </Link>
        </div>

        {/* Navigation - perfect gecentreerd */}
        <div className="flex-1 flex justify-center overflow-x-auto">
          <nav className="hidden lg:flex items-center space-x-2 xl:space-x-3">
            {navigation.map((item) => {
              const isActive = location === item.href || (item.href !== "/dashboard" && location.startsWith(item.href));
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-x-1.5 px-2.5 py-2 text-xs xl:text-sm font-medium rounded-xl transition-all duration-300 ease-out whitespace-nowrap",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-blue-500/20 scale-105"
                      : "text-sidebar-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent hover:shadow-md hover:scale-102 hover:-translate-y-0.5"
                  )}
                  data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <Icon className="h-3 w-3 xl:h-3.5 xl:w-3.5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Mobile Menu - alleen op mobiel */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="lg:hidden h-9 w-9 text-sidebar-foreground hover:bg-sidebar-accent focus-ring" data-testid="mobile-menu-button">
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

        {/* Profiel - helemaal rechts met gelijke ruimte */}
        <div className="flex items-center">
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center gap-x-3 h-11 px-4 text-sidebar-foreground hover:bg-sidebar-accent focus-ring rounded-xl transition-all duration-300 ease-out hover:shadow-md hover:scale-102" data-testid="profile-button">
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg ring-2 ring-blue-400/20">
                    <span className="text-sm font-semibold text-white">
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
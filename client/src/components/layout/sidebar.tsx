import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  BarChart3, 
  Monitor, 
  Settings,
  Building2
} from "lucide-react";
import { getUserInitials } from "@/lib/auth";
import { useAuth } from "@/hooks/use-auth";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Leden", href: "/leden", icon: Users },
  { name: "Lidgelden", href: "/lidgelden", icon: CreditCard },
  { name: "Financiën", href: "/financien", icon: BarChart3 },
  { name: "Publieke Schermen", href: "/publieke-schermen", icon: Monitor },
  { name: "Instellingen", href: "/instellingen", icon: Settings },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  return (
    <aside className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col sidebar">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto px-6 pb-4">
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center" data-testid="logo">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-sidebar-foreground">Ledenbeheer</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col">
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
                          "group relative flex gap-x-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 focus-ring",
                          isActive
                            ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                            : "text-sidebar-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent"
                        )}
                        data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
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

        {/* User Profile */}
        {user && (
          <div className="mt-auto pt-4 border-t border-sidebar-border">
            <div className="flex items-center space-x-3 px-3 py-3 rounded-lg hover:bg-sidebar-accent cursor-pointer transition-colors duration-200" data-testid="user-profile">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-primary-foreground">
                  {getUserInitials(user.name)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate" data-testid="user-name">{user.name}</p>
                <p className="text-xs text-sidebar-foreground/70" data-testid="user-role">{user.role}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

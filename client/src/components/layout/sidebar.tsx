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
  Mail
} from "lucide-react";
import darahLogo from "@assets/DARAH_1756909309495.png";
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
  const { user } = useAuth();

  return (
    <aside className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col sidebar">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto px-6 pb-4">
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center" data-testid="logo">
          <div className="flex items-center space-x-3">
            <img 
              src={darahLogo} 
              alt="DARAH Logo" 
              className="w-32 h-8 sm:w-36 sm:h-9 lg:w-40 lg:h-10 object-contain"
            />
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
                          "group relative flex gap-x-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 ease-out focus-ring",
                          isActive
                            ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-blue-500/20 scale-105 border border-blue-400/30"
                            : "text-sidebar-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent hover:shadow-md hover:scale-102 hover:-translate-y-0.5"
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
            <div className="flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-sidebar-accent cursor-pointer transition-all duration-300 ease-out hover:shadow-md hover:scale-102 hover:-translate-y-0.5" data-testid="user-profile">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg ring-2 ring-blue-400/20">
                <span className="text-sm font-semibold text-white">
                  {getUserInitials(user.name)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-sidebar-foreground truncate" data-testid="user-name">{user.name}</p>
                <p className="text-xs text-sidebar-foreground/70 font-medium" data-testid="user-role">{user.role}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

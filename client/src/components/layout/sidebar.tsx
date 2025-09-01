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
    <aside className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-60 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4 shadow-lg">
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center" data-testid="logo">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-2xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-gray-900">Ledenbeheer</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {navigation.map((item) => {
                  const isActive = location === item.href || (item.href !== "/dashboard" && location.startsWith(item.href));
                  const Icon = item.icon;
                  
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={cn(
                          "group flex gap-x-3 rounded-2xl p-3 text-sm leading-6 font-medium transition-colors",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-gray-700 hover:text-primary hover:bg-gray-50"
                        )}
                        data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
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
          <div className="mt-auto pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-3 px-3 py-2 rounded-2xl hover:bg-gray-50 cursor-pointer" data-testid="user-profile">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-primary-foreground">
                  {getUserInitials(user.name)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900" data-testid="user-name">{user.name}</p>
                <p className="text-xs text-gray-500" data-testid="user-role">{user.role}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

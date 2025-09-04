import { useQuery } from "@tanstack/react-query";
import { Users, UserCheck, Euro, Clock, TrendingUp, TrendingDown, Vote } from "lucide-react";
import { HiInboxArrowDown } from "react-icons/hi2";
import { Skeleton } from "@/components/ui/skeleton";

interface KpiCardProps {
  title: string;
  value: string;
  delta: {
    value: string;
    positive: boolean;
  };
  icon: React.ReactNode;
  iconBgColor: string;
  deltaColor?: string;
}

function KpiCard({ title, value, delta, icon, iconBgColor, deltaColor }: KpiCardProps) {
  return (
    <div className="glass-card rounded-2xl p-6 card-hover animate-fade-in group relative overflow-hidden">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <div className="flex items-center justify-between relative z-10">
        <div className="flex-1">
          <p className="text-sm font-semibold text-muted-foreground mb-2 tracking-wide">{title}</p>
          <p className="text-3xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors duration-300 tabular-nums">{value}</p>
          <div className="flex items-center space-x-2">
            {delta.positive ? (
              <TrendingUp className="h-4 w-4 text-green-600 group-hover:scale-110 transition-transform duration-300" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500 group-hover:scale-110 transition-transform duration-300" />
            )}
            <span className={`text-sm font-semibold ${deltaColor || (delta.positive ? 'text-green-600' : 'text-red-500')} group-hover:text-opacity-80 transition-all duration-300`}>
              {delta.value}
            </span>
          </div>
        </div>
        <div className={`w-14 h-14 ${iconBgColor} rounded-2xl flex items-center justify-center shadow-xl ring-4 ring-white/20 group-hover:scale-110 group-hover:shadow-2xl transition-all duration-300 relative`}>
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl"></div>
          <div className="relative">{icon}</div>
        </div>
      </div>
    </div>
  );
}

export default function ModernKpiCards() {
  const { data: stats, isLoading, isFetching } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    staleTime: 5000, // 5 seconds for dashboard stats
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Altijd KPI data tonen, ook zonder stats
  const kpiData = [
    {
      title: "Totaal Leden",
      value: isLoading ? "..." : ((stats as any)?.totalMembers?.toString() || "0"),
      delta: { value: "Totaal aantal leden", positive: true },
      icon: <Users className="h-4 w-4 text-blue-600" />,
      iconBgColor: "bg-blue-50"
    },
    {
      title: "Actieve Leden", 
      value: isLoading ? "..." : ((stats as any)?.activeMembers?.toString() || "0"),
      delta: { value: "Actieve leden", positive: true },
      icon: <UserCheck className="h-4 w-4 text-green-600" />,
      iconBgColor: "bg-green-50",
      deltaColor: "text-green-600"
    },
    {
      title: "Stemgerechtigden",
      value: isLoading ? "..." : ((stats as any)?.activeMembers?.toString() || "0"),
      delta: { value: "Van actieve leden", positive: true },
      icon: <Vote className="h-4 w-4 text-amber-500" />,
      iconBgColor: "bg-amber-50",
      deltaColor: "text-amber-500"
    },
    {
      title: "Openstaande Betalingen",
      value: isLoading ? "..." : `€${(((stats as any)?.outstanding || 0)).toFixed(2)}`,
      delta: { value: "Te betalen bedragen", positive: false },
      icon: <Clock className="h-4 w-4 text-orange-500" />,
      iconBgColor: "bg-orange-50"
    },
    {
      title: "Inkomsten Deze Maand",
      value: isLoading ? "..." : `€${(((stats as any)?.monthlyIncome || 0)).toFixed(2)}`,
      delta: { value: "Deze maand", positive: true },
      icon: <HiInboxArrowDown className="h-4 w-4 text-blue-600" />,
      iconBgColor: "bg-blue-50"
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-6">
      {kpiData.map((kpi, index) => (
        <KpiCard
          key={index}
          title={kpi.title}
          value={kpi.value}
          delta={kpi.delta}
          icon={kpi.icon}
          iconBgColor={kpi.iconBgColor}
          deltaColor={kpi.deltaColor}
        />
      ))}
    </div>
  );
}
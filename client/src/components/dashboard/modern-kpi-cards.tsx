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
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-500 mb-1">{title}</p>
          <p className="text-lg font-bold text-gray-900 mb-1">{value}</p>
          <div className="flex items-center space-x-1">
            {delta.positive ? (
              <TrendingUp className="h-3 w-3 text-blue-600" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500" />
            )}
            <span className={`text-xs font-medium ${deltaColor || (delta.positive ? 'text-blue-600' : 'text-red-500')}`}>
              {delta.value}
            </span>
          </div>
        </div>
        <div className={`w-8 h-8 ${iconBgColor} rounded-full flex items-center justify-center`}>
          {icon}
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
      value: isLoading ? "..." : `€${(((stats as any)?.openPayments || 0)).toFixed(2)}`,
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
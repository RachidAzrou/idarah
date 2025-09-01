import { useQuery } from "@tanstack/react-query";
import { Users, UserCheck, Euro, Clock, TrendingUp, TrendingDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface KpiCardProps {
  title: string;
  value: string;
  delta: {
    value: string;
    positive: boolean;
  };
  icon: React.ReactNode;
}

function KpiCard({ title, value, delta, icon }: KpiCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mb-2">{value}</p>
          <div className="flex items-center space-x-1">
            {delta.positive ? (
              <TrendingUp className="h-3 w-3 text-blue-600" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500" />
            )}
            <span className={`text-sm font-medium ${delta.positive ? 'text-blue-600' : 'text-red-500'}`}>
              {delta.value}
            </span>
          </div>
        </div>
        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function ModernKpiCards() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4 mb-6">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
    );
  }

  // Mock data voor alle KPI cards
  const kpiData = [
    {
      title: "Actieve Leden",
      value: "1.089",
      delta: { value: "+2,1% vs vorige maand", positive: true },
      icon: <Users className="h-6 w-6 text-blue-600" />
    },
    {
      title: "Nieuwe Leden",
      value: "47",
      delta: { value: "+12% deze maand", positive: true },
      icon: <UserCheck className="h-6 w-6 text-blue-600" />
    },
    {
      title: "Totaal Inkomsten",
      value: "€18.420",
      delta: { value: "+8,3% vs vorige maand", positive: true },
      icon: <Euro className="h-6 w-6 text-blue-600" />
    },
    {
      title: "Betaalde Facturen",
      value: "91,6%",
      delta: { value: "+2,1% vs vorige maand", positive: true },
      icon: <Clock className="h-6 w-6 text-blue-600" />
    },
    {
      title: "Openstaand",
      value: "€1.250",
      delta: { value: "-15% vs vorige maand", positive: true },
      icon: <Clock className="h-6 w-6 text-blue-600" />
    },
    {
      title: "Vervallen",
      value: "€320",
      delta: { value: "-5,2% vs vorige maand", positive: true },
      icon: <TrendingDown className="h-6 w-6 text-blue-600" />
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4 mb-6">
      {kpiData.map((kpi, index) => (
        <KpiCard
          key={index}
          title={kpi.title}
          value={kpi.value}
          delta={kpi.delta}
          icon={kpi.icon}
        />
      ))}
    </div>
  );
}
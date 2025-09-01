import { useQuery } from "@tanstack/react-query";
import { StatsCard } from "@/components/ui/stats-card";
import { Users, UserCheck, Euro, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function KpiCards() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="text-center py-8 text-gray-500" data-testid="stats-error">
          Fout bij het laden van statistieken
        </div>
      </div>
    );
  }

  const activePercentage = stats.totalMembers > 0 ? ((stats.activeMembers / stats.totalMembers) * 100).toFixed(1) : "0";

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
      <StatsCard
        title="Totaal Leden"
        value={stats.totalMembers.toLocaleString("nl-BE")}
        trend={{ value: "+12% deze maand", positive: true }}
        icon={<Users className="h-5 w-5 text-blue-600" />}
        iconBgColor="bg-blue-100"
      />

      <StatsCard
        title="Actieve Leden"
        value={stats.activeMembers.toLocaleString("nl-BE")}
        trend={{ value: `${activePercentage}% van totaal`, positive: true }}
        icon={<UserCheck className="h-5 w-5 text-green-600" />}
        iconBgColor="bg-green-100"
      />

      <StatsCard
        title="Totaal Ontvangen"
        value={`€${stats.totalRevenue.toLocaleString("nl-BE")}`}
        trend={{ value: "+8% deze maand", positive: true }}
        icon={<Euro className="h-5 w-5 text-emerald-600" />}
        iconBgColor="bg-emerald-100"
      />

      <StatsCard
        title="Openstaand"
        value={`€${stats.outstanding.toLocaleString("nl-BE")}`}
        trend={{ value: "-3% deze maand", positive: true }}
        icon={<Clock className="h-5 w-5 text-orange-600" />}
        iconBgColor="bg-orange-100"
      />
    </div>
  );
}

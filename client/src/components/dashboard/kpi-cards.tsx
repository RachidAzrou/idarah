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

  const mockStats = stats || {
    totalMembers: 0,
    activeMembers: 0,
    totalRevenue: 0,
    outstanding: 0
  };

  const activePercentage = mockStats.totalMembers > 0 ? ((mockStats.activeMembers / mockStats.totalMembers) * 100).toFixed(1) : "0";

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
      <StatsCard
        title="Totaal Leden"
        value={mockStats.totalMembers.toLocaleString("nl-BE")}
        trend={{ value: "+12% deze maand", positive: true }}
        icon={<Users className="h-5 w-5 text-secondary" />}
        iconBgColor="bg-secondary/10"
      />

      <StatsCard
        title="Actieve Leden"
        value={mockStats.activeMembers.toLocaleString("nl-BE")}
        trend={{ value: `${activePercentage}% van totaal`, positive: true }}
        icon={<UserCheck className="h-5 w-5 text-primary" />}
        iconBgColor="bg-primary/10"
      />

      <StatsCard
        title="Totaal Ontvangen"
        value={`€${mockStats.totalRevenue.toLocaleString("nl-BE")}`}
        trend={{ value: "+8% deze maand", positive: true }}
        icon={<Euro className="h-5 w-5 text-success" />}
        iconBgColor="bg-success/10"
      />

      <StatsCard
        title="Openstaand"
        value={`€${mockStats.outstanding.toLocaleString("nl-BE")}`}
        trend={{ value: "-3% deze maand", positive: true }}
        icon={<Clock className="h-5 w-5 text-warning" />}
        iconBgColor="bg-warning/10"
      />
    </div>
  );
}

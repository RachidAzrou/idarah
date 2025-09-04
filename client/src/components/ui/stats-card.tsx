import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  trend?: {
    value: string;
    positive: boolean;
  };
  icon: React.ReactNode;
  iconBgColor?: string;
  className?: string;
}

export function StatsCard({
  title,
  value,
  trend,
  icon,
  iconBgColor = "bg-blue-100",
  className,
}: StatsCardProps) {
  return (
    <Card className={cn("glass-card card-hover animate-fade-in group overflow-hidden", className)} data-testid={`stats-card-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardContent className="px-6 py-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ring-2 ring-white/10 group-hover:scale-110 transition-transform duration-300", iconBgColor)}>
              {icon}
            </div>
          </div>
          <div className="ml-4 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-muted-foreground truncate" data-testid="stats-title">{title}</dt>
              <dd className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors duration-300" data-testid="stats-value">{value}</dd>
            </dl>
          </div>
        </div>
        {trend && (
          <div className="mt-4">
            <div className={cn(
              "flex items-center text-sm font-medium",
              trend.positive ? "text-green-600" : "text-red-600"
            )} data-testid="stats-trend">
              {trend.positive ? (
                <TrendingUp className="h-4 w-4 mr-2" />
              ) : (
                <TrendingDown className="h-4 w-4 mr-2" />
              )}
              {trend.value}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

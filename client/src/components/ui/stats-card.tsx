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
      <CardContent className="px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <dt className="text-xs font-medium text-muted-foreground mb-1 truncate" data-testid="stats-title">{title}</dt>
            <dd className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors duration-300 tabular-nums" data-testid="stats-value">{value}</dd>
            {trend && (
              <div className="flex items-center space-x-1">
                <div className={cn(
                  "flex items-center text-xs font-medium",
                  trend.positive ? "text-green-600" : "text-red-600"
                )} data-testid="stats-trend">
                  {trend.positive ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {trend.value}
                </div>
              </div>
            )}
          </div>
          <div className="flex-shrink-0">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-md ring-2 ring-white/10 group-hover:scale-110 transition-transform duration-300", iconBgColor)}>
              {icon}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

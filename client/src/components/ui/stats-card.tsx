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
    <Card className={cn("overflow-hidden", className)} data-testid={`stats-card-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardContent className="px-6 py-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={cn("w-8 h-8 rounded-2xl flex items-center justify-center", iconBgColor)}>
              {icon}
            </div>
          </div>
          <div className="ml-4 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate" data-testid="stats-title">{title}</dt>
              <dd className="text-2xl font-bold text-gray-900" data-testid="stats-value">{value}</dd>
            </dl>
          </div>
        </div>
        {trend && (
          <div className="mt-4">
            <div className={cn(
              "flex items-center text-sm",
              trend.positive ? "text-green-600" : "text-red-600"
            )} data-testid="stats-trend">
              {trend.positive ? (
                <TrendingUp className="h-4 w-4 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 mr-1" />
              )}
              {trend.value}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

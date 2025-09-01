import { Card, CardContent } from "@/components/ui/card";
import { Fee } from "@shared/fees-schema";
import { formatCurrencyBE, formatPercentage } from "@/lib/format";
import { Euro, TrendingUp, AlertTriangle, FileText } from "lucide-react";

interface KpiCardsProps {
  fees: Fee[];
}

export function KpiCards({ fees }: KpiCardsProps) {
  // Calculate KPIs
  const openFees = fees.filter(fee => fee.status === "OPEN");
  const paidFees = fees.filter(fee => fee.status === "PAID");
  const overdueFees = fees.filter(fee => fee.status === "OVERDUE");
  
  const openAmount = openFees.reduce((sum, fee) => sum + fee.amount, 0);
  const paidAmount = paidFees.reduce((sum, fee) => sum + fee.amount, 0);
  const overdueAmount = overdueFees.reduce((sum, fee) => sum + fee.amount, 0);
  const totalAmount = fees.reduce((sum, fee) => sum + fee.amount, 0);
  
  const paidPercentage = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;
  const totalCount = fees.length;

  const kpis = [
    {
      title: "Openstaand",
      value: formatCurrencyBE(openAmount),
      icon: Euro,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      description: `${openFees.length} facturen`,
    },
    {
      title: "Betaald",
      value: formatPercentage(paidPercentage),
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50",
      description: `${formatCurrencyBE(paidAmount)} ontvangen`,
    },
    {
      title: "Achterstallig",
      value: formatCurrencyBE(overdueAmount),
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      description: `${overdueFees.length} facturen`,
    },
    {
      title: "Totaal facturen",
      value: totalCount.toString(),
      icon: FileText,
      color: "text-gray-600",
      bgColor: "bg-gray-50",
      description: formatCurrencyBE(totalAmount),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <Card key={kpi.title} className="hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${kpi.bgColor}`}>
                  <Icon className={`h-6 w-6 ${kpi.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{kpi.title}</p>
                  <p className="text-2xl font-semibold text-gray-900">{kpi.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{kpi.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
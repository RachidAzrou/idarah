import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Fee } from "@shared/fees-schema";
import { formatCurrencyBE } from "@/lib/format";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { format, parseISO, startOfMonth } from "date-fns";
import { nl } from "date-fns/locale";

interface ChartsProps {
  fees: Fee[];
}

export function Charts({ fees }: ChartsProps) {
  // Donut chart data
  const statusData = [
    {
      name: "Betaald",
      value: fees.filter(fee => fee.status === "PAID").length,
      amount: fees.filter(fee => fee.status === "PAID").reduce((sum, fee) => sum + fee.amount, 0),
      color: "#10B981", // green
    },
    {
      name: "Openstaand", 
      value: fees.filter(fee => fee.status === "OPEN").length,
      amount: fees.filter(fee => fee.status === "OPEN").reduce((sum, fee) => sum + fee.amount, 0),
      color: "#3B82F6", // blue
    },
    {
      name: "Achterstallig",
      value: fees.filter(fee => fee.status === "OVERDUE").length,
      amount: fees.filter(fee => fee.status === "OVERDUE").reduce((sum, fee) => sum + fee.amount, 0),
      color: "#EF4444", // red
    },
  ];

  // Line chart data - payments received per month
  const paidFees = fees.filter(fee => fee.status === "PAID" && fee.paidAt);
  const monthlyData = paidFees.reduce((acc, fee) => {
    const month = format(startOfMonth(parseISO(fee.paidAt!)), "yyyy-MM");
    if (!acc[month]) {
      acc[month] = 0;
    }
    acc[month] += fee.amount;
    return acc;
  }, {} as Record<string, number>);

  const lineData = Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, amount]) => ({
      month: format(parseISO(month + "-01"), "MMM yyyy", { locale: nl }),
      amount: amount,
    }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-blue-600">
            Ontvangen: {formatCurrencyBE(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p>Aantal: {data.value}</p>
          <p>Bedrag: {formatCurrencyBE(data.amount)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Donut Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Status Verdeling</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {statusData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span>{item.name}</span>
                </div>
                <span className="font-medium">{item.value} ({formatCurrencyBE(item.amount)})</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Ontvangen per Maand</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="month" 
                  stroke="#6b7280"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={12}
                  tickFormatter={(value) => `€${value}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#2563EB" 
                  strokeWidth={3}
                  dot={{ fill: "#2563EB", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: "#2563EB", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
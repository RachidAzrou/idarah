"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrencyBE, formatMonthYearBE } from "@/lib/format";
import { getMonthlyTotals, getCategoryTotals } from "@/lib/mock/transactions";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { useMemo } from "react";

const COLORS = [
  '#3B82F6', // blue
  '#EF4444', // red
  '#F59E0B', // amber
  '#10B981', // emerald
  '#8B5CF6', // violet
  '#F97316', // orange
  '#06B6D4', // cyan
  '#84CC16', // lime
];

export function Charts() {
  const monthlyData = useMemo(() => {
    const data = getMonthlyTotals();
    return data.map(item => ({
      ...item,
      monthLabel: formatMonthYearBE(`${item.month}-01`)
    }));
  }, []);

  const expenseCategories = useMemo(() => {
    return getCategoryTotals('EXPENSE').map((item, index) => ({
      ...item,
      fill: COLORS[index % COLORS.length]
    }));
  }, []);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm">
                {entry.name}: {formatCurrencyBE(entry.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="font-medium">{data.payload.category}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {formatCurrencyBE(data.value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Line Chart - Income vs Expenses */}
      <Card className="col-span-1 glass-card card-hover animate-fade-in group">
        <CardHeader>
          <CardTitle className="group-hover:text-primary transition-colors duration-300">Inkomsten vs Uitgaven</CardTitle>
          <CardDescription>
            Maandelijkse ontwikkeling van financiële stromen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="monthLabel" 
                  fontSize={12}
                  tickMargin={8}
                />
                <YAxis 
                  fontSize={12}
                  tickMargin={8}
                  tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="income" 
                  stroke="#10B981" 
                  strokeWidth={3}
                  name="Inkomsten"
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#10B981', strokeWidth: 2 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="expense" 
                  stroke="#EF4444" 
                  strokeWidth={3}
                  name="Uitgaven"
                  dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#EF4444', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Pie Chart - Expense Categories */}
      <Card className="col-span-1 glass-card card-hover animate-fade-in group">
        <CardHeader>
          <CardTitle className="group-hover:text-primary transition-colors duration-300">Uitgaven per Categorie</CardTitle>
          <CardDescription>
            Verdeling van uitgaven over verschillende categorieën
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseCategories}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, percent }) => 
                    `${category} (${(percent * 100).toFixed(0)}%)`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                  className="text-xs"
                >
                  {expenseCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
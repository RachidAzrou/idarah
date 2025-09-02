import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

export default function RevenueChart() {
  const { data: transactions } = useQuery({
    queryKey: ["/api/transactions"],
  });
  
  const data = useMemo(() => {
    if (!Array.isArray(transactions)) {
      return [
        { month: 'Jan', revenue: 0 },
        { month: 'Feb', revenue: 0 },
        { month: 'Mrt', revenue: 0 },
        { month: 'Apr', revenue: 0 },
        { month: 'Mei', revenue: 0 },
        { month: 'Jun', revenue: 0 },
      ];
    }
    
    // Bereken inkomsten per maand van dit jaar
    const currentYear = new Date().getFullYear();
    const monthNames = ['Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];
    
    const monthlyRevenue = monthNames.map(monthName => {
      const monthIndex = monthNames.indexOf(monthName);
      const monthRevenue = transactions
        .filter((t: any) => {
          const transactionDate = new Date(t.date);
          return transactionDate.getFullYear() === currentYear && 
                 transactionDate.getMonth() === monthIndex &&
                 t.type === 'INCOME';
        })
        .reduce((sum: number, t: any) => sum + Math.abs(parseFloat(t.amount)), 0);
      
      return { month: monthName, revenue: monthRevenue };
    });
    
    return monthlyRevenue.slice(0, 6); // Alleen eerste 6 maanden
  }, [transactions]);
  
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="mb-6 pb-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Evolutie Inkomsten</h3>
        <p className="text-sm text-gray-500">Lidgelden per maand</p>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis 
              dataKey="month" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#64748B' }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#64748B' }}
              tickFormatter={(value) => `€${(value / 1000).toFixed(1)}k`}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              formatter={(value: number) => [`€${value.toLocaleString('nl-BE')}`, 'Inkomsten']}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#2563EB"
              strokeWidth={3}
              fill="url(#colorRevenue)"
              dot={{ fill: 'white', stroke: '#2563EB', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: '#2563EB' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
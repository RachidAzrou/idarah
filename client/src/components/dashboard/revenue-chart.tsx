import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

export default function RevenueChart() {
  const { data: transactions } = useQuery({
    queryKey: ["/api/transactions"],
  });
  
  const data = useMemo(() => {
    if (!Array.isArray(transactions)) {
      // Toon laatste 6 maanden zelfs zonder data
      const result = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthName = date.toLocaleDateString('nl-BE', { month: 'short' });
        result.push({ month: monthName, revenue: 0 });
      }
      return result;
    }
    
    // Bereken inkomsten voor de laatste 6 maanden
    const monthlyRevenue = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const year = date.getFullYear();
      const month = date.getMonth();
      const monthName = date.toLocaleDateString('nl-BE', { month: 'short' });
      
      const monthRevenue = transactions
        .filter((t: any) => {
          const transactionDate = new Date(t.date);
          return transactionDate.getFullYear() === year && 
                 transactionDate.getMonth() === month &&
                 t.type === 'INCOME';
        })
        .reduce((sum: number, t: any) => sum + Math.abs(parseFloat(t.amount)), 0);
      
      monthlyRevenue.push({ month: monthName, revenue: monthRevenue });
    }
    
    return monthlyRevenue;
  }, [transactions]);
  
  // Bereken dynamische Y-as schaal
  const maxRevenue = Math.max(...data.map(d => d.revenue), 100); // Minimum 100 voor leesbaarheid
  const yAxisMax = Math.ceil(maxRevenue * 1.1); // 10% ruimte bovenaan
  
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
              domain={[0, yAxisMax]}
              tickFormatter={(value) => {
                if (value >= 1000) {
                  return `€${(value / 1000).toFixed(1)}k`;
                }
                return `€${value}`;
              }}
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
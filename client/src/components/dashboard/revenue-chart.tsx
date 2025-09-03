import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function RevenueChart() {
  const [quarterOffset, setQuarterOffset] = useState(0); // 0 = huidig kwartaal, -1 = vorig kwartaal, +1 = volgend kwartaal
  
  const { data: transactions } = useQuery({
    queryKey: ["/api/transactions"],
  });
  
  const data = useMemo(() => {
    if (!Array.isArray(transactions)) {
      // Toon 4 maanden voor huidig kwartaal
      const result = [];
      for (let i = 3; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i + (quarterOffset * 4));
        const monthName = date.toLocaleDateString('nl-BE', { month: 'short' });
        result.push({ month: monthName, revenue: 0 });
      }
      return result;
    }
    
    // Bereken inkomsten voor 4 maanden van geselecteerd kwartaal
    const monthlyRevenue = [];
    for (let i = 3; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i + (quarterOffset * 4));
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
  }, [transactions, quarterOffset]);
  
  // Bereken dynamische Y-as schaal
  const maxRevenue = Math.max(...data.map(d => d.revenue), 100);
  const yAxisMax = Math.ceil(maxRevenue * 1.1);
  
  // Helper functies voor kwartaal navigatie
  const goToPreviousQuarter = () => setQuarterOffset(quarterOffset - 1);
  const goToNextQuarter = () => setQuarterOffset(quarterOffset + 1);
  const goToCurrentQuarter = () => setQuarterOffset(0);
  
  // Bepaal kwartaal label
  const currentQuarterDate = new Date();
  currentQuarterDate.setMonth(currentQuarterDate.getMonth() + (quarterOffset * 4));
  const year = currentQuarterDate.getFullYear();
  const month = currentQuarterDate.getMonth();
  const quarter = Math.floor(month / 3) + 1;
  
  // Bepaal periode label
  const periodLabel = `${quarter}e trimester van ${year}`;
  
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="mb-6 pb-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Evolutie Inkomsten</h3>
            <p className="text-sm text-gray-500">Lidgelden per maand</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={goToPreviousQuarter}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={goToCurrentQuarter}
              className="text-xs px-3"
              disabled={quarterOffset === 0}
            >
              Vandaag
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={goToNextQuarter}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      <div className="relative">
        <h4 className="text-lg font-semibold mb-4 text-center text-[#2463eb]">{periodLabel}</h4>
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
    </div>
  );
}
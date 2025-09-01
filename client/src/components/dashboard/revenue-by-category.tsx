import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const monthlyData = [
  { category: 'Senior', revenue: 50000, members: 320 },
  { category: 'Volwassene', revenue: 43000, members: 650 },
  { category: 'Student', revenue: 28000, members: 420 },
];

const yearlyData = [
  { category: 'Senior', revenue: 600000, members: 320 },
  { category: 'Volwassene', revenue: 516000, members: 650 },
  { category: 'Student', revenue: 336000, members: 420 },
];

export default function RevenueByCategoryChart() {
  const [isYearly, setIsYearly] = useState(false);
  const data = isYearly ? yearlyData : monthlyData;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm col-span-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Inkomsten per Categorie</h3>
          <p className="text-sm text-gray-500">Lidgelden opgesplitst per lidcategorie</p>
        </div>
        <div className="flex bg-gray-100 rounded-lg p-1">
          <Button
            variant={!isYearly ? "default" : "ghost"}
            size="sm"
            onClick={() => setIsYearly(false)}
            className={`px-4 py-1 text-sm rounded-md transition-colors ${
              !isYearly ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Maandelijks
          </Button>
          <Button
            variant={isYearly ? "default" : "ghost"}
            size="sm"
            onClick={() => setIsYearly(true)}
            className={`px-4 py-1 text-sm rounded-md transition-colors ${
              isYearly ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Jaarlijks
          </Button>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="horizontal"
            margin={{ top: 20, right: 30, left: 80, bottom: 5 }}
          >
            <XAxis 
              type="number"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#64748B' }}
              tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
            />
            <YAxis 
              type="category"
              dataKey="category"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#64748B' }}
            />
            <Bar 
              dataKey="revenue" 
              fill="url(#colorGradient)"
              radius={[0, 8, 8, 0]}
            />
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#2563EB" />
                <stop offset="100%" stopColor="#93C5FD" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700">{item.category}</span>
            <div className="flex items-center space-x-4">
              <span className="text-gray-900 font-semibold">
                €{item.revenue.toLocaleString('nl-BE')}
              </span>
              <span className="text-gray-500">
                {item.members} leden
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
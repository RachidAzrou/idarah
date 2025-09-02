import React, { useState, useMemo } from 'react';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { useQuery } from '@tanstack/react-query';
import { formatCurrencyShortEUR } from '@/lib/utils/currency';

interface IncomeData {
  category: string;
  amount: number;
  members: number;
}

export default function IncomeByCategoryCard() {
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('yearly');
  
  const { data: transactions } = useQuery({
    queryKey: ["/api/transactions"],
  });
  
  const { data: members } = useQuery({
    queryKey: ["/api/members"],
  });
  
  const data = useMemo(() => {
    if (!Array.isArray(transactions) || !Array.isArray(members)) {
      return [
        { category: 'Senior', amount: 0, members: 0 },
        { category: 'Standaard', amount: 0, members: 0 },
        { category: 'Student', amount: 0, members: 0 },
      ];
    }
    
    // Groepeer leden per categorie
    const membersByCategory = members.reduce((acc: any, member: any) => {
      // Map database categories to display categories
      let category = 'Standaard';
      if (member.category === 'STUDENT') category = 'Student';
      else if (member.category === 'SENIOR') category = 'Senior';
      else if (member.category === 'STANDAARD') category = 'Standaard';
      
      if (!acc[category]) {
        acc[category] = { count: 0, totalIncome: 0 };
      }
      acc[category].count++;
      return acc;
    }, {});
    
    // Bereken inkomsten per categorie - voor nu simuleren we data gebaseerd op aantal leden
    const incomeByCategory: any = {};
    
    // Simuleer lidgelden gebaseerd op aantal leden per categorie
    Object.keys(membersByCategory).forEach(category => {
      const memberCount = membersByCategory[category].count;
      let monthlyFee = 25; // Default fee
      
      if (category === 'Student') monthlyFee = 15;
      else if (category === 'Senior') monthlyFee = 20;
      else if (category === 'Standaard') monthlyFee = 25;
      
      const yearlyIncome = memberCount * monthlyFee * (period === 'yearly' ? 12 : 1);
      incomeByCategory[category] = yearlyIncome;
    });
    
    // Zorg er altijd voor dat alle categorieën getoond worden
    const allCategories = ['Student', 'Standaard', 'Senior'];
    
    const result = allCategories.map(category => ({
      category,
      amount: incomeByCategory[category] || 0,
      members: membersByCategory[category]?.count || 0
    }));
    
    return result;
  }, [transactions, members, period]);
  
  const maxAmount = Math.max(...data.map(item => item.amount), 1);

  const periodOptions = [
    { value: 'monthly', label: 'Maandelijks' },
    { value: 'yearly', label: 'Jaarlijks' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm col-span-full" style={{ boxShadow: '0 6px 16px rgba(2,6,23,0.08)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 font-['Poppins']">Inkomsten per Categorie</h3>
          <p className="text-sm text-gray-500 font-['Poppins']">Lidgelden opgesplitst per lidcategorie</p>
        </div>
        <SegmentedControl
          options={periodOptions}
          value={period}
          onChange={(value) => setPeriod(value as 'monthly' | 'yearly')}
        />
      </div>

      {/* Horizontal Bars */}
      <div className="space-y-6">
        {data.map((item, index) => {
          const widthPercentage = maxAmount > 0 ? (item.amount / maxAmount) * 100 : 0;
          
          // Colors consistent with Leden per categorie
          const getBarColor = (category: string) => {
            switch (category) {
              case 'Senior':
                return '#1E3A8A'; // Dark blue
              case 'Standaard':
                return '#3B82F6'; // Medium blue
              case 'Student':
                return '#06B6D4'; // Light blue/cyan
              default:
                return '#3B82F6'; // Default blue
            }
          };
          
          return (
            <div key={index} className="flex items-center">
              {/* Category Label */}
              <div className="w-20 flex-shrink-0">
                <span className="text-sm font-medium text-gray-900 font-['Poppins']">
                  {item.category}
                </span>
              </div>
              
              {/* Bar Container */}
              <div className="flex-1 mx-4">
                <div 
                  className="h-5 bg-gray-100 rounded-full relative overflow-hidden"
                  role="progressbar"
                  aria-label={`${item.category}: ${formatCurrencyShortEUR(item.amount)}`}
                  aria-valuenow={item.amount}
                  aria-valuemax={maxAmount}
                >
                  <div
                    className="h-full rounded-full transition-[width] duration-200 ease-out"
                    style={{
                      width: `${widthPercentage}%`,
                      backgroundColor: getBarColor(item.category),
                    }}
                  />
                </div>
              </div>
              
              {/* Right Values */}
              <div className="w-24 text-right flex-shrink-0">
                <div className="text-sm font-bold text-blue-600 font-['Poppins']">
                  {formatCurrencyShortEUR(item.amount)}
                </div>
                <div className="text-xs text-gray-500 font-['Poppins']">
                  {item.members} leden
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
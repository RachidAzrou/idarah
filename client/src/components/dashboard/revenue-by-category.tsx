import React, { useState } from 'react';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { yearly, monthly } from '@/lib/mock/income';
import { formatCurrencyShortEUR } from '@/lib/utils/currency';

interface IncomeData {
  category: string;
  amount: number;
  members: number;
}

export default function IncomeByCategoryCard() {
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('yearly');
  const data = period === 'yearly' ? yearly : monthly;
  const maxAmount = Math.max(...data.map(item => item.amount));

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
          const widthPercentage = (item.amount / maxAmount) * 100;
          
          // Colors consistent with Leden per categorie
          const getBarColor = (category: string) => {
            switch (category) {
              case 'Senior':
                return '#1E3A8A'; // Dark blue - same as members
              case 'Standaard':
                return '#3B82F6'; // Medium blue - same as members
              case 'Student':
                return '#06B6D4'; // Light blue/cyan - same as members
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
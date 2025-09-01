import React from 'react';
import { StackedBars } from '@/components/charts/stacked-bars';
import { ageGender } from '@/lib/mock/age-gender';
import { calcPercents } from '@/lib/utils/age-gender';

export default function AgeGenderCard() {
  const { total, buckets } = ageGender;
  const enrichedBuckets = calcPercents(buckets, total);

  return (
    <div 
      className="bg-white rounded-2xl border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-40"
      style={{ 
        boxShadow: '0 6px 16px rgba(2,6,23,0.08)',
        padding: '20px 24px'
      }}
      tabIndex={0}
    >
      {/* Header with Total */}
      <div className="mb-4 pb-3" style={{ borderBottom: '1px solid #E2E8F0' }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-3 sm:gap-0">
          <div>
            <h3 className="text-base md:text-lg font-semibold font-['Poppins']" style={{ color: '#0F172A' }}>
              Leeftijd en Geslacht
            </h3>
            <p className="text-sm font-['Poppins']" style={{ color: '#64748B' }}>
              Statistieken
            </p>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-sm font-['Poppins']" style={{ color: '#64748B' }}>
              Totaal
            </div>
            <div 
              className="text-2xl md:text-3xl font-bold font-['Poppins']" 
              style={{ color: '#0F172A' }}
            >
              {new Intl.NumberFormat('nl-BE').format(total)}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center flex-wrap gap-4 md:gap-6 mb-4">
        <div className="flex items-center space-x-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: '#3B82F6' }}
          ></div>
          <span className="text-sm font-['Poppins']" style={{ color: '#475569' }}>
            Man
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: '#A855F7' }}
          ></div>
          <span className="text-sm font-['Poppins']" style={{ color: '#475569' }}>
            Vrouw
          </span>
        </div>
      </div>

      {/* Stacked Bars */}
      <StackedBars buckets={enrichedBuckets} />
    </div>
  );
}
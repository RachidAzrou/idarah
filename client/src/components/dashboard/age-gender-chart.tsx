import React, { useMemo } from 'react';
import { StackedBars } from '@/components/charts/stacked-bars';
import { useQuery } from '@tanstack/react-query';
import { calcPercents } from '@/lib/utils/age-gender';

export default function AgeGenderCard() {
  const { data: members } = useQuery({
    queryKey: ["/api/members"],
  });
  
  const { total, buckets } = useMemo(() => {
    if (!Array.isArray(members)) {
      return {
        total: 0,
        buckets: [
          { label: '<18', male: 0, female: 0 },
          { label: '18-25', male: 0, female: 0 },
          { label: '26-35', male: 0, female: 0 },
          { label: '36-45', male: 0, female: 0 },
          { label: '46-55', male: 0, female: 0 },
          { label: '56-65', male: 0, female: 0 },
          { label: '65+', male: 0, female: 0 },
        ]
      };
    }
    
    const totalMembers = members.length;
    
    // Bereken leeftijd uit geboortedatum en groepeer per categorie en geslacht
    const ageBuckets = {
      '<18': { male: 0, female: 0 },
      '18-25': { male: 0, female: 0 },
      '26-35': { male: 0, female: 0 },
      '36-45': { male: 0, female: 0 },
      '46-55': { male: 0, female: 0 },
      '56-65': { male: 0, female: 0 },
      '65+': { male: 0, female: 0 },
    };
    
    members.forEach((member: any) => {
      if (!member.birthDate) return;
      
      const age = new Date().getFullYear() - new Date(member.birthDate).getFullYear();
      const gender = member.gender === 'M' ? 'male' : 'female';
      
      let bucket = '65+';
      if (age < 18) bucket = '<18';
      else if (age >= 18 && age <= 25) bucket = '18-25';
      else if (age >= 26 && age <= 35) bucket = '26-35';
      else if (age >= 36 && age <= 45) bucket = '36-45';
      else if (age >= 46 && age <= 55) bucket = '46-55';
      else if (age >= 56 && age <= 65) bucket = '56-65';
      
      ageBuckets[bucket as keyof typeof ageBuckets][gender as 'male' | 'female']++;
    });
    
    const buckets = Object.entries(ageBuckets).map(([range, counts]) => ({
      label: range,
      male: counts.male,
      female: counts.female
    }));
    
    return { total: totalMembers, buckets };
  }, [members]);
  
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
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold font-['Poppins']" style={{ color: '#0F172A' }}>
              Leeftijd en Geslacht
            </h3>
            <p className="text-sm font-['Poppins']" style={{ color: '#64748B' }}>
              Statistieken
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm font-['Poppins']" style={{ color: '#64748B' }}>
              Totaal
            </div>
            <div 
              className="text-3xl font-bold font-['Poppins']" 
              style={{ color: '#0F172A' }}
            >
              {new Intl.NumberFormat('nl-BE').format(total)}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center space-x-6 mb-4">
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
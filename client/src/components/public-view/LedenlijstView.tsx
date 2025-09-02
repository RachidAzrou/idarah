"use client";

import { useState, useEffect } from "react";
import { LedenlijstConfig } from "@/lib/mock/public-screens";
import { mockMembers, monthNames, getFilteredMembers, getMemberDisplayName, Member } from "@/lib/mock/members-data";
import { Check, X, Vote } from "lucide-react";
import backgroundImage from "@assets/ramadan_15_03_2022_1_1756811846212.jpg";

interface LedenlijstViewProps {
  config: LedenlijstConfig;
}

export function LedenlijstView({ config }: LedenlijstViewProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);

  useEffect(() => {
    const filtered = getFilteredMembers(mockMembers, {
      categories: config.categories,
      useFullNames: config.display.useFullNames,
      useInitials: config.display.useInitials,
      filterByCategories: config.display.filterByCategories,
      showVotingRights: config.display.showVotingRights,
      actieveLedenOnly: true
    });
    setFilteredMembers(filtered);
    setCurrentPage(0);
  }, [config]);

  const totalPages = Math.ceil(filteredMembers.length / config.display.rowsPerPage);
  const startIndex = currentPage * config.display.rowsPerPage;
  const endIndex = startIndex + config.display.rowsPerPage;
  const currentMembers = filteredMembers.slice(startIndex, endIndex);

  // Auto-advance pages
  useEffect(() => {
    if (totalPages <= 1) return;

    const interval = setInterval(() => {
      setCurrentPage(prev => (prev + 1) % totalPages);
    }, 15000); // 15 seconden per pagina

    return () => clearInterval(interval);
  }, [totalPages]);

  const getPaymentStatusIcon = (status: 'betaald' | 'open' | 'achterstallig') => {
    switch (status) {
      case 'betaald':
        return <Check className="w-4 h-4 text-white" />;
      case 'achterstallig':
        return <X className="w-4 h-4 text-white" />;
      default:
        return null;
    }
  };

  const getPaymentStatusColor = (status: 'betaald' | 'open' | 'achterstallig') => {
    switch (status) {
      case 'betaald':
        return 'bg-green-500';
      case 'achterstallig':
        return 'bg-red-500';
      default:
        return 'bg-gray-300';
    }
  };

  // Category color mapping - consistent with dashboard
  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'senior':
        return '#1E3A8A'; // Dark blue
      case 'standaard':
        return '#3B82F6'; // Medium blue  
      case 'student':
        return '#06B6D4'; // Light blue/cyan
      default:
        return '#6B7280'; // Gray fallback
    }
  };

  return (
    <div 
      className="min-h-screen p-8 relative"
      style={{
        backgroundImage: `url("${backgroundImage}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Background blur overlay */}
      <div className="absolute inset-0 bg-white/30 backdrop-blur-sm"></div>
      {/* Header */}
      <div className="text-center mb-12 relative z-10">
        <div className="bg-white rounded-2xl p-8 border border-gray-200 mx-auto max-w-4xl" style={{ boxShadow: '0 6px 16px rgba(2,6,23,0.08)' }}>
          <h1
            style={{
              fontSize: `${config.title.fontSize}px`,
              fontFamily: config.title.fontFamily,
              color: config.title.color,
              fontWeight: config.title.fontWeight,
              margin: 0
            }}
            className="text-card-foreground"
            data-testid="ledenlijst-title"
          >
            {config.title.text}
          </h1>
          
          {config.subtitle.text && (
            <h2
              style={{
                fontSize: `${config.subtitle.fontSize}px`,
                fontFamily: config.subtitle.fontFamily,
                color: config.subtitle.color,
                fontWeight: config.subtitle.fontWeight,
                margin: '8px 0 0 0'
              }}
              className="text-muted-foreground"
              data-testid="ledenlijst-subtitle"
            >
              {config.subtitle.text}
            </h2>
          )}
        </div>
      </div>

      {/* Tabel */}
      <div className="w-full relative z-10">
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden" style={{ boxShadow: '0 6px 16px rgba(2,6,23,0.08)' }}>
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left font-semibold text-blue-900 text-xs uppercase tracking-wider">
                  Lidnr.
                </th>
                <th className="px-6 py-3 text-left font-semibold text-blue-900 text-xs uppercase tracking-wider">
                  Naam
                </th>
                {config.display.showVotingRights && (
                  <th className="px-4 py-3 text-center font-semibold text-blue-900 text-xs uppercase tracking-wider">
                    Stemrecht
                  </th>
                )}
                {monthNames.map((month, index) => (
                  <th
                    key={month}
                    className="px-3 py-3 text-center font-semibold text-blue-900 text-xs uppercase tracking-wider min-w-[50px]"
                  >
                    {month}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentMembers.map((member, memberIndex) => (
                <tr key={member.id} className="hover:bg-blue-50/50 border-b border-blue-100 last:border-0 transition-all duration-200">
                  <td className="px-6 py-3 font-mono text-xs text-slate-500">
                    {member.lidnummer}
                  </td>
                  <td className="px-6 py-3 text-blue-900 font-medium text-sm">
                    {getMemberDisplayName(member, {
                      useFullNames: config.display.useFullNames,
                      useInitials: config.display.useInitials
                    })}
                  </td>
                  {config.display.showVotingRights && (
                    <td className="px-4 py-3 text-center">
                      {member.stemrecht && (
                        <Vote className="w-5 h-5 text-primary mx-auto" />
                      )}
                    </td>
                  )}
                  {monthNames.map((month, monthIndex) => {
                    const monthNumber = monthIndex + 1;
                    const status = member.betalingen[config.year]?.[monthNumber] || 'open';
                    
                    return (
                      <td
                        key={month}
                        className="px-3 py-3 text-center"
                      >
                        <div
                          className={`w-6 h-6 rounded-md mx-auto transition-all duration-200 shadow-sm ${
                            status === 'betaald' ? 'bg-emerald-400 border-2 border-emerald-500' :
                            status === 'achterstallig' ? 'bg-red-400 border-2 border-red-500' :
                            'bg-slate-300 border-2 border-slate-400'
                          }`}
                          title={`${month}: ${status}`}
                        ></div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginering info */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center relative z-10">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-slate-200/50">
              <div className="flex justify-center items-center gap-3 mb-4">
                {Array.from({ length: totalPages }, (_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      i === currentPage 
                        ? 'bg-blue-600 scale-125' 
                        : 'bg-blue-200'
                    }`}
                  />
                ))}
              </div>
              <div className="text-center">
                <p className="text-slate-700 font-semibold text-lg">
                  Pagina {currentPage + 1} van {totalPages}
                </p>
                <p className="text-slate-500 text-sm mt-1">
                  {filteredMembers.length} leden weergegeven
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
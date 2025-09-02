"use client";

import { useState, useEffect } from "react";
import { LedenlijstConfig } from "@/lib/mock/public-screens";
import { mockMembers, monthNames, getFilteredMembers, getMemberDisplayName, Member } from "@/lib/mock/members-data";
import { Check, X, Vote } from "lucide-react";

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8 relative">
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>
      {/* Header */}
      <div className="text-center mb-12 relative z-10">
        <div className="bg-white/95 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-slate-200/50 mx-auto max-w-4xl">
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
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/50 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200">
                <th className="px-8 py-5 text-left font-semibold text-slate-800 text-sm uppercase tracking-wider">
                  Lidnr.
                </th>
                <th className="px-8 py-5 text-left font-semibold text-slate-800 text-sm uppercase tracking-wider">
                  Naam
                </th>
                {config.display.showVotingRights && (
                  <th className="px-6 py-5 text-center font-semibold text-slate-800 text-sm uppercase tracking-wider">
                    Stemrecht
                  </th>
                )}
                {monthNames.map((month, index) => (
                  <th
                    key={month}
                    className="px-4 py-5 text-center font-semibold text-slate-800 text-xs uppercase tracking-wider min-w-[60px]"
                  >
                    {month}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentMembers.map((member, memberIndex) => (
                <tr key={member.id} className="hover:bg-slate-50/50 border-b border-slate-100 last:border-0 transition-all duration-200">
                  <td className="px-8 py-5 font-mono text-sm text-slate-500">
                    {member.lidnummer}
                  </td>
                  <td className="px-8 py-5 text-slate-700 font-medium">
                    {getMemberDisplayName(member, {
                      useFullNames: config.display.useFullNames,
                      useInitials: config.display.useInitials
                    })}
                  </td>
                  {config.display.showVotingRights && (
                    <td className="px-6 py-5 text-center">
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
                        className="px-4 py-5 text-center"
                      >
                        <div
                          className={`w-7 h-7 rounded-lg mx-auto flex items-center justify-center transition-all duration-200 border-2 ${
                            status === 'betaald' ? 'bg-emerald-50 border-emerald-200' :
                            status === 'achterstallig' ? 'bg-red-50 border-red-200' :
                            'bg-slate-50 border-slate-200'
                          }`}
                          title={`${month}: ${status}`}
                        >
                          {status === 'betaald' && (
                            <Check className="w-4 h-4 text-emerald-600" />
                          )}
                          {status === 'achterstallig' && (
                            <X className="w-4 h-4 text-red-600" />
                          )}
                        </div>
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
                        ? 'bg-slate-700 scale-125' 
                        : 'bg-slate-300'
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
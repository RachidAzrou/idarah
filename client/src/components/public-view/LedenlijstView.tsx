"use client";

import { useState, useEffect, useMemo } from "react";
import { LedenlijstConfig } from "@/lib/mock/public-screens";
import { monthNames, getFilteredMembers, getMemberDisplayName, Member } from "@/lib/mock/members-data";
import { Check, X, Vote } from "lucide-react";
import backgroundImage from "@assets/ramadan_15_03_2022_1_1756811846212.jpg";

interface LedenlijstViewProps {
  config: LedenlijstConfig;
  members?: any[]; // Real member data from API
}

export function LedenlijstView({ config, members = [] }: LedenlijstViewProps) {
  
  const [currentPage, setCurrentPage] = useState(0);

  const convertedMembers = useMemo(() => {
    return members.map((member: any) => {
      // Map database categories to display categories
      let displayCategory = member.category;
      if (member.category === 'STUDENT') displayCategory = 'Student';
      else if (member.category === 'SENIOR') displayCategory = 'Senior';  
      else if (member.category === 'STANDAARD') displayCategory = 'Standaard';
      
      // Calculate payment status by month for current year
      const currentYear = new Date().getFullYear();
      const betalingenByMonth: { [key: number]: 'betaald' | 'open' | 'vervallen' } = {};
      
      // Process membership fees if available
      if (member.membershipFees) {
        member.membershipFees.forEach((fee: any) => {
          const feeDate = new Date(fee.periodStart);
          if (feeDate.getFullYear() === currentYear) {
            const month = feeDate.getMonth() + 1; // Convert to 1-12
            
            // Determine status based on fee status and dates
            if (fee.status === 'PAID') {
              betalingenByMonth[month] = 'betaald';
            } else if (fee.status === 'OVERDUE') {
              betalingenByMonth[month] = 'vervallen';
            } else {
              betalingenByMonth[month] = 'open';
            }
          }
        });
      }
      
      return {
        id: member.id,
        lidnummer: member.memberNumber,
        voornaam: member.firstName,
        achternaam: member.lastName,
        initialen: member.firstName.charAt(0) + member.lastName.charAt(0),
        categorie: displayCategory,
        actief: member.active,
        stemrecht: member.votingRights,
        betaalstatus: [], 
        betalingen: {
          [currentYear]: betalingenByMonth
        }
      };
    });
  }, [members]);
  
  const filteredMembers = useMemo(() => {
    
    const filtered = getFilteredMembers(convertedMembers, {
      categories: config.categories,
      useFullNames: config.display.useFullNames,
      useInitials: config.display.useInitials,
      filterByCategories: config.display.filterByCategories,
      showVotingRights: config.display.showVotingRights,
      actieveLedenOnly: true
    });
    
    return filtered;
  }, [convertedMembers, config.categories, config.display.filterByCategories, config.display.useFullNames, config.display.useInitials, config.display.showVotingRights]);
  
  useEffect(() => {
    setCurrentPage(0);
  }, [filteredMembers.length]);

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

  const getPaymentStatusIcon = (status: 'betaald' | 'open' | 'vervallen') => {
    switch (status) {
      case 'betaald':
        return <Check className="w-4 h-4 text-white" />;
      case 'vervallen':
        return <X className="w-4 h-4 text-white" />;
      default:
        return null;
    }
  };

  const getPaymentStatusColor = (status: 'betaald' | 'open' | 'vervallen') => {
    switch (status) {
      case 'betaald':
        return 'bg-green-500';
      case 'vervallen':
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
      className="min-h-screen p-8 relative font-sans"
      style={{
        backgroundImage: `url("${backgroundImage}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Modern glassmorphism background overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/90 via-white/85 to-blue-100/90 backdrop-blur-sm"></div>
      {/* Header */}
      <div className="text-center mb-12 relative z-10">
        <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-lg">
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
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg">
          <table className="w-full">
            <thead>
              <tr className="bg-[#e6effd] border-b border-gray-200">
                <th className="px-6 py-4 text-left font-semibold text-blue-900 text-sm uppercase tracking-wider">
                  Lidnr.
                </th>
                <th className="px-6 py-4 text-left font-semibold text-blue-900 text-sm uppercase tracking-wider">
                  Naam
                </th>
                {config.display.showVotingRights && (
                  <th className="px-4 py-4 text-center font-semibold text-blue-900 text-sm uppercase tracking-wider">
                    Stemrecht
                  </th>
                )}
                {monthNames.map((month, index) => (
                  <th
                    key={month}
                    className="px-3 py-4 text-center font-semibold text-blue-900 text-sm uppercase tracking-wider min-w-[60px]"
                  >
                    {month}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentMembers.map((member, memberIndex) => (
                <tr key={member.id} className="hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-all duration-200">
                  <td className="px-6 py-4 font-mono text-sm text-slate-600 font-medium">
                    {member.lidnummer}
                  </td>
                  <td className="px-6 py-4 text-blue-900 font-semibold text-base">
                    {getMemberDisplayName(member, {
                      useFullNames: config.display.useFullNames,
                      useInitials: config.display.useInitials
                    })}
                  </td>
                  {config.display.showVotingRights && (
                    <td className="px-4 py-4 text-center">
                      {member.stemrecht && (
                        <Vote className="w-5 h-5 text-primary mx-auto" />
                      )}
                    </td>
                  )}
                  {monthNames.map((month, monthIndex) => {
                    const monthNumber = monthIndex + 1;
                    const status = member.betalingen?.[config.year]?.[monthNumber] || 'open';
                    
                    return (
                      <td
                        key={month}
                        className="px-3 py-4 text-center"
                      >
                        <div
                          className={`w-8 h-8 rounded-xl mx-auto transition-all duration-300 shadow-lg flex items-center justify-center ${
                            status === 'betaald' ? 'bg-gradient-to-br from-emerald-400 to-emerald-500 border-2 border-emerald-300' :
                            status === 'vervallen' ? 'bg-gradient-to-br from-red-400 to-red-500 border-2 border-red-300' :
                            'bg-gradient-to-br from-slate-300 to-slate-400 border-2 border-slate-200'
                          } hover:scale-110 hover:shadow-xl`}
                          title={`${month}: ${status}`}
                        >
                          {getPaymentStatusIcon(status)}
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
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <div className="flex justify-center items-center gap-3 mb-4">
                {Array.from({ length: totalPages }, (_, i) => (
                  <div
                    key={i}
                    className={`w-4 h-4 rounded-full transition-all duration-300 shadow-md ${
                      i === currentPage 
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600 scale-125 shadow-lg' 
                        : 'bg-gradient-to-br from-blue-200 to-blue-300 hover:scale-110'
                    }`}
                  />
                ))}
              </div>
              <div className="text-center">
                <p className="text-slate-800 font-bold text-xl">
                  Pagina {currentPage + 1} van {totalPages}
                </p>
                <p className="text-slate-600 text-base mt-2 font-medium">
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
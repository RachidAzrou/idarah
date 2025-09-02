"use client";

import { useState, useEffect } from "react";
import { LedenlijstConfig } from "@/lib/mock/public-screens";
import { mockMembers, monthNames, getFilteredMembers, getMemberDisplayName, Member } from "@/lib/mock/members-data";
import { Check, X, Vote } from "lucide-react";
import backgroundImage from "../../assets/background.jpg";

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
    <div 
      className="min-h-screen bg-background p-8 relative"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Overlay to make background subtle */}
      <div className="absolute inset-0 bg-white/95 backdrop-blur-md"></div>
      {/* Header */}
      <div className="text-center mb-8 relative z-10">
        <div className="bg-card rounded-2xl p-8 shadow-sm border border-border mx-auto max-w-4xl hover:shadow-md transition-shadow duration-200">
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
        <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden hover:shadow-md transition-shadow duration-200">
          <table className="w-full">
            <thead>
              <tr className="bg-muted border-b border-border">
                <th className="px-6 py-4 text-left font-semibold text-card-foreground">
                  Lidnr.
                </th>
                <th className="px-6 py-4 text-left font-semibold text-card-foreground">
                  Naam
                </th>
                {config.display.showVotingRights && (
                  <th className="px-4 py-4 text-center font-semibold text-card-foreground">
                    Stemrecht
                  </th>
                )}
                {monthNames.map((month, index) => (
                  <th
                    key={month}
                    className="px-3 py-4 text-center font-semibold text-card-foreground text-sm min-w-[60px]"
                  >
                    {month}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentMembers.map((member, memberIndex) => (
                <tr key={member.id} className="hover:bg-accent border-b border-border last:border-0 transition-colors duration-200">
                  <td className="px-6 py-4 font-mono text-sm text-muted-foreground">
                    {member.lidnummer}
                  </td>
                  <td className="px-6 py-4 text-card-foreground font-medium">
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
                    const status = member.betalingen[config.year]?.[monthNumber] || 'open';
                    
                    return (
                      <td
                        key={month}
                        className="px-3 py-4 text-center"
                      >
                        <div
                          className={`w-6 h-6 rounded-full mx-auto flex items-center justify-center transition-all duration-200 ${
                            status === 'betaald' ? 'bg-success/10' :
                            status === 'achterstallig' ? 'bg-destructive/10' :
                            'bg-muted'
                          }`}
                          title={`${month}: ${status}`}
                        >
                          {status === 'betaald' && (
                            <div className="w-3 h-3 bg-success rounded-full"></div>
                          )}
                          {status === 'achterstallig' && (
                            <div className="w-3 h-3 bg-destructive rounded-full"></div>
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
            <div className="bg-card rounded-2xl p-6 shadow-lg border border-border hover:shadow-xl transition-shadow duration-200">
              <div className="flex justify-center items-center gap-3 mb-4">
                {Array.from({ length: totalPages }, (_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      i === currentPage 
                        ? 'bg-primary scale-125 shadow-lg' 
                        : 'bg-muted hover:bg-muted-foreground/20'
                    }`}
                  />
                ))}
              </div>
              <div className="text-center">
                <p className="text-card-foreground font-medium text-lg">
                  Pagina {currentPage + 1} van {totalPages}
                </p>
                <p className="text-muted-foreground text-sm mt-1">
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
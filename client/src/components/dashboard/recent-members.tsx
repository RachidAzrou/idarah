import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getUserInitials } from "@/lib/auth";
import { MoreVertical } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";
import { Link } from "wouter";

export default function RecentMembers() {
  const { data: members, isLoading } = useQuery({
    queryKey: ["/api/members"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Recente Leden</h3>
              <p className="text-sm text-gray-500">Nieuw toegevoegde leden deze week</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const recentMembers = members?.slice(0, 5) || [];

  return (
    <Card data-testid="recent-members-card">
      <CardHeader className="px-6 py-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Recente Leden</h3>
            <p className="text-sm text-gray-500">Nieuw toegevoegde leden deze week</p>
          </div>
          <Link href="/leden">
            <Button variant="ghost" size="sm" className="text-sm font-medium text-primary hover:text-primary/80" data-testid="view-all-members">
              Alle leden bekijken
            </Button>
          </Link>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {recentMembers.length === 0 ? (
          <div className="p-6 text-center text-gray-500" data-testid="no-recent-members">
            Geen recente leden gevonden
          </div>
        ) : (
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lid</th>
                  <th scope="col" className="sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lidnummer</th>
                  <th scope="col" className="sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categorie</th>
                  <th scope="col" className="sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Toegevoegd</th>
                  <th scope="col" className="sticky top-0 relative px-6 py-3"><span className="sr-only">Acties</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50" data-testid={`member-row-${member.id}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                            <span className="text-sm font-medium text-primary-foreground">
                              {getUserInitials(`${member.firstName} ${member.lastName}`)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900" data-testid={`member-name-${member.id}`}>
                            {member.firstName} {member.lastName}
                          </div>
                          {member.email && (
                            <div className="text-sm text-gray-500" data-testid={`member-email-${member.id}`}>
                              {member.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900" data-testid={`member-number-${member.id}`}>
                      {member.memberNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge 
                        variant={member.category === 'STUDENT' ? 'secondary' : member.category === 'SENIOR' ? 'outline' : 'default'}
                        data-testid={`member-category-${member.id}`}
                      >
                        {member.category}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge 
                        variant={member.active ? 'default' : 'destructive'}
                        className={member.active ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}
                        data-testid={`member-status-${member.id}`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${member.active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        {member.active ? 'Actief' : 'Inactief'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" data-testid={`member-created-${member.id}`}>
                      {formatDistanceToNow(new Date(member.createdAt), { addSuffix: true, locale: nl })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-500" data-testid={`member-actions-${member.id}`}>
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

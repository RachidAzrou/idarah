import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Monitor, Plus, Power } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScreenWizard } from "@/components/public-screens/wizard/ScreenWizard";
import { ScreenCard } from "@/components/public-screens/ScreenCard";
// Removed EditScreenModal import - using ScreenWizard for editing
import { apiRequest } from "@/lib/queryClient";

export default function PubliekeSchermen() {
  const [showNewScreenDialog, setShowNewScreenDialog] = useState(false);
  const [editingScreen, setEditingScreen] = useState<any>(null);
  const [wizardMode, setWizardMode] = useState<'create' | 'edit'>('create');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: screens, isLoading } = useQuery({
    queryKey: ["/api/public-screens"],
  });

  const { data: announcements } = useQuery({
    queryKey: ["/api/announcements"],
  });

  const handleCreateScreen = async (screenData: {
    name: string;
    type: any;
    config: any;
  }) => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/public-screens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: screenData.name,
          type: screenData.type,
          active: true,
          config: screenData.config
        }),
      });

      if (response.ok) {
        const screen = await response.json();
        toast({
          title: "Scherm aangemaakt",
          description: `${screen.name} is succesvol aangemaakt.`,
        });
        
        // Invalidate and refetch the screens data
        await queryClient.invalidateQueries({ queryKey: ["/api/public-screens"] });
        await queryClient.refetchQueries({ queryKey: ["/api/public-screens"] });
        setShowNewScreenDialog(false);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create screen');
      }
    } catch (error: any) {
      toast({
        title: "Fout",
        description: error.message || "Er is een fout opgetreden bij het aanmaken van het scherm.",
        variant: "destructive",
      });
    }
  };

  const toggleScreenMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const response = await apiRequest("PUT", `/api/public-screens/${id}`, { active });
      return response.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/public-screens"] });
      await queryClient.refetchQueries({ queryKey: ["/api/public-screens"] });
      toast({
        title: "Status gewijzigd",
        description: "De schermstatus is bijgewerkt.",
      });
    },
  });

  const deleteScreenMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/public-screens/${id}`);
      return response.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/public-screens"] });
      await queryClient.refetchQueries({ queryKey: ["/api/public-screens"] });
      toast({
        title: "Scherm verwijderd",
        description: "Het scherm is succesvol verwijderd.",
      });
    },
  });


  if (isLoading) {
    return (
          <main className="flex-1 py-8">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
            </div>
          </main>
    );
  }

  return (
        <main className="flex-1 py-8">
          <div className="px-4 sm:px-6 lg:px-8">
            {/* Page Header */}
            <div className="border-b border-gray-200 pb-5 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent tracking-tight" data-testid="page-title">Publieke Schermen</h1>
                  <p className="mt-2 text-sm text-gray-600 font-medium">Beheer informatiedisplays en digitale mededelingenborden</p>
                </div>
                <Button 
                  onClick={() => {
                    setEditingScreen(null);
                    setWizardMode('create');
                    setShowNewScreenDialog(true);
                  }}
                  className="gap-2"
                  data-testid="button-new-screen"
                >
                  <Plus className="w-4 h-4" />
                  Nieuw Scherm
                </Button>
              </div>
            </div>

            <Tabs defaultValue="screens" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="screens" data-testid="tab-screens">Schermen</TabsTrigger>
                <TabsTrigger value="announcements" data-testid="tab-announcements">Mededelingen</TabsTrigger>
              </TabsList>

              <TabsContent value="screens" className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                  <Card>
                    <CardContent className="px-6 py-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center">
                            <Monitor className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">Totaal Schermen</dt>
                            <dd className="text-2xl font-bold text-gray-900" data-testid="total-screens">{Array.isArray(screens) ? screens.length : 0}</dd>
                          </dl>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="px-6 py-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center">
                            <Power className="h-5 w-5 text-green-600" />
                          </div>
                        </div>
                        <div className="ml-4 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">Actieve Schermen</dt>
                            <dd className="text-2xl font-bold text-gray-900" data-testid="active-screens">
                              {Array.isArray(screens) ? screens.filter((s: any) => s.active).length : 0}
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="px-6 py-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-purple-100 rounded-xl flex items-center justify-center">
                            <Monitor className="h-5 w-5 text-purple-600" />
                          </div>
                        </div>
                        <div className="ml-4 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">Betaalstatus Schermen</dt>
                            <dd className="text-2xl font-bold text-gray-900" data-testid="payment-screens">
                              {Array.isArray(screens) ? screens.filter((s: any) => s.type === 'BETAALSTATUS').length : 0}
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="px-6 py-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center">
                            <Monitor className="h-5 w-5 text-orange-600" />
                          </div>
                        </div>
                        <div className="ml-4 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">Mededelingen Schermen</dt>
                            <dd className="text-2xl font-bold text-gray-900" data-testid="announcement-screens">
                              {Array.isArray(screens) ? screens.filter((s: any) => s.type === 'MEDEDELINGEN').length : 0}
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Screens List */}
                <div className="space-y-6">
                  {!Array.isArray(screens) || screens.length === 0 ? (
                    <Card>
                      <CardContent className="p-6 text-center text-gray-500" data-testid="no-screens">
                        Nog geen publieke schermen geconfigureerd
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {(screens as any[]).map((screen: any) => (
                        <ScreenCard
                          key={screen.id}
                          screen={screen}
                          onToggleStatus={() => toggleScreenMutation.mutate({ id: screen.id, active: !screen.active })}
                          onDelete={() => deleteScreenMutation.mutate(screen.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="announcements" className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Mededelingen Beheer</CardTitle>
                      <p className="text-sm text-gray-500">Beheer content voor mededelingenborden</p>
                    </div>
                    <Button data-testid="button-new-announcement">
                      <Plus className="h-4 w-4 mr-2" />
                      Nieuwe Mededeling
                    </Button>
                  </CardHeader>
                  
                  <CardContent>
                    {!Array.isArray(announcements) || announcements.length === 0 ? (
                      <div className="p-6 text-center text-gray-500" data-testid="no-announcements">
                        Nog geen mededelingen toegevoegd
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {(announcements as any[]).map((announcement: any) => (
                          <div key={announcement.id} className="p-4 border border-gray-200 rounded-xl" data-testid={`announcement-item-${announcement.id}`}>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900" data-testid={`announcement-title-${announcement.id}`}>
                                  {announcement.title}
                                </h4>
                                {announcement.richText && (
                                  <p className="text-sm text-gray-600 mt-1" data-testid={`announcement-content-${announcement.id}`}>
                                    {announcement.richText.substring(0, 150)}...
                                  </p>
                                )}
                                <div className="flex items-center space-x-2 mt-2">
                                  <Badge 
                                    variant={announcement.active ? 'default' : 'destructive'}
                                    className={announcement.active ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}
                                  >
                                    {announcement.active ? 'Actief' : 'Inactief'}
                                  </Badge>
                                  {announcement.validFrom && announcement.validTo && (
                                    <span className="text-xs text-gray-500">
                                      Geldig: {new Date(announcement.validFrom).toLocaleString('nl-NL')} - {new Date(announcement.validTo).toLocaleString('nl-NL')}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2 ml-4">
                                <Button variant="outline" size="sm">
                                  Bewerken
                                </Button>
                                <Button variant="outline" size="sm">
                                  Verwijderen
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Screen Wizard - handles both create and edit */}
          <ScreenWizard
            open={showNewScreenDialog}
            onOpenChange={(open) => {
              setShowNewScreenDialog(open);
              if (!open) {
                setEditingScreen(null);
                setWizardMode('create');
              }
            }}
            onComplete={(screenData) => {
              if (wizardMode === 'edit' && editingScreen) {
                // Handle edit mode
                const updateScreen = async () => {
                  try {
                    await apiRequest('PUT', `/api/public-screens/${editingScreen.id}`, {
                      name: screenData.name,
                      config: screenData.config
                    });
                    
                    queryClient.invalidateQueries({ queryKey: ["/api/public-screens"] });
                    toast({
                      title: "Scherm bijgewerkt",
                      description: `${screenData.name} is succesvol bijgewerkt.`,
                    });
                  } catch (error: any) {
                    toast({
                      title: "Fout",
                      description: error.message || "Er is een fout opgetreden bij het bijwerken van het scherm.",
                      variant: "destructive",
                    });
                  }
                };
                updateScreen();
              } else {
                // Handle create mode
                handleCreateScreen(screenData);
              }
            }}
            editingScreen={editingScreen}
            mode={wizardMode}
          />

        </main>
  );
}

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Monitor, Plus, Eye, Copy, Settings, Power, PowerOff, ExternalLink } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";

export default function PubliekeSchermen() {
  const [showNewScreenDialog, setShowNewScreenDialog] = useState(false);
  const { toast } = useToast();

  const { data: screens, isLoading } = useQuery({
    queryKey: ["/api/public-screens"],
  });

  const { data: announcements } = useQuery({
    queryKey: ["/api/announcements"],
  });

  const copyPublicUrl = (token: string) => {
    const url = `${window.location.origin}/public/screen/${token}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "URL gekopieerd",
      description: "De publieke URL is naar het klembord gekopieerd.",
    });
  };

  const getScreenTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'BETAALSTATUS': 'Betaalstatus Matrix',
      'MEDEDELINGEN': 'Mededelingen Carousel',
    };
    return labels[type] || type;
  };

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
            <div className="sm:flex sm:items-center sm:justify-between mb-8">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Monitor className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900" data-testid="page-title">Publieke Schermen</h1>
                  <p className="mt-2 text-sm text-gray-700">Beheer informatiedisplays en digitale mededelingenborden</p>
                </div>
              </div>
              <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                <Dialog open={showNewScreenDialog} onOpenChange={setShowNewScreenDialog}>
                  <DialogTrigger asChild>
                    <Button className="inline-flex items-center gap-x-2 rounded-2xl px-6 py-3" data-testid="button-new-screen">
                      <Plus className="h-4 w-4" />
                      Nieuw Scherm
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <div className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Nieuw Publiek Scherm</h3>
                      <p className="text-gray-500">Formulier voor het aanmaken van een nieuw publiek scherm komt hier...</p>
                    </div>
                  </DialogContent>
                </Dialog>
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
                            <dd className="text-2xl font-bold text-gray-900" data-testid="total-screens">{screens?.length || 0}</dd>
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
                              {screens?.filter((s: any) => s.active).length || 0}
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
                              {screens?.filter((s: any) => s.type === 'BETAALSTATUS').length || 0}
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
                              {screens?.filter((s: any) => s.type === 'MEDEDELINGEN').length || 0}
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Screens List */}
                <Card>
                  <CardHeader className="px-6 py-6 border-b border-gray-200">
                    <CardTitle>Publieke Schermen Overzicht</CardTitle>
                    <p className="text-sm text-gray-500">{screens?.length || 0} schermen geconfigureerd</p>
                  </CardHeader>
                  
                  <CardContent className="p-0">
                    {!screens || screens.length === 0 ? (
                      <div className="p-6 text-center text-gray-500" data-testid="no-screens">
                        Nog geen publieke schermen geconfigureerd
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-200">
                        {screens.map((screen: any) => (
                          <div key={screen.id} className="p-6 hover:bg-gray-50" data-testid={`screen-item-${screen.id}`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                  <Monitor className="h-6 w-6 text-purple-600" />
                                </div>
                                <div>
                                  <h3 className="text-lg font-semibold text-gray-900" data-testid={`screen-name-${screen.id}`}>
                                    {screen.name}
                                  </h3>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <Badge 
                                      variant={screen.type === 'BETAALSTATUS' ? 'default' : 'secondary'}
                                      data-testid={`screen-type-${screen.id}`}
                                    >
                                      {getScreenTypeLabel(screen.type)}
                                    </Badge>
                                    <Badge 
                                      variant={screen.active ? 'default' : 'destructive'}
                                      className={screen.active ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}
                                      data-testid={`screen-status-${screen.id}`}
                                    >
                                      {screen.active ? (
                                        <div className="flex items-center">
                                          <Power className="h-3 w-3 mr-1" />
                                          Actief
                                        </div>
                                      ) : (
                                        <div className="flex items-center">
                                          <PowerOff className="h-3 w-3 mr-1" />
                                          Inactief
                                        </div>
                                      )}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-gray-500 mt-1">
                                    Aangemaakt: {formatDateTime(screen.createdAt)}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(`/public/screen/${screen.publicToken}`, '_blank')}
                                  data-testid={`screen-preview-${screen.id}`}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Voorvertoning
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => copyPublicUrl(screen.publicToken)}
                                  data-testid={`screen-copy-url-${screen.id}`}
                                >
                                  <Copy className="h-4 w-4 mr-2" />
                                  URL Kopiëren
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  data-testid={`screen-settings-${screen.id}`}
                                >
                                  <Settings className="h-4 w-4 mr-2" />
                                  Instellingen
                                </Button>
                              </div>
                            </div>

                            <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <ExternalLink className="h-4 w-4" />
                                <span className="font-mono text-xs break-all">
                                  {window.location.origin}/public/screen/{screen.publicToken}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
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
                    {!announcements || announcements.length === 0 ? (
                      <div className="p-6 text-center text-gray-500" data-testid="no-announcements">
                        Nog geen mededelingen toegevoegd
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {announcements.map((announcement: any) => (
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
                                      Geldig: {formatDateTime(announcement.validFrom)} - {formatDateTime(announcement.validTo)}
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
        </main>
  );
}

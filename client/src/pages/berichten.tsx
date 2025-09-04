import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Mail, Plus, Send, Users, Eye, Settings, Ban } from "lucide-react";

export default function Berichten() {
  const [activeTab, setActiveTab] = useState("templates");
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Check if user has write permissions (not MEDEWERKER)
  const canEdit = user?.role !== 'MEDEWERKER';

  // Fetch data for each tab
  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ["/api/messages/templates"],
    staleTime: 10000,
  });

  const { data: segments, isLoading: segmentsLoading } = useQuery({
    queryKey: ["/api/messages/segments"],
    staleTime: 10000,
  });

  const { data: campaigns, isLoading: campaignsLoading } = useQuery({
    queryKey: ["/api/messages/campaigns"],
    staleTime: 10000,
  });

  return (
    <div className="px-4 sm:px-6 lg:px-8 w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900" data-testid="page-title">Berichten</h1>
          <p className="text-sm text-gray-600 mt-1" data-testid="page-description">
            Beheer e-mail templates, segmenten en campagnes
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-6 w-auto" data-testid="message-tabs">
          <TabsTrigger value="templates" data-testid="tab-templates">
            <Mail className="w-4 h-4 mr-2" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="segments" data-testid="tab-segments">
            <Users className="w-4 h-4 mr-2" />
            Segmenten
          </TabsTrigger>
          <TabsTrigger value="campaigns" data-testid="tab-campaigns">
            <Send className="w-4 h-4 mr-2" />
            Campagnes
          </TabsTrigger>
          <TabsTrigger value="send" data-testid="tab-send">
            <Mail className="w-4 h-4 mr-2" />
            Verzenden
          </TabsTrigger>
          <TabsTrigger value="logs" data-testid="tab-logs">
            <Eye className="w-4 h-4 mr-2" />
            Logs
          </TabsTrigger>
          <TabsTrigger value="unsubscribe" data-testid="tab-unsubscribe">
            <Ban className="w-4 h-4 mr-2" />
            Uitschrijvingen
          </TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">E-mail Templates</h2>
            {canEdit && (
              <Button className="flex items-center gap-2" data-testid="button-new-template">
                <Plus className="w-4 h-4" />
                Nieuwe Template
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="templates-grid">
            {templatesLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                </Card>
              ))
            ) : !templates || templates.length === 0 ? (
              <div className="col-span-full text-center py-12" data-testid="templates-empty-state">
                <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nog geen templates</h3>
                <p className="text-gray-500 mb-4">Maak je eerste e-mail template</p>
                {canEdit && (
                  <Button data-testid="button-add-first-template">
                    <Plus className="w-4 h-4 mr-2" />
                    Template Toevoegen
                  </Button>
                )}
              </div>
            ) : (
              templates.map((template: any) => (
                <Card key={template.id} className="hover:shadow-lg transition-shadow" data-testid={`card-template-${template.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base" data-testid={`text-template-name-${template.id}`}>
                          {template.name}
                        </CardTitle>
                        <CardDescription data-testid={`text-template-subject-${template.id}`}>
                          {template.subject}
                        </CardDescription>
                      </div>
                      <Badge 
                        variant={template.kind === 'MARKETING' ? 'default' : 'secondary'}
                        data-testid={`badge-template-kind-${template.id}`}
                      >
                        {template.kind === 'MARKETING' ? 'Marketing' : 'Transactioneel'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" data-testid={`button-preview-${template.id}`}>
                        <Eye className="w-4 h-4 mr-1" />
                        Preview
                      </Button>
                      {canEdit && (
                        <>
                          <Button size="sm" variant="outline" data-testid={`button-test-${template.id}`}>
                            <Send className="w-4 h-4 mr-1" />
                            Test
                          </Button>
                          <Button size="sm" variant="outline" data-testid={`button-edit-template-${template.id}`}>
                            <Settings className="w-4 h-4 mr-1" />
                            Bewerk
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Segments Tab */}
        <TabsContent value="segments" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Segmenten</h2>
            {canEdit && (
              <Button className="flex items-center gap-2" data-testid="button-new-segment">
                <Plus className="w-4 h-4" />
                Nieuw Segment
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="segments-grid">
            {segmentsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                </Card>
              ))
            ) : !segments || segments.length === 0 ? (
              <div className="col-span-full text-center py-12" data-testid="segments-empty-state">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nog geen segmenten</h3>
                <p className="text-gray-500 mb-4">Maak je eerste lid segment</p>
                {canEdit && (
                  <Button data-testid="button-add-first-segment">
                    <Plus className="w-4 h-4 mr-2" />
                    Segment Toevoegen
                  </Button>
                )}
              </div>
            ) : (
              segments.map((segment: any) => (
                <Card key={segment.id} className="hover:shadow-lg transition-shadow" data-testid={`card-segment-${segment.id}`}>
                  <CardHeader>
                    <CardTitle className="text-base" data-testid={`text-segment-name-${segment.id}`}>
                      {segment.name}
                    </CardTitle>
                    <CardDescription data-testid={`text-segment-rules-${segment.id}`}>
                      {Object.keys(segment.rules || {}).length} filter regels
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" data-testid={`button-preview-segment-${segment.id}`}>
                        <Eye className="w-4 h-4 mr-1" />
                        Preview
                      </Button>
                      {canEdit && (
                        <Button size="sm" variant="outline" data-testid={`button-edit-segment-${segment.id}`}>
                          <Settings className="w-4 h-4 mr-1" />
                          Bewerk
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Campagnes</h2>
            {canEdit && (
              <Button className="flex items-center gap-2" data-testid="button-new-campaign">
                <Plus className="w-4 h-4" />
                Nieuwe Campagne
              </Button>
            )}
          </div>

          <div className="space-y-4" data-testid="campaigns-list">
            {campaignsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                </Card>
              ))
            ) : !campaigns || campaigns.length === 0 ? (
              <div className="text-center py-12" data-testid="campaigns-empty-state">
                <Send className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nog geen campagnes</h3>
                <p className="text-gray-500 mb-4">Maak je eerste e-mail campagne</p>
                {canEdit && (
                  <Button data-testid="button-add-first-campaign">
                    <Plus className="w-4 h-4 mr-2" />
                    Campagne Toevoegen
                  </Button>
                )}
              </div>
            ) : (
              campaigns.map((campaign: any) => (
                <Card key={campaign.campaign.id} className="hover:shadow-lg transition-shadow" data-testid={`card-campaign-${campaign.campaign.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base" data-testid={`text-campaign-name-${campaign.campaign.id}`}>
                          {campaign.campaign.name}
                        </CardTitle>
                        <CardDescription data-testid={`text-campaign-template-${campaign.campaign.id}`}>
                          Template: {campaign.template?.name || 'Onbekend'}
                        </CardDescription>
                      </div>
                      <Badge 
                        variant={campaign.campaign.status === 'SENT' ? 'default' : 'secondary'}
                        data-testid={`badge-campaign-status-${campaign.campaign.id}`}
                      >
                        {campaign.campaign.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" data-testid={`button-view-campaign-${campaign.campaign.id}`}>
                        <Eye className="w-4 h-4 mr-1" />
                        Bekijk
                      </Button>
                      {canEdit && campaign.campaign.status === 'DRAFT' && (
                        <Button size="sm" variant="outline" data-testid={`button-queue-campaign-${campaign.campaign.id}`}>
                          <Send className="w-4 h-4 mr-1" />
                          Verstuur
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Send Tab */}
        <TabsContent value="send" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Enkelvoudige E-mail Verzenden</CardTitle>
              <CardDescription>
                Verstuur een transactionele e-mail naar een specifiek lid of e-mailadres
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="Template code (bijv. 'nieuw_lid')"
                    data-testid="input-template-code"
                  />
                  <Input
                    placeholder="E-mailadres of Lid ID"
                    data-testid="input-recipient"
                  />
                </div>
                {canEdit && (
                  <Button data-testid="button-send-single">
                    <Send className="w-4 h-4 mr-2" />
                    Verstuur E-mail
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>E-mail Logs</CardTitle>
              <CardDescription>
                Overzicht van alle verzonden e-mails en hun status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8" data-testid="logs-placeholder">
                <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">E-mail logs functionaliteit wordt binnenkort toegevoegd</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Unsubscribe Tab */}
        <TabsContent value="unsubscribe" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Uitschrijvingen</CardTitle>
              <CardDescription>
                Beheer uitschrijvingen van marketing e-mails
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8" data-testid="unsubscribe-placeholder">
                <Ban className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Uitschrijving functionaliteit wordt binnenkort toegevoegd</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
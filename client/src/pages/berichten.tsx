import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Plus, Send, Users, Eye, Settings, Ban, Edit, Play, TestTube } from "lucide-react";

// Form schemas
const templateSchema = z.object({
  name: z.string().min(1, "Naam is verplicht"),
  code: z.string().min(1, "Code is verplicht"),
  kind: z.enum(["TRANSACTIONEEL", "MARKETING"]),
  subject: z.string().min(1, "Onderwerp is verplicht"),
  bodyHtml: z.string().min(1, "HTML body is verplicht"),
  bodyText: z.string().min(1, "Text body is verplicht")
});

const segmentSchema = z.object({
  name: z.string().min(1, "Naam is verplicht"),
  rules: z.object({
    memberActive: z.boolean().optional(),
    category: z.array(z.string()).optional(),
    city: z.string().optional(),
    minAge: z.number().optional(),
    maxAge: z.number().optional()
  })
});

const campaignSchema = z.object({
  name: z.string().min(1, "Naam is verplicht"),
  templateId: z.string().min(1, "Template selecteren"),
  segmentId: z.string().min(1, "Segment selecteren"),
  scheduledAt: z.date().optional()
});

export default function Berichten() {
  const [activeTab, setActiveTab] = useState("templates");
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Check if user has write permissions (not MEDEWERKER)
  const canEdit = user?.role !== 'MEDEWERKER';

  // Dialog states
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showSegmentDialog, setShowSegmentDialog] = useState(false);
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [editingSegment, setEditingSegment] = useState<any>(null);
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);
  const [testTemplate, setTestTemplate] = useState<any>(null);
  const [sendTemplateCode, setSendTemplateCode] = useState("");
  const [sendRecipient, setSendRecipient] = useState("");

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

  // Forms
  const templateForm = useForm({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: "",
      code: "",
      kind: "TRANSACTIONEEL" as const,
      subject: "",
      bodyHtml: "",
      bodyText: ""
    }
  });

  const segmentForm = useForm({
    resolver: zodResolver(segmentSchema),
    defaultValues: {
      name: "",
      rules: {
        memberActive: true,
        category: [],
        city: "",
        minAge: undefined,
        maxAge: undefined
      }
    }
  });

  const campaignForm = useForm({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: "",
      templateId: "",
      segmentId: "",
      scheduledAt: undefined
    }
  });

  // Mutations
  const createTemplateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof templateSchema>) => {
      return apiRequest("POST", "/api/messages/templates", {
        name: data.name,
        code: data.code,
        kind: data.kind,
        subject: data.subject,
        body_html: data.bodyHtml,
        body_text: data.bodyText
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages/templates"] });
      toast({ title: "Template aangemaakt", description: "De template is succesvol aangemaakt." });
      setShowTemplateDialog(false);
      templateForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij aanmaken template",
        description: error.message || "Er is een fout opgetreden",
        variant: "destructive"
      });
    }
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: z.infer<typeof templateSchema> }) => {
      return apiRequest("PUT", `/api/messages/templates/${id}`, {
        name: data.name,
        code: data.code,
        kind: data.kind,
        subject: data.subject,
        body_html: data.bodyHtml,
        body_text: data.bodyText
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages/templates"] });
      toast({ title: "Template bijgewerkt", description: "De template is succesvol bijgewerkt." });
      setShowTemplateDialog(false);
      setEditingTemplate(null);
      templateForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij bijwerken template",
        description: error.message || "Er is een fout opgetreden",
        variant: "destructive"
      });
    }
  });

  const createSegmentMutation = useMutation({
    mutationFn: async (data: z.infer<typeof segmentSchema>) => {
      return apiRequest("POST", "/api/messages/segments", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages/segments"] });
      toast({ title: "Segment aangemaakt", description: "Het segment is succesvol aangemaakt." });
      setShowSegmentDialog(false);
      segmentForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij aanmaken segment",
        description: error.message || "Er is een fout opgetreden",
        variant: "destructive"
      });
    }
  });

  const updateSegmentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: z.infer<typeof segmentSchema> }) => {
      return apiRequest("PUT", `/api/messages/segments/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages/segments"] });
      toast({ title: "Segment bijgewerkt", description: "Het segment is succesvol bijgewerkt." });
      setShowSegmentDialog(false);
      setEditingSegment(null);
      segmentForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij bijwerken segment",
        description: error.message || "Er is een fout opgetreden",
        variant: "destructive"
      });
    }
  });

  const createCampaignMutation = useMutation({
    mutationFn: async (data: z.infer<typeof campaignSchema>) => {
      return apiRequest("POST", "/api/messages/campaigns", {
        name: data.name,
        template_id: data.templateId,
        segment_id: data.segmentId,
        scheduled_at: data.scheduledAt?.toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages/campaigns"] });
      toast({ title: "Campagne aangemaakt", description: "De campagne is succesvol aangemaakt." });
      setShowCampaignDialog(false);
      campaignForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij aanmaken campagne",
        description: error.message || "Er is een fout opgetreden",
        variant: "destructive"
      });
    }
  });

  // Handler functions
  const handleEditTemplate = (template: any) => {
    setEditingTemplate(template);
    templateForm.reset({
      name: template.name,
      code: template.code,
      kind: template.kind,
      subject: template.subject,
      bodyHtml: template.body_html,
      bodyText: template.body_text
    });
    setShowTemplateDialog(true);
  };

  const handlePreviewTemplate = (template: any) => {
    setPreviewTemplate(template);
    setShowPreviewDialog(true);
  };

  const handleTestTemplate = (template: any) => {
    setTestTemplate(template);
    setShowTestDialog(true);
  };

  const handleEditSegment = (segment: any) => {
    setEditingSegment(segment);
    segmentForm.reset({
      name: segment.name,
      rules: segment.rules || {}
    });
    setShowSegmentDialog(true);
  };

  const handlePreviewSegment = (segment: any) => {
    toast({
      title: `Segment: ${segment.name}`,
      description: `Filter regels: ${JSON.stringify(segment.rules, null, 2)}`
    });
  };

  const handleNewTemplate = () => {
    setEditingTemplate(null);
    templateForm.reset();
    setShowTemplateDialog(true);
  };

  const handleNewSegment = () => {
    setEditingSegment(null);
    segmentForm.reset();
    setShowSegmentDialog(true);
  };

  const handleNewCampaign = () => {
    campaignForm.reset();
    setShowCampaignDialog(true);
  };

  const onTemplateSubmit = (data: z.infer<typeof templateSchema>) => {
    if (editingTemplate) {
      updateTemplateMutation.mutate({ id: editingTemplate.id, data });
    } else {
      createTemplateMutation.mutate(data);
    }
  };

  const onSegmentSubmit = (data: z.infer<typeof segmentSchema>) => {
    if (editingSegment) {
      updateSegmentMutation.mutate({ id: editingSegment.id, data });
    } else {
      createSegmentMutation.mutate(data);
    }
  };

  const onCampaignSubmit = (data: z.infer<typeof campaignSchema>) => {
    createCampaignMutation.mutate(data);
  };

  // Send single email mutation
  const sendSingleEmailMutation = useMutation({
    mutationFn: async ({ templateCode, recipient }: { templateCode: string; recipient: string }) => {
      return apiRequest("POST", "/api/messages/send", {
        template_code: templateCode,
        recipient: recipient
      });
    },
    onSuccess: () => {
      toast({ title: "E-mail verzonden", description: "De e-mail is succesvol verzonden." });
      setSendTemplateCode("");
      setSendRecipient("");
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij verzenden e-mail",
        description: error.message || "Er is een fout opgetreden",
        variant: "destructive"
      });
    }
  });

  const handleSendSingleEmail = () => {
    if (!sendTemplateCode || !sendRecipient) {
      toast({
        title: "Invoer vereist",
        description: "Vul zowel template code als ontvanger in",
        variant: "destructive"
      });
      return;
    }
    sendSingleEmailMutation.mutate({ templateCode: sendTemplateCode, recipient: sendRecipient });
  };

  return (
    <main className="flex-1 py-4">
      <div className="px-4 sm:px-6 lg:px-8 w-full">
        {/* Page Header */}
        <div className="border-b border-gray-200 pb-5 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900" data-testid="page-title">Berichten</h1>
            <p className="mt-1 text-sm text-gray-700">Beheer e-mail templates, segmenten en campagnes</p>
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
              <Button onClick={handleNewTemplate} className="flex items-center gap-2" data-testid="button-new-template">
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
            ) : !templates || !Array.isArray(templates) || templates.length === 0 ? (
              <div className="col-span-full text-center py-12" data-testid="templates-empty-state">
                <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nog geen templates</h3>
                <p className="text-gray-500 mb-4">Maak je eerste e-mail template</p>
                {canEdit && (
                  <Button onClick={handleNewTemplate} data-testid="button-add-first-template">
                    <Plus className="w-4 h-4 mr-2" />
                    Template Toevoegen
                  </Button>
                )}
              </div>
            ) : (
              Array.isArray(templates) && templates.map((template: any) => (
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
                      <Button size="sm" variant="outline" onClick={() => handlePreviewTemplate(template)} data-testid={`button-preview-${template.id}`}>
                        <Eye className="w-4 h-4 mr-1" />
                        Preview
                      </Button>
                      {canEdit && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => handleTestTemplate(template)} data-testid={`button-test-${template.id}`}>
                            <TestTube className="w-4 h-4 mr-1" />
                            Test
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleEditTemplate(template)} data-testid={`button-edit-template-${template.id}`}>
                            <Edit className="w-4 h-4 mr-1" />
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
              <Button onClick={handleNewSegment} className="flex items-center gap-2" data-testid="button-new-segment">
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
            ) : !segments || !Array.isArray(segments) || segments.length === 0 ? (
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
              Array.isArray(segments) && segments.map((segment: any) => (
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
                      <Button size="sm" variant="outline" onClick={() => handlePreviewSegment(segment)} data-testid={`button-preview-segment-${segment.id}`}>
                        <Eye className="w-4 h-4 mr-1" />
                        Preview
                      </Button>
                      {canEdit && (
                        <Button size="sm" variant="outline" onClick={() => handleEditSegment(segment)} data-testid={`button-edit-segment-${segment.id}`}>
                          <Edit className="w-4 h-4 mr-1" />
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
              <Button onClick={handleNewCampaign} className="flex items-center gap-2" data-testid="button-new-campaign">
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
            ) : !campaigns || !Array.isArray(campaigns) || campaigns.length === 0 ? (
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
              Array.isArray(campaigns) && campaigns.map((campaign: any) => (
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
                  <div>
                    <Label>Template</Label>
                    <Select value={sendTemplateCode} onValueChange={setSendTemplateCode}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecteer template" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.isArray(templates) && templates.map((template: any) => (
                          <SelectItem key={template.id} value={template.code}>
                            {template.name} ({template.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Ontvanger</Label>
                    <Input
                      value={sendRecipient}
                      onChange={(e) => setSendRecipient(e.target.value)}
                      placeholder="E-mailadres of Lid ID"
                      data-testid="input-recipient"
                    />
                  </div>
                </div>
                {canEdit && (
                  <Button 
                    onClick={handleSendSingleEmail}
                    disabled={sendSingleEmailMutation.isPending || !sendTemplateCode || !sendRecipient}
                    data-testid="button-send-single"
                  >
                    {sendSingleEmailMutation.isPending ? (
                      <>Verzenden...</>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Verstuur E-mail
                      </>
                    )}
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

      {/* Template Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Template Bewerken' : 'Nieuwe Template'}</DialogTitle>
          </DialogHeader>
          <Form {...templateForm}>
            <form onSubmit={templateForm.handleSubmit(onTemplateSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={templateForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Naam</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Bijv. Welkomstmail" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={templateForm.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Code</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="bijv. welkomst_mail" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={templateForm.control}
                  name="kind"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecteer type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="TRANSACTIONEEL">Transactioneel</SelectItem>
                          <SelectItem value="MARKETING">Marketing</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={templateForm.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Onderwerp</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="E-mail onderwerp" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={templateForm.control}
                name="bodyHtml"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>HTML Body</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="HTML inhoud van de e-mail" rows={8} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={templateForm.control}
                name="bodyText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Text Body</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Platte tekst versie" rows={6} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setShowTemplateDialog(false)}>
                  Annuleren
                </Button>
                <Button type="submit" disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}>
                  {editingTemplate ? 'Bijwerken' : 'Aanmaken'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Segment Dialog */}
      <Dialog open={showSegmentDialog} onOpenChange={setShowSegmentDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingSegment ? 'Segment Bewerken' : 'Nieuw Segment'}</DialogTitle>
          </DialogHeader>
          <Form {...segmentForm}>
            <form onSubmit={segmentForm.handleSubmit(onSegmentSubmit)} className="space-y-6">
              <FormField
                control={segmentForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Segment Naam</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Bijv. Actieve Leden" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <Label>Filter Regels</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Alleen Actieve Leden</Label>
                    <Select
                      value={segmentForm.watch("rules.memberActive") ? "true" : "false"}
                      onValueChange={(value) => segmentForm.setValue("rules.memberActive", value === "true")}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Ja</SelectItem>
                        <SelectItem value="false">Nee</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Stad</Label>
                    <Input 
                      value={segmentForm.watch("rules.city") || ""}
                      onChange={(e) => segmentForm.setValue("rules.city", e.target.value)}
                      placeholder="Bijv. Antwerpen"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setShowSegmentDialog(false)}>
                  Annuleren
                </Button>
                <Button type="submit" disabled={createSegmentMutation.isPending || updateSegmentMutation.isPending}>
                  {editingSegment ? 'Bijwerken' : 'Aanmaken'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Campaign Dialog */}
      <Dialog open={showCampaignDialog} onOpenChange={setShowCampaignDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nieuwe Campagne</DialogTitle>
          </DialogHeader>
          <Form {...campaignForm}>
            <form onSubmit={campaignForm.handleSubmit(onCampaignSubmit)} className="space-y-6">
              <FormField
                control={campaignForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Campagne Naam</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Bijv. Nieuwsbrief December" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={campaignForm.control}
                  name="templateId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecteer template" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.isArray(templates) && templates.map((template: any) => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={campaignForm.control}
                  name="segmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Segment</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecteer segment" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.isArray(segments) && segments.map((segment: any) => (
                            <SelectItem key={segment.id} value={segment.id}>
                              {segment.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setShowCampaignDialog(false)}>
                  Annuleren
                </Button>
                <Button type="submit" disabled={createCampaignMutation.isPending}>
                  Campagne Aanmaken
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Template Preview: {previewTemplate?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Onderwerp</Label>
              <p className="text-sm text-gray-700 border rounded p-2">{previewTemplate?.subject}</p>
            </div>
            <div>
              <Label>HTML Preview</Label>
              <div 
                className="border rounded p-4 max-h-96 overflow-auto"
                dangerouslySetInnerHTML={{ __html: previewTemplate?.body_html || '' }}
              />
            </div>
            <div>
              <Label>Text Versie</Label>
              <pre className="text-sm text-gray-700 border rounded p-2 max-h-32 overflow-auto whitespace-pre-wrap">
                {previewTemplate?.body_text}
              </pre>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Test Dialog */}
      <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Test E-mail Verzenden</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Template</Label>
              <p className="text-sm text-gray-700">{testTemplate?.name}</p>
            </div>
            <div>
              <Label htmlFor="testEmail">Test E-mail Adres</Label>
              <Input 
                id="testEmail"
                type="email" 
                placeholder="test@example.com"
                defaultValue={user?.email || ''}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowTestDialog(false)}>
                Annuleren
              </Button>
              <Button>
                <Send className="w-4 h-4 mr-2" />
                Verstuur Test
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      </div>
    </main>
  );
}
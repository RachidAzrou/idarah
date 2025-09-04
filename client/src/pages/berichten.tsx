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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Plus, Send, Users, Eye, Settings, Ban, Edit, Play, TestTube, ChevronDown, ChevronRight, AlertTriangle, Calendar, PartyPopper, Megaphone } from "lucide-react";
import { PiPuzzlePiece, PiHandWaving } from "react-icons/pi";
import { CgTemplate } from "react-icons/cg";
import { MdEvent } from "react-icons/md";
import { LuSend, LuLogs } from "react-icons/lu";
import { TbHandStop, TbClockExclamation } from "react-icons/tb";
import { GrGroup } from "react-icons/gr";

// Function to convert plain text to professional HTML
function convertToHTML(plainText: string): string {
  if (!plainText?.trim()) return "";
  
  const baseStyle = `
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
      .email-container { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
      .content p { margin: 0 0 15px 0; }
      .highlight { background-color: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0; border-radius: 0 4px 4px 0; }
      .expired-amount { background-color: #fef2f2; padding: 15px; border-left: 4px solid #dc2626; margin: 20px 0; border-radius: 0 4px 4px 0; }
      .expired-amount p { color: #991b1b; font-weight: 500; }
      .footer { text-align: center; padding-top: 20px; border-top: 1px solid #e0e0e0; margin-top: 25px; color: #666; font-size: 14px; }
      .button { display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
    </style>
  </head>
  <body>
    <div class="email-container">
      <div class="content">
`;
  
  // Convert plain text to HTML paragraphs
  const htmlContent = plainText
    .split('\n\n') // Split into paragraphs
    .filter(p => p.trim()) // Remove empty paragraphs
    .map(paragraph => {
      const trimmed = paragraph.trim();
      // Handle Handlebars variables and links
      if (trimmed.includes('{{') || trimmed.includes('http')) {
        // Special formatting for links or variables
        if (trimmed.includes('http') || trimmed.includes('{{card.url}}')) {
          return `        <div class="highlight">
          <p>${trimmed}</p>
        </div>`;
        }
      }
      // Red highlighting for expired fee amounts and totals
      if (trimmed.includes('€') && (trimmed.includes('{{#each member.fees.expired}}') || trimmed.includes('{{member.fees.totalExpiredAmount}}') || trimmed.includes('Totaal vervallen bedrag'))) {
        return `        <div class="expired-amount">
        <p>${trimmed}</p>
      </div>`;
      }
      
      // Red highlighting for VERVALLEN BEDRAGEN section
      if (trimmed.includes('VERVALLEN BEDRAGEN') || (trimmed.includes('{{#each vervallenFees}}') || trimmed.includes('vervallenFees'))) {
        return `        <div class="expired-amount">
        <p>${trimmed}</p>
      </div>`;
      }
      
      // Yellow/orange highlighting for OPENSTAANDE BEDRAGEN section  
      if (trimmed.includes('OPENSTAANDE BEDRAGEN') || trimmed.includes('{{#each openstaandeFees}}')) {
        return `        <div style="background-color: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0; border-radius: 0 4px 4px 0;">
        <p style="color: #92400e; font-weight: 500;">${trimmed}</p>
      </div>`;
      }
      
      // Green highlighting for BETAALDE BEDRAGEN section
      if (trimmed.includes('BETAALDE BEDRAGEN') || trimmed.includes('{{#each betaaldeFees}}')) {
        return `        <div style="background-color: #d1fae5; padding: 15px; border-left: 4px solid #10b981; margin: 20px 0; border-radius: 0 4px 4px 0;">
        <p style="color: #065f46; font-weight: 500;">${trimmed}</p>
      </div>`;
      }
      return `        <p>${trimmed}</p>`;
    })
    .join('\n');
  
  const footer = `
      </div>
    </div>
  </body>
  </html>`;
  
  return baseStyle + htmlContent + footer;
}

function convertToPlainText(content: string): string {
  if (!content?.trim()) return "";
  
  // Add professional plain text formatting
  const lines = content
    .split('\n\n')
    .filter(p => p.trim())
    .join('\n\n');
    
  return lines;
}

// Form schemas
const templateSchema = z.object({
  name: z.string().min(1, "Naam is verplicht"),
  code: z.string().min(1, "Code is verplicht"),
  subject: z.string().min(1, "Onderwerp is verplicht"),
  content: z.string().min(1, "Inhoud is verplicht")
});

const segmentSchema = z.object({
  name: z.string().min(1, "Naam is verplicht"),
  rules: z.object({
    memberActive: z.boolean().optional(),
    category: z.array(z.string()).optional(),
    city: z.string().optional(),
    postalCode: z.string().optional(),
    gender: z.string().optional(),
    hasVotingRights: z.boolean().optional(),
    minAge: z.number().optional(),
    maxAge: z.number().optional()
  })
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
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [showMappingTool, setShowMappingTool] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [editingSegment, setEditingSegment] = useState<any>(null);
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);
  const [sendTemplateCode, setSendTemplateCode] = useState("");
  const [sendRecipient, setSendRecipient] = useState("");
  const [sendMode, setSendMode] = useState<"single" | "bulk">("single");
  const [selectedSegment, setSelectedSegment] = useState("");
  const [originalTemplateData, setOriginalTemplateData] = useState<any>(null);

  // Fetch data for each tab
  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ["/api/messages/templates"],
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Debug: Log templates to see what's being rendered
  console.log("Templates data:", templates, "Length:", templates?.length);

  const { data: segments, isLoading: segmentsLoading } = useQuery({
    queryKey: ["/api/messages/segments"],
    staleTime: 10000,
  });


  // Forms
  const templateForm = useForm({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: "",
      code: "",
      subject: "",
      content: ""
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
        postalCode: "",
        gender: "",
        hasVotingRights: undefined,
        minAge: undefined,
        maxAge: undefined
      }
    }
  });


  // Mutations
  const createTemplateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof templateSchema>) => {
      return apiRequest("POST", "/api/messages/templates", {
        name: data.name,
        code: data.code,
        kind: "TRANSACTIONEEL", // Standaard waarde sinds type niet meer relevant is
        subject: data.subject,
        body_html: convertToHTML(data.content),
        body_text: convertToPlainText(data.content),
        content: data.content
      });
    },
    onSuccess: () => {
      // Force refresh templates to get the latest data
      queryClient.invalidateQueries({ queryKey: ["/api/messages/templates"] });
      queryClient.refetchQueries({ queryKey: ["/api/messages/templates"] });
      toast({ title: "Template aangemaakt", description: "De template is succesvol aangemaakt." });
      setShowTemplateDialog(false);
      setOriginalTemplateData(null);
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
      const payload = {
        name: data.name,
        code: data.code,
        kind: "TRANSACTIONEEL", // Standaard waarde sinds type niet meer relevant is
        subject: data.subject,
        body_html: convertToHTML(data.content),
        body_text: convertToPlainText(data.content),
        content: data.content
      };
      return apiRequest("PUT", `/api/messages/templates/${id}`, payload);
    },
    onSuccess: (result) => {
      // Force refresh templates to get the latest data
      queryClient.invalidateQueries({ queryKey: ["/api/messages/templates"] });
      queryClient.refetchQueries({ queryKey: ["/api/messages/templates"] });
      toast({ title: "Template bijgewerkt", description: "De template is succesvol bijgewerkt." });
      setShowTemplateDialog(false);
      setEditingTemplate(null);
      setOriginalTemplateData(null);
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


  // Check if template form has changes
  const hasTemplateChanges = () => {
    if (!editingTemplate || !originalTemplateData) return false;
    const currentData = templateForm.getValues();
    return (
      currentData.name !== originalTemplateData.name ||
      currentData.code !== originalTemplateData.code ||
      currentData.subject !== originalTemplateData.subject ||
      currentData.content !== originalTemplateData.content
    );
  };

  // Handler functions
  const handleEditTemplate = (template: any) => {
    setEditingTemplate(template);
    
    let content = "";
    
    // Priority: content field (new format) > text content > simplified HTML
    if (template.content) {
      content = template.content;
    } else {
      const textContent = template.bodyText || template.body_text || "";
      const htmlContent = template.bodyHtml || template.body_html || "";
      
      // Use text content if available, otherwise strip HTML tags from HTML content
      if (textContent) {
        content = textContent;
      } else if (htmlContent) {
        // Simple HTML tag removal for editing
        content = htmlContent
          .replace(/<[^>]*>/g, '') // Remove HTML tags
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim();
      }
    }
    
    const formData = {
      name: template.name,
      code: template.code,
      subject: template.subject,
      content: content
    };
    
    templateForm.reset(formData);
    setOriginalTemplateData(formData); // Store original data for comparison
    setShowTemplateDialog(true);
  };

  const handlePreviewTemplate = (template: any) => {
    // Generate preview content from the stored content or use existing HTML/text
    let previewData = { ...template };
    
    // Always prioritize content field and generate fresh HTML for preview
    if (template.content) {
      previewData.bodyHtml = convertToHTML(template.content);
      previewData.bodyText = convertToPlainText(template.content);
    } else {
      // Fallback to existing HTML/text content for old templates
      previewData.bodyHtml = template.bodyHtml || template.body_html;
      previewData.bodyText = template.bodyText || template.body_text;
    }
    
    setPreviewTemplate(previewData);
    setShowPreviewDialog(true);
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
    setOriginalTemplateData(null);
    templateForm.reset();
    setShowTemplateDialog(true);
  };

  const handleNewSegment = () => {
    setEditingSegment(null);
    segmentForm.reset();
    setShowSegmentDialog(true);
  };


  const onTemplateSubmit = (data: z.infer<typeof templateSchema>) => {
    console.log('Submitting template with data:', data);
    if (editingTemplate) {
      console.log('Updating existing template:', editingTemplate.id);
      updateTemplateMutation.mutate({ id: editingTemplate.id, data });
    } else {
      console.log('Creating new template');
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
        <TabsList className="grid grid-cols-3 w-auto" data-testid="message-tabs">
          <TabsTrigger value="templates" data-testid="tab-templates">
            <CgTemplate className="w-4 h-4 mr-2" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="segments" data-testid="tab-segments">
            <PiPuzzlePiece className="w-4 h-4 mr-2" />
            Segmenten
          </TabsTrigger>
          <TabsTrigger value="send" data-testid="tab-send">
            <LuSend className="w-4 h-4 mr-2" />
            Verzenden
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
              <>
                {/* Template Voorbeelden Cards */}
                {canEdit && (
                  <>
                    {/* Welkomstmail Nieuw Lid Template Card */}
                    <Card className="hover:shadow-lg transition-shadow border-gray-200 bg-gray-50" data-testid="card-template-welcome">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <PiHandWaving className="w-5 h-5 text-gray-600" />
                              <CardTitle className="text-base text-gray-900" data-testid="text-template-name-welcome">
                                Welkomstmail Nieuw Lid
                              </CardTitle>
                            </div>
                            <CardDescription className="text-gray-700" data-testid="text-template-subject-welcome">
                              Verwelkomingsbericht voor nieuwe leden
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => {
                            const welcomeTemplate = {
                              name: "Welkomstmail Nieuw Lid",
                              code: "WELCOME_NEW_MEMBER",
                              subject: "Welkom bij {{tenant.name}}",
                              content: `Beste {{member.firstName}} {{member.lastName}},

Van harte welkom bij {{tenant.name}}!

We zijn verheugd u als nieuw lid te verwelkomen in onze gemeenschap.

Uw lidgegevens:
- Lidnummer: {{member.memberNumber}}
- Categorie: {{member.category}}
- E-mailadres: {{member.email}}

Voor vragen kunt u altijd contact met ons opnemen via {{tenant.email}} of telefonisch via {{tenant.phone}}.

Nogmaals welkom!

Met vriendelijke groet,
{{tenant.name}}`
                            };
                            handlePreviewTemplate(welcomeTemplate);
                          }} data-testid="button-preview-welcome">
                            <Eye className="w-4 h-4 mr-1" />
                            Preview
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setEditingTemplate(null);
                              templateForm.reset({
                                name: "Welkomstmail Nieuw Lid",
                                code: "WELCOME_NEW_MEMBER",
                                subject: "Welkom bij {{tenant.name}}",
                                content: `Beste {{member.firstName}} {{member.lastName}},

Van harte welkom bij {{tenant.name}}!

We zijn verheugd u als nieuw lid te verwelkomen in onze gemeenschap.

Uw lidgegevens:
- Lidnummer: {{member.memberNumber}}
- Categorie: {{member.category}}
- E-mailadres: {{member.email}}

Voor vragen kunt u altijd contact met ons opnemen via {{tenant.email}} of telefonisch via {{tenant.phone}}.

Nogmaals welkom!

Met vriendelijke groet,
{{tenant.name}}`
                              });
                              setShowTemplateDialog(true);
                            }}
                            data-testid="button-create-welcome-template"
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Bewerk
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Vervallen Lidgeld Template Card */}
                    <Card className="hover:shadow-lg transition-shadow border-gray-200 bg-gray-50" data-testid="card-template-expired">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <TbClockExclamation className="w-5 h-5 text-gray-600" />
                              <CardTitle className="text-base text-gray-900" data-testid="text-template-name-expired">
                                Vervallen Lidgeld
                              </CardTitle>
                            </div>
                            <CardDescription className="text-gray-700" data-testid="text-template-subject-expired">
                              Herinnering voor vervallen lidgeld
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => {
                            const expiredTemplate = {
                              name: "Vervallen Lidgeld",
                              code: "EXPIRED_MEMBERSHIP",
                              subject: "Herinnering vervallen lidgeld - {{tenant.name}}",
                              content: `Beste {{member.firstName}} {{member.lastName}},

We willen u eraan herinneren dat uw lidgeld nog niet is betaald.

{{#if vervallenFees}}
VERVALLEN BEDRAGEN:
{{#each vervallenFees}}
- {{this.description}}: {{currency this.amount}} (vervaldatum: {{date this.dueDate}})
{{/each}}

Totaal vervallen bedrag: {{currency member.fees.totalExpiredAmount}}
{{/if}}

{{#if openstaandeFees}}
OPENSTAANDE BEDRAGEN:
{{#each openstaandeFees}}
- {{this.description}}: {{currency this.amount}} (vervaldatum: {{date this.dueDate}})
{{/each}}
{{/if}}

{{#if betaaldeFees}}
BETAALDE BEDRAGEN (ter referentie):
{{#each betaaldeFees}}
- {{this.description}}: {{currency this.amount}} (betaald op: {{date this.paidAt}})
{{/each}}
{{/if}}

Gelieve de openstaande en vervallen bedragen zo spoedig mogelijk te voldoen. Voor vragen over de betaling kunt u contact met ons opnemen.

Betaalgegevens:
Rekeningnummer: [IBAN NUMMER]
Omschrijving: Lidgeld {{member.memberNumber}}

Met vriendelijke groet,
{{tenant.name}}`
                            };
                            handlePreviewTemplate(expiredTemplate);
                          }} data-testid="button-preview-expired">
                            <Eye className="w-4 h-4 mr-1" />
                            Preview
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setEditingTemplate(null);
                              templateForm.reset({
                                name: "Vervallen Lidgeld",
                                code: "EXPIRED_MEMBERSHIP",
                                subject: "Herinnering vervallen lidgeld - {{tenant.name}}",
                                content: `Beste {{member.firstName}} {{member.lastName}},

We willen u eraan herinneren dat uw lidgeld nog niet is betaald.

{{#if vervallenFees}}
VERVALLEN BEDRAGEN:
{{#each vervallenFees}}
- {{this.description}}: {{currency this.amount}} (vervaldatum: {{date this.dueDate}})
{{/each}}

Totaal vervallen bedrag: {{currency member.fees.totalExpiredAmount}}
{{/if}}

{{#if openstaandeFees}}
OPENSTAANDE BEDRAGEN:
{{#each openstaandeFees}}
- {{this.description}}: {{currency this.amount}} (vervaldatum: {{date this.dueDate}})
{{/each}}
{{/if}}

{{#if betaaldeFees}}
BETAALDE BEDRAGEN (ter referentie):
{{#each betaaldeFees}}
- {{this.description}}: {{currency this.amount}} (betaald op: {{date this.paidAt}})
{{/each}}
{{/if}}

Gelieve de openstaande en vervallen bedragen zo spoedig mogelijk te voldoen. Voor vragen over de betaling kunt u contact met ons opnemen.

Betaalgegevens:
Rekeningnummer: [IBAN NUMMER]
Omschrijving: Lidgeld {{member.memberNumber}}

Met vriendelijke groet,
{{tenant.name}}`
                              });
                              setShowTemplateDialog(true);
                            }}
                            data-testid="button-create-expired-template"
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Bewerk
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Algemene Vergadering Template Card */}
                    <Card className="hover:shadow-lg transition-shadow border-gray-200 bg-gray-50" data-testid="card-template-assembly">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <GrGroup className="w-5 h-5 text-gray-600" />
                              <CardTitle className="text-base text-gray-900" data-testid="text-template-name-assembly">
                                Uitnodiging Algemene Vergadering
                              </CardTitle>
                            </div>
                            <CardDescription className="text-gray-700" data-testid="text-template-subject-assembly">
                              Formele uitnodiging voor jaarvergadering
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => {
                            const assemblyTemplate = {
                              name: "Uitnodiging Algemene Vergadering",
                              code: "GENERAL_ASSEMBLY",
                              subject: "Uitnodiging Algemene Vergadering - {{tenant.name}}",
                              content: `Beste {{member.firstName}} {{member.lastName}},

Hierbij nodigen wij u uit voor de Algemene Vergadering van {{tenant.name}}.

Datum: [DATUM]
Tijd: [TIJD]
Locatie: [LOCATIE/ADRES]

Agenda:
- Opening door de voorzitter
- Verslag vorige vergadering
- Jaarverslag bestuur
- Financieel verslag
- Verkiezing bestuur
- Rondvraag

Uw aanwezigheid wordt zeer op prijs gesteld. Heeft u vragen of suggesties voor de agenda, dan kunt u contact met ons opnemen.

Voor leden met stemrecht: vergeet niet uw lidkaart mee te nemen.

Met vriendelijke groet,
Het bestuur van {{tenant.name}}`
                            };
                            handlePreviewTemplate(assemblyTemplate);
                          }} data-testid="button-preview-assembly">
                            <Eye className="w-4 h-4 mr-1" />
                            Preview
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setEditingTemplate(null);
                              templateForm.reset({
                                name: "Uitnodiging Algemene Vergadering",
                                code: "GENERAL_ASSEMBLY",
                                subject: "Uitnodiging Algemene Vergadering - {{tenant.name}}",
                                content: `Beste {{member.firstName}} {{member.lastName}},

Hierbij nodigen wij u uit voor de Algemene Vergadering van {{tenant.name}}.

Datum: [DATUM]
Tijd: [TIJD]
Locatie: [LOCATIE/ADRES]

Agenda:
- Opening door de voorzitter
- Verslag vorige vergadering
- Jaarverslag bestuur
- Financieel verslag
- Verkiezing bestuur
- Rondvraag

Uw aanwezigheid wordt zeer op prijs gesteld. Heeft u vragen of suggesties voor de agenda, dan kunt u contact met ons opnemen.

Voor leden met stemrecht: vergeet niet uw lidkaart mee te nemen.

Met vriendelijke groet,
Het bestuur van {{tenant.name}}`
                              });
                              setShowTemplateDialog(true);
                            }}
                            data-testid="button-create-assembly-template"
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Bewerk
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Activiteit/Evenement Template Card */}
                    <Card className="hover:shadow-lg transition-shadow border-gray-200 bg-gray-50" data-testid="card-template-activity">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Megaphone className="w-5 h-5 text-gray-600" />
                              <CardTitle className="text-base text-gray-900" data-testid="text-template-name-activity">
                                Uitnodiging Activiteit/Evenement
                              </CardTitle>
                            </div>
                            <CardDescription className="text-gray-700" data-testid="text-template-subject-activity">
                              Template voor activiteiten en evenementen
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => {
                            const activityTemplate = {
                              name: "Uitnodiging Activiteit/Evenement",
                              code: "ACTIVITY_EVENT",
                              subject: "Uitnodiging: [ACTIVITEIT NAAM] - {{tenant.name}}",
                              content: `Beste {{member.firstName}} {{member.lastName}},

We nodigen u graag uit voor onze aankomende activiteit!

🎯 Activiteit: [ACTIVITEIT NAAM]
📅 Datum: [DATUM]
🕐 Tijd: [STARTTIJD] - [EINDTIJD]  
📍 Locatie: [LOCATIE/ADRES]

Over deze activiteit:
[BESCHRIJVING VAN DE ACTIVITEIT]

Praktische informatie:
- Kosten: [GRATIS / €X per persoon]
- Inschrijving vereist: [JA/NEE]
- Wat meenemen: [ITEMS]
- Contact voor vragen: {{tenant.email}}

We hopen u te zien bij deze bijzondere gelegenheid!

Heeft u vragen of speciale wensen? Neem gerust contact met ons op.

Met hartelijke groet,
{{tenant.name}}`
                            };
                            handlePreviewTemplate(activityTemplate);
                          }} data-testid="button-preview-activity">
                            <Eye className="w-4 h-4 mr-1" />
                            Preview
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setEditingTemplate(null);
                              templateForm.reset({
                                name: "Uitnodiging Activiteit/Evenement",
                                code: "ACTIVITY_EVENT",
                                subject: "Uitnodiging: [ACTIVITEIT NAAM] - {{tenant.name}}",
                                content: `Beste {{member.firstName}} {{member.lastName}},

We nodigen u graag uit voor onze aankomende activiteit!

🎯 Activiteit: [ACTIVITEIT NAAM]
📅 Datum: [DATUM]
🕐 Tijd: [STARTTIJD] - [EINDTIJD]  
📍 Locatie: [LOCATIE/ADRES]

Over deze activiteit:
[BESCHRIJVING VAN DE ACTIVITEIT]

Praktische informatie:
- Kosten: [GRATIS / €X per persoon]
- Inschrijving vereist: [JA/NEE]
- Wat meenemen: [ITEMS]
- Contact voor vragen: {{tenant.email}}

We hopen u te zien bij deze bijzondere gelegenheid!

Heeft u vragen of speciale wensen? Neem gerust contact met ons op.

Met hartelijke groet,
{{tenant.name}}`
                              });
                              setShowTemplateDialog(true);
                            }}
                            data-testid="button-create-activity-template"
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Bewerk
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Feestbegroeting Template Card */}
                    <Card className="hover:shadow-lg transition-shadow border-gray-200 bg-gray-50" data-testid="card-template-celebration">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <PartyPopper className="w-5 h-5 text-gray-600" />
                              <CardTitle className="text-base text-gray-900" data-testid="text-template-name-celebration">
                                Feestbegroeting
                              </CardTitle>
                            </div>
                            <CardDescription className="text-gray-700" data-testid="text-template-subject-celebration">
                              Template voor feesten en festiviteiten
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => {
                            const celebrationTemplate = {
                              name: "Feestbegroeting",
                              code: "CELEBRATION",
                              subject: "Uitnodiging: [FESTIVITEIT] - {{tenant.name}}",
                              content: `Beste {{member.firstName}} {{member.lastName}},

Het is ons een genoegen u uit te nodigen voor onze festiviteit!

🎉 Gelegenheid: [FESTIVITEIT NAAM]
📅 Datum: [DATUM]
🕐 Tijd: [STARTTIJD]
📍 Locatie: [LOCATIE/ADRES]

Programma:
[TIJDSCHEMA VAN DE FESTIVITEIT]

Wat kunt u verwachten:
- [ACTIVITEIT 1]
- [ACTIVITEIT 2] 
- [ETEN/DRINKEN]
- [ENTERTAINMENT]

Praktische zaken:
- Toegang: [GRATIS/BIJDRAGE]
- Kledingcode: [INFORMEEL/FORMEEL/TRADITIONEEL]
- Parkeren: [INFORMATIE]
- Kinderen welkom: [JA/NEE]

Voor catering en organisatie is het fijn als u uw komst bevestigt via {{tenant.email}} of telefonisch.

We kijken ernaar uit om samen met u te vieren!

Met feestelijke groet,
Het organisatieteam van {{tenant.name}}`
                            };
                            handlePreviewTemplate(celebrationTemplate);
                          }} data-testid="button-preview-celebration">
                            <Eye className="w-4 h-4 mr-1" />
                            Preview
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setEditingTemplate(null);
                              templateForm.reset({
                                name: "Feestbegroeting",
                                code: "CELEBRATION",
                                subject: "Uitnodiging: [FESTIVITEIT] - {{tenant.name}}",
                                content: `Beste {{member.firstName}} {{member.lastName}},

Het is ons een genoegen u uit te nodigen voor onze festiviteit!

🎉 Gelegenheid: [FESTIVITEIT NAAM]
📅 Datum: [DATUM]
🕐 Tijd: [STARTTIJD]
📍 Locatie: [LOCATIE/ADRES]

Programma:
[TIJDSCHEMA VAN DE FESTIVITEIT]

Wat kunt u verwachten:
- [ACTIVITEIT 1]
- [ACTIVITEIT 2] 
- [ETEN/DRINKEN]
- [ENTERTAINMENT]

Praktische zaken:
- Toegang: [GRATIS/BIJDRAGE]
- Kledingcode: [INFORMEEL/FORMEEL/TRADITIONEEL]
- Parkeren: [INFORMATIE]
- Kinderen welkom: [JA/NEE]

Voor catering en organisatie is het fijn als u uw komst bevestigt via {{tenant.email}} of telefonisch.

We kijken ernaar uit om samen met u te vieren!

Met feestelijke groet,
Het organisatieteam van {{tenant.name}}`
                              });
                              setShowTemplateDialog(true);
                            }}
                            data-testid="button-create-celebration-template"
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Bewerk
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
                
                {/* Regular Templates */}
                {Array.isArray(templates) && templates.map((template: any) => {
                  // Function to get icon based on template name
                  const getTemplateIcon = (name: string) => {
                    const lowerName = name.toLowerCase();
                    if (lowerName.includes('welkomstmail') || lowerName.includes('welkom')) {
                      return <PiHandWaving className="w-5 h-5 text-gray-600" />;
                    } else if (lowerName.includes('vervallen') || lowerName.includes('lidgeld') || lowerName.includes('herinnering')) {
                      return <TbClockExclamation className="w-5 h-5 text-gray-600" />;
                    } else if (lowerName.includes('algemene vergadering') || lowerName.includes('vergadering')) {
                      return <GrGroup className="w-5 h-5 text-gray-600" />;
                    } else if (lowerName.includes('festiviteit') || lowerName.includes('feest')) {
                      return <PartyPopper className="w-5 h-5 text-gray-600" />;
                    } else if (lowerName.includes('activiteit') || lowerName.includes('evenement')) {
                      return <Megaphone className="w-5 h-5 text-gray-600" />;
                    } else {
                      return <Mail className="w-5 h-5 text-gray-600" />;
                    }
                  };

                  return (
                    <Card key={template.id} className="hover:shadow-lg transition-shadow border-gray-200 bg-gray-50" data-testid={`card-template-${template.id}`}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              {getTemplateIcon(template.name)}
                              <CardTitle className="text-base text-gray-900" data-testid={`text-template-name-${template.id}`}>
                                {template.name}
                              </CardTitle>
                            </div>
                            <CardDescription className="text-gray-700" data-testid={`text-template-subject-${template.id}`}>
                              {template.subject}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handlePreviewTemplate(template)} data-testid={`button-preview-${template.id}`}>
                            <Eye className="w-4 h-4 mr-1" />
                            Preview
                          </Button>
                          {canEdit && (
                            <Button size="sm" variant="outline" onClick={() => handleEditTemplate(template)} data-testid={`button-edit-template-${template.id}`}>
                              <Edit className="w-4 h-4 mr-1" />
                              Bewerk
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </>
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


        {/* Send Tab */}
        <TabsContent value="send" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">E-mail Verzenden</h2>
              <p className="text-sm text-gray-600 mt-1">
                Verstuur e-mails naar individuele leden of hele groepen
              </p>
            </div>
          </div>

          {/* Send Mode Toggle */}
          <div className="flex gap-2 p-1 bg-gray-100 rounded-lg w-fit">
            <Button 
              variant={sendMode === "single" ? "default" : "ghost"}
              size="sm"
              onClick={() => setSendMode("single")}
              data-testid="button-mode-single"
            >
              💬 Enkel Lid
            </Button>
            <Button 
              variant={sendMode === "bulk" ? "default" : "ghost"}
              size="sm"
              onClick={() => setSendMode("bulk")}
              data-testid="button-mode-bulk"
            >
              📢 Bulk Verzending
            </Button>
          </div>

          {sendMode === "single" ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="w-5 h-5" />
                  Enkelvoudige E-mail
                </CardTitle>
                <CardDescription>
                  Verstuur een e-mail naar een specifiek lid of e-mailadres
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Template</Label>
                      <Select value={sendTemplateCode} onValueChange={setSendTemplateCode}>
                        <SelectTrigger data-testid="select-template-single">
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
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Bulk E-mail Verzending
                </CardTitle>
                <CardDescription>
                  Verstuur een e-mail naar alle leden in een segment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Template</Label>
                      <Select value={sendTemplateCode} onValueChange={setSendTemplateCode}>
                        <SelectTrigger data-testid="select-template-bulk">
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
                      <Label>Doelgroep Segment</Label>
                      <Select value={selectedSegment} onValueChange={setSelectedSegment}>
                        <SelectTrigger data-testid="select-segment-bulk">
                          <SelectValue placeholder="Selecteer segment" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.isArray(segments) && segments.map((segment: any) => (
                            <SelectItem key={segment.id} value={segment.id}>
                              {segment.name} - {Object.keys(segment.rules || {}).length} regels
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {selectedSegment && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-2">Segment Overzicht</h4>
                      <p className="text-sm text-blue-700">
                        Segment: {Array.isArray(segments) ? segments.find((s: any) => s.id === selectedSegment)?.name : ''}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Let op: De e-mail wordt verzonden naar alle leden die voldoen aan de segment criteria
                      </p>
                    </div>
                  )}
                  
                  {canEdit && (
                    <Button 
                      onClick={() => {
                        // TODO: Implement bulk send
                        toast({
                          title: "Bulk verzending",
                          description: "Bulk verzending wordt binnenkort geïmplementeerd",
                          variant: "default"
                        });
                      }}
                      disabled={!sendTemplateCode || !selectedSegment}
                      data-testid="button-send-bulk"
                      className="w-full"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Verstuur naar Segment
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

      </Tabs>

      {/* Template Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Template Bewerken' : 'Nieuwe Template'}</DialogTitle>
          </DialogHeader>
          
          <div className="flex gap-6">
            <div className="flex-1">
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

              <FormField
                control={templateForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inhoud</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Schrijf hier de inhoud van je e-mail. Deze wordt automatisch omgezet naar een professionele layout."
                        rows={8}
                        className="resize-none"
                      />
                    </FormControl>
                    <FormDescription>
                      Gebruik Handlebars variabelen zoals {"{{member.firstName}}"} voor personalisatie. De layout wordt automatisch toegepast.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => {
                  setShowTemplateDialog(false);
                  setOriginalTemplateData(null);
                }}>
                  Annuleren
                </Button>
                <Button 
                  type="submit" 
                  disabled={
                    createTemplateMutation.isPending || 
                    updateTemplateMutation.isPending ||
                    (editingTemplate && !hasTemplateChanges())
                  }
                  variant={editingTemplate && !hasTemplateChanges() ? "secondary" : "default"}
                >
                  {editingTemplate ? 
                    (hasTemplateChanges() ? 'Wijzigingen opslaan' : 'Opslaan') : 
                    'Aanmaken'
                  }
                </Button>
              </div>
            </form>
          </Form>
            </div>
            
            {/* Handlebars Mapping Tool */}
            <div className="w-80 border-l pl-6">
              <div className="sticky top-0">
                <h3 className="text-lg font-semibold mb-4">Handlebars Variabelen</h3>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-gray-900">Lid Informatie</h4>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <code className="bg-gray-100 px-1 rounded">{"{{member.firstName}}"}</code>
                        <span className="text-gray-500">Voornaam</span>
                      </div>
                      <div className="flex justify-between">
                        <code className="bg-gray-100 px-1 rounded">{"{{member.lastName}}"}</code>
                        <span className="text-gray-500">Achternaam</span>
                      </div>
                      <div className="flex justify-between">
                        <code className="bg-gray-100 px-1 rounded">{"{{member.email}}"}</code>
                        <span className="text-gray-500">E-mailadres</span>
                      </div>
                      <div className="flex justify-between">
                        <code className="bg-gray-100 px-1 rounded">{"{{member.memberNumber}}"}</code>
                        <span className="text-gray-500">Lidnummer</span>
                      </div>
                      <div className="flex justify-between">
                        <code className="bg-gray-100 px-1 rounded">{"{{member.category}}"}</code>
                        <span className="text-gray-500">Categorie</span>
                      </div>
                      <div className="flex justify-between">
                        <code className="bg-gray-100 px-1 rounded">{"{{member.city}}"}</code>
                        <span className="text-gray-500">Stad</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-gray-900">Organisatie</h4>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <code className="bg-gray-100 px-1 rounded">{"{{tenant.name}}"}</code>
                        <span className="text-gray-500">Naam organisatie</span>
                      </div>
                      <div className="flex justify-between">
                        <code className="bg-gray-100 px-1 rounded">{"{{tenant.email}}"}</code>
                        <span className="text-gray-500">E-mailadres</span>
                      </div>
                      <div className="flex justify-between">
                        <code className="bg-gray-100 px-1 rounded">{"{{tenant.phone}}"}</code>
                        <span className="text-gray-500">Telefoonnummer</span>
                      </div>
                      <div className="flex justify-between">
                        <code className="bg-gray-100 px-1 rounded">{"{{tenant.website}}"}</code>
                        <span className="text-gray-500">Website</span>
                      </div>
                      <div className="flex justify-between">
                        <code className="bg-gray-100 px-1 rounded">{"{{tenant.street}}"}</code>
                        <span className="text-gray-500">Straat</span>
                      </div>
                      <div className="flex justify-between">
                        <code className="bg-gray-100 px-1 rounded">{"{{tenant.number}}"}</code>
                        <span className="text-gray-500">Huisnummer</span>
                      </div>
                      <div className="flex justify-between">
                        <code className="bg-gray-100 px-1 rounded">{"{{tenant.postalCode}}"}</code>
                        <span className="text-gray-500">Postcode</span>
                      </div>
                      <div className="flex justify-between">
                        <code className="bg-gray-100 px-1 rounded">{"{{tenant.city}}"}</code>
                        <span className="text-gray-500">Stad</span>
                      </div>
                      <div className="flex justify-between">
                        <code className="bg-gray-100 px-1 rounded">{"{{tenant.country}}"}</code>
                        <span className="text-gray-500">Land</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-gray-900">Lidkaart</h4>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <code className="bg-gray-100 px-1 rounded">{"{{card.url}}"}</code>
                        <span className="text-gray-500">Link naar lidkaart</span>
                      </div>
                      <div className="flex justify-between">
                        <code className="bg-gray-100 px-1 rounded">{"{{card.qrCode}}"}</code>
                        <span className="text-gray-500">QR code URL</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-gray-900">Lidgelden</h4>
                    <div className="space-y-1 text-xs">
                      <div className="text-gray-600 mb-1">Loop door alle lidgelden:</div>
                      <code className="bg-gray-100 px-1 rounded text-xs">{"{{#each fees}}"}</code>
                      <div className="ml-2 space-y-1">
                        <div className="flex justify-between">
                          <code className="bg-gray-100 px-1 rounded">{"{{currency amount}}"}</code>
                          <span className="text-gray-500">Bedrag</span>
                        </div>
                        <div className="flex justify-between">
                          <code className="bg-gray-100 px-1 rounded">{"{{date periodStart}}"}</code>
                          <span className="text-gray-500">Start periode</span>
                        </div>
                        <div className="flex justify-between">
                          <code className="bg-gray-100 px-1 rounded">{"{{date periodEnd}}"}</code>
                          <span className="text-gray-500">Eind periode</span>
                        </div>
                        <div className="flex justify-between">
                          <code className="bg-gray-100 px-1 rounded">{"{{date dueDate}}"}</code>
                          <span className="text-gray-500">Vervaldatum</span>
                        </div>
                        <div className="flex justify-between">
                          <code className="bg-gray-100 px-1 rounded">{"{{status}}"}</code>
                          <span className="text-gray-500">Status (BETAALD/OPENSTAAND/VERVALLEN)</span>
                        </div>
                        <div className="flex justify-between">
                          <code className="bg-gray-100 px-1 rounded">{"{{paymentMethod}}"}</code>
                          <span className="text-gray-500">Betaalmethode</span>
                        </div>
                        <div className="flex justify-between">
                          <code className="bg-gray-100 px-1 rounded">{"{{category}}"}</code>
                          <span className="text-gray-500">Lidgeld categorie</span>
                        </div>
                      </div>
                      <code className="bg-gray-100 px-1 rounded text-xs">{"{{/each}}"}</code>
                      
                      <div className="mt-3 pt-2 border-t">
                        <div className="text-gray-600 mb-1">Gefilterde lidgelden:</div>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <code className="bg-blue-100 px-1 rounded">{"{{#each openstaandeFees}}"}</code>
                            <span className="text-gray-500">Alleen openstaande</span>
                          </div>
                          <div className="flex justify-between">
                            <code className="bg-red-100 px-1 rounded">{"{{#each vervallenFees}}"}</code>
                            <span className="text-gray-500">Alleen vervallen</span>
                          </div>
                          <div className="flex justify-between">
                            <code className="bg-green-100 px-1 rounded">{"{{#each betaaldeFees}}"}</code>
                            <span className="text-gray-500">Alleen betaalde</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>


                </div>
              </div>
            </div>
          </div>
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

              <div className="space-y-6">
                <div>
                  <Label className="text-base font-medium">Filter Criteria</Label>
                  <p className="text-sm text-gray-600 mt-1">Definieer wie dit segment moet ontvangen</p>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  {/* Status Filters */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm">Status & Rechten</h4>
                    <div className="space-y-3">
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
                        <Label>Categorie</Label>
                        <Select
                          value={segmentForm.watch("rules.category")?.[0] || ""}
                          onValueChange={(value) => {
                            segmentForm.setValue("rules.category" as any, value ? [value] : []);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Alle categorieën" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Alle categorieën</SelectItem>
                            <SelectItem value="STUDENT">Student</SelectItem>
                            <SelectItem value="SENIOR">Senior</SelectItem>
                            <SelectItem value="REGULIER">Regulier</SelectItem>
                            <SelectItem value="FAMILIE">Familie</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label>Geslacht</Label>
                        <Select
                          value={segmentForm.watch("rules.gender") || ""}
                          onValueChange={(value) => segmentForm.setValue("rules.gender" as any, value || undefined)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Alle geslachten" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Alle geslachten</SelectItem>
                            <SelectItem value="M">Man</SelectItem>
                            <SelectItem value="V">Vrouw</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label>Stemgerechtigden</Label>
                        <Select
                          value={segmentForm.watch("rules.hasVotingRights" as any)?.toString() || ""}
                          onValueChange={(value) => {
                            segmentForm.setValue("rules.hasVotingRights" as any, value === "true" ? true : value === "false" ? false : undefined);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Alle leden" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Alle leden</SelectItem>
                            <SelectItem value="true">Alleen stemgerechtigden</SelectItem>
                            <SelectItem value="false">Alleen niet-stemgerechtigden</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  
                  {/* Location & Demographics */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm">Locatie & Leeftijd</h4>
                    <div className="space-y-3">
                      <div>
                        <Label>Stad</Label>
                        <Input 
                          value={segmentForm.watch("rules.city") || ""}
                          onChange={(e) => segmentForm.setValue("rules.city" as any, e.target.value || undefined)}
                          placeholder="Bijv. Antwerpen"
                        />
                      </div>
                      
                      <div>
                        <Label>Postcode</Label>
                        <Input 
                          value={segmentForm.watch("rules.postalCode") || ""}
                          onChange={(e) => segmentForm.setValue("rules.postalCode" as any, e.target.value || undefined)}
                          placeholder="Bijv. 2000"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Min Leeftijd</Label>
                          <Input 
                            type="number"
                            value={segmentForm.watch("rules.minAge" as any)?.toString() || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              segmentForm.setValue("rules.minAge" as any, val ? parseInt(val) : undefined);
                            }}
                            placeholder="18"
                          />
                        </div>
                        <div>
                          <Label>Max Leeftijd</Label>
                          <Input 
                            type="number"
                            value={segmentForm.watch("rules.maxAge" as any)?.toString() || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              segmentForm.setValue("rules.maxAge" as any, val ? parseInt(val) : undefined);
                            }}
                            placeholder="65"
                          />
                        </div>
                      </div>
                    </div>
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


      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Template Preview: {previewTemplate?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">Onderwerp</Label>
              <div className="mt-1 p-3 bg-gray-50 border rounded-md">
                <p className="font-medium text-gray-900">{previewTemplate?.subject}</p>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700">E-mail Inhoud</Label>
              <div className="mt-1 border rounded-md overflow-hidden">
                <div 
                  className="p-4 bg-white max-h-96 overflow-auto"
                  dangerouslySetInnerHTML={{ __html: previewTemplate?.bodyHtml || previewTemplate?.body_html || '' }}
                />
              </div>
            </div>
            
          </div>
        </DialogContent>
      </Dialog>


      </div>
    </main>
  );
}
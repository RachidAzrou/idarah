import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  Settings, 
  Building2, 
  Palette, 
  CreditCard, 
  Shield, 
  Scale, 
  Users, 
  Plus, 
  MoreVertical,
  Upload,
  Save,
  Eye,
  Trash2
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatDate } from "@/lib/format";

// Schemas for form validation
const organizationSchema = z.object({
  name: z.string().min(1, "Organisatienaam is verplicht"),
  slug: z.string().min(1, "URL slug is verplicht"),
  logoUrl: z.string().optional(),
  primaryColor: z.string().optional(),
});

const membershipFeeSchema = z.object({
  studentFee: z.string().min(1, "Studentenbijdrage is verplicht"),
  adultFee: z.string().min(1, "Standaardbijdrage is verplicht"),
  seniorFee: z.string().min(1, "Seniorenbijdrage is verplicht"),
  defaultPaymentTerm: z.enum(['MONTHLY', 'YEARLY']),
  defaultPaymentMethod: z.enum(['SEPA', 'OVERSCHRIJVING', 'BANCONTACT', 'CASH']),
});

const userSchema = z.object({
  name: z.string().min(1, "Naam is verplicht"),
  email: z.string().email("Ongeldig e-mailadres"),
  role: z.enum(['BEHEERDER', 'MEDEWERKER']),
  password: z.string().min(6, "Wachtwoord moet minstens 6 karakters zijn").optional(),
});

const ruleSchema = z.object({
  name: z.string().min(1, "Regelnaam is verplicht"),
  description: z.string().optional(),
  scope: z.enum(['STEMRECHT', 'VERKIESBAAR', 'FUNCTIE']),
  minYears: z.string().optional(),
  minPayments: z.string().optional(),
  consecutive: z.boolean().default(false),
  categories: z.array(z.string()).default([]),
});

type OrganizationFormData = z.infer<typeof organizationSchema>;
type MembershipFeeFormData = z.infer<typeof membershipFeeSchema>;
type UserFormData = z.infer<typeof userSchema>;
type RuleFormData = z.infer<typeof ruleSchema>;

export default function Instellingen() {
  const [activeTab, setActiveTab] = useState("organization");
  const [showNewUserDialog, setShowNewUserDialog] = useState(false);
  const [showNewRuleDialog, setShowNewRuleDialog] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries
  const { data: tenant } = useQuery({
    queryKey: ["/api/tenant/current"],
    enabled: !!user?.tenantId,
  });

  const { data: users } = useQuery({
    queryKey: ["/api/users"],
  });

  const { data: rules } = useQuery({
    queryKey: ["/api/rules"],
  });

  // Forms
  const organizationForm = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: tenant?.name || "",
      slug: tenant?.slug || "",
      logoUrl: tenant?.logoUrl || "",
      primaryColor: tenant?.primaryColor || "#6366f1",
    },
  });

  const feeForm = useForm<MembershipFeeFormData>({
    resolver: zodResolver(membershipFeeSchema),
    defaultValues: {
      studentFee: "15.00",
      adultFee: "25.00",
      seniorFee: "20.00",
      defaultPaymentTerm: "YEARLY",
      defaultPaymentMethod: "SEPA",
    },
  });

  const userForm = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      role: "MEDEWERKER",
    },
  });

  const ruleForm = useForm<RuleFormData>({
    resolver: zodResolver(ruleSchema),
    defaultValues: {
      scope: "STEMRECHT",
      consecutive: false,
      categories: [],
    },
  });

  // Mutations
  const updateOrganizationMutation = useMutation({
    mutationFn: async (data: OrganizationFormData) => {
      const response = await apiRequest("PUT", "/api/tenant/current", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenant/current"] });
      toast({
        title: "Organisatie bijgewerkt",
        description: "De organisatie-instellingen zijn succesvol bijgewerkt.",
      });
    },
  });

  const updateFeeSettingsMutation = useMutation({
    mutationFn: async (data: MembershipFeeFormData) => {
      const response = await apiRequest("PUT", "/api/settings/fees", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Lidgeld instellingen bijgewerkt",
        description: "De standaard lidgeld instellingen zijn opgeslagen.",
      });
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      const response = await apiRequest("POST", "/api/users", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setShowNewUserDialog(false);
      userForm.reset();
      toast({
        title: "Gebruiker toegevoegd",
        description: "De nieuwe gebruiker is succesvol aangemaakt.",
      });
    },
  });

  const createRuleMutation = useMutation({
    mutationFn: async (data: RuleFormData) => {
      const ruleData = {
        ...data,
        parameters: {
          minYears: data.minYears ? parseInt(data.minYears) : undefined,
          minPayments: data.minPayments ? parseInt(data.minPayments) : undefined,
          consecutive: data.consecutive,
          categories: data.categories,
        },
      };
      const response = await apiRequest("POST", "/api/rules", ruleData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rules"] });
      setShowNewRuleDialog(false);
      ruleForm.reset();
      toast({
        title: "Regel toegevoegd",
        description: "De nieuwe organisatieregel is aangemaakt.",
      });
    },
  });

  const onOrganizationSubmit = (data: OrganizationFormData) => {
    updateOrganizationMutation.mutate(data);
  };

  const onFeeSubmit = (data: MembershipFeeFormData) => {
    updateFeeSettingsMutation.mutate(data);
  };

  const onUserSubmit = (data: UserFormData) => {
    createUserMutation.mutate(data);
  };

  const onRuleSubmit = (data: RuleFormData) => {
    createRuleMutation.mutate(data);
  };

  const getRuleScopeLabel = (scope: string) => {
    const labels: Record<string, string> = {
      'STEMRECHT': 'Stemrecht',
      'VERKIESBAAR': 'Verkiesbaarheid',
      'FUNCTIE': 'Functiebeperking',
    };
    return labels[scope] || scope;
  };

  const getRuleDescription = (rule: any) => {
    const params = rule.parameters || {};
    let description = `Voor ${getRuleScopeLabel(rule.scope).toLowerCase()}`;
    
    if (params.minYears) {
      description += `, minimaal ${params.minYears} jaar lid`;
    }
    if (params.minPayments) {
      description += `, ${params.minPayments} betalingen`;
      if (params.consecutive) {
        description += " (opeenvolgend)";
      }
    }
    if (params.categories && params.categories.length > 0) {
      description += `, voor categorieën: ${params.categories.join(", ")}`;
    }
    
    return description;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      
      <div className="lg:pl-60 flex flex-col flex-1">
        <main className="flex-1 py-8">
          <div className="px-4 sm:px-6 lg:px-8">
            {/* Page Header */}
            <div className="mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900" data-testid="page-title">Instellingen</h1>
                <p className="mt-1 text-sm text-gray-700">Beheer organisatie-instellingen en configuratie</p>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="organization" className="flex items-center gap-2" data-testid="tab-organization">
                  <Building2 className="h-4 w-4" />
                  Organisatie
                </TabsTrigger>
                <TabsTrigger value="branding" className="flex items-center gap-2" data-testid="tab-branding">
                  <Palette className="h-4 w-4" />
                  Branding
                </TabsTrigger>
                <TabsTrigger value="fees" className="flex items-center gap-2" data-testid="tab-fees">
                  <CreditCard className="h-4 w-4" />
                  Lidgelden
                </TabsTrigger>
                <TabsTrigger value="security" className="flex items-center gap-2" data-testid="tab-security">
                  <Shield className="h-4 w-4" />
                  Beveiliging
                </TabsTrigger>
                <TabsTrigger value="rules" className="flex items-center gap-2" data-testid="tab-rules">
                  <Scale className="h-4 w-4" />
                  Organisatieregels
                </TabsTrigger>
              </TabsList>

              <TabsContent value="organization" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Organisatie Informatie</CardTitle>
                    <p className="text-sm text-gray-500">Basis informatie over uw moskee organisatie</p>
                  </CardHeader>
                  <CardContent>
                    <Form {...organizationForm}>
                      <form onSubmit={organizationForm.handleSubmit(onOrganizationSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={organizationForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Organisatienaam</FormLabel>
                                <FormControl>
                                  <Input placeholder="Moskee Al-Nour Brussel" {...field} data-testid="input-org-name" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={organizationForm.control}
                            name="slug"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>URL Identificatie</FormLabel>
                                <FormControl>
                                  <Input placeholder="al-nour-brussel" {...field} data-testid="input-org-slug" />
                                </FormControl>
                                <FormDescription>
                                  Gebruikt voor unieke identificatie in URL's
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="flex justify-end">
                          <Button
                            type="submit"
                            disabled={updateOrganizationMutation.isPending}
                            data-testid="button-save-organization"
                          >
                            <Save className="h-4 w-4 mr-2" />
                            {updateOrganizationMutation.isPending ? "Opslaan..." : "Opslaan"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="branding" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Visuele Identiteit</CardTitle>
                    <p className="text-sm text-gray-500">Logo en kleurenschema voor uw organisatie</p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label>Organisatie Logo</Label>
                      <div className="mt-2 flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center">
                          {tenant?.logoUrl ? (
                            <img src={tenant.logoUrl} alt="Logo" className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            <Building2 className="h-8 w-8 text-gray-400" />
                          )}
                        </div>
                        <Button variant="outline" data-testid="button-upload-logo">
                          <Upload className="h-4 w-4 mr-2" />
                          Logo Uploaden
                        </Button>
                      </div>
                    </div>

                    <div>
                      <FormField
                        control={organizationForm.control}
                        name="primaryColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Primaire Kleur</FormLabel>
                            <div className="flex items-center space-x-4">
                              <FormControl>
                                <Input type="color" {...field} className="w-20 h-10" data-testid="input-primary-color" />
                              </FormControl>
                              <FormControl>
                                <Input {...field} placeholder="#6366f1" className="font-mono" data-testid="input-color-hex" />
                              </FormControl>
                            </div>
                            <FormDescription>
                              Deze kleur wordt gebruikt voor knoppen, accenten en branding elementen
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="pt-4 border-t">
                      <h4 className="font-medium mb-4">Kleur Voorvertoning</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-white border rounded-xl">
                          <Button 
                            style={{ backgroundColor: organizationForm.watch('primaryColor') }}
                            className="w-full text-white"
                          >
                            Primaire Knop
                          </Button>
                        </div>
                        <div className="p-4 bg-white border rounded-xl">
                          <Badge 
                            style={{ backgroundColor: organizationForm.watch('primaryColor') }}
                            className="text-white"
                          >
                            Status Badge
                          </Badge>
                        </div>
                        <div className="p-4 bg-white border rounded-xl">
                          <div 
                            className="w-full h-8 rounded"
                            style={{ backgroundColor: organizationForm.watch('primaryColor') }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="fees" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Standaard Lidgeld Tarieven</CardTitle>
                    <p className="text-sm text-gray-500">Configureer de standaard bijdragen per lidcategorie</p>
                  </CardHeader>
                  <CardContent>
                    <Form {...feeForm}>
                      <form onSubmit={feeForm.handleSubmit(onFeeSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <FormField
                            control={feeForm.control}
                            name="studentFee"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Student Bijdrage</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">€</span>
                                    <Input {...field} type="number" step="0.01" className="pl-8" placeholder="15.00" data-testid="input-student-fee" />
                                  </div>
                                </FormControl>
                                <FormDescription>Per jaar</FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={feeForm.control}
                            name="adultFee"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Standaard Bijdrage</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">€</span>
                                    <Input {...field} type="number" step="0.01" className="pl-8" placeholder="25.00" data-testid="input-adult-fee" />
                                  </div>
                                </FormControl>
                                <FormDescription>Per jaar</FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={feeForm.control}
                            name="seniorFee"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Senior Bijdrage</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">€</span>
                                    <Input {...field} type="number" step="0.01" className="pl-8" placeholder="20.00" data-testid="input-senior-fee" />
                                  </div>
                                </FormControl>
                                <FormDescription>Per jaar</FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={feeForm.control}
                            name="defaultPaymentTerm"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Standaard Betalingstermijn</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-payment-term">
                                      <SelectValue placeholder="Selecteer betalingstermijn" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="MONTHLY">Maandelijks</SelectItem>
                                    <SelectItem value="YEARLY">Jaarlijks</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={feeForm.control}
                            name="defaultPaymentMethod"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Standaard Betaalmethode</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-payment-method">
                                      <SelectValue placeholder="Selecteer betaalmethode" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="SEPA">SEPA Incasso</SelectItem>
                                    <SelectItem value="OVERSCHRIJVING">Overschrijving</SelectItem>
                                    <SelectItem value="BANCONTACT">Bancontact</SelectItem>
                                    <SelectItem value="CASH">Contant</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="flex justify-end">
                          <Button
                            type="submit"
                            disabled={updateFeeSettingsMutation.isPending}
                            data-testid="button-save-fees"
                          >
                            <Save className="h-4 w-4 mr-2" />
                            {updateFeeSettingsMutation.isPending ? "Opslaan..." : "Opslaan"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="security" className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Gebruikersbeheer</CardTitle>
                      <p className="text-sm text-gray-500">Beheer toegang en gebruikersrollen</p>
                    </div>
                    <Dialog open={showNewUserDialog} onOpenChange={setShowNewUserDialog}>
                      <DialogTrigger asChild>
                        <Button data-testid="button-new-user">
                          <Plus className="h-4 w-4 mr-2" />
                          Nieuwe Gebruiker
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Nieuwe Gebruiker Toevoegen</DialogTitle>
                        </DialogHeader>
                        <Form {...userForm}>
                          <form onSubmit={userForm.handleSubmit(onUserSubmit)} className="space-y-4">
                            <FormField
                              control={userForm.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Naam</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Ahmed Benali" {...field} data-testid="input-user-name" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={userForm.control}
                              name="email"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>E-mailadres</FormLabel>
                                  <FormControl>
                                    <Input type="email" placeholder="gebruiker@moskee.be" {...field} data-testid="input-user-email" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={userForm.control}
                              name="role"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Rol</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger data-testid="select-user-role">
                                        <SelectValue placeholder="Selecteer rol" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="BEHEERDER">Beheerder</SelectItem>
                                      <SelectItem value="MEDEWERKER">Medewerker</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={userForm.control}
                              name="password"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Tijdelijk Wachtwoord</FormLabel>
                                  <FormControl>
                                    <Input type="password" placeholder="Minimaal 6 karakters" {...field} data-testid="input-user-password" />
                                  </FormControl>
                                  <FormDescription>
                                    Gebruiker wordt gevraagd om dit te wijzigen bij eerste login
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="flex justify-end gap-2 pt-4">
                              <Button type="button" variant="outline" onClick={() => setShowNewUserDialog(false)}>
                                Annuleren
                              </Button>
                              <Button type="submit" disabled={createUserMutation.isPending} data-testid="button-create-user">
                                {createUserMutation.isPending ? "Aanmaken..." : "Gebruiker Aanmaken"}
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  </CardHeader>
                  
                  <CardContent>
                    {!users || users.length === 0 ? (
                      <div className="text-center py-6 text-gray-500" data-testid="no-users">
                        Nog geen gebruikers toegevoegd
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {users.map((user: any) => (
                          <div key={user.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl" data-testid={`user-item-${user.id}`}>
                            <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                                <Users className="h-5 w-5 text-primary-foreground" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900" data-testid={`user-name-${user.id}`}>
                                  {user.name}
                                </div>
                                <div className="text-sm text-gray-500" data-testid={`user-email-${user.id}`}>
                                  {user.email}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant={user.role === 'BEHEERDER' ? 'default' : 'secondary'} data-testid={`user-role-${user.id}`}>
                                {user.role === 'BEHEERDER' ? 'Beheerder' : 'Medewerker'}
                              </Badge>
                              <Badge variant={user.active ? 'default' : 'destructive'} className={user.active ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}>
                                {user.active ? 'Actief' : 'Inactief'}
                              </Badge>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" data-testid={`user-actions-${user.id}`}>
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>Bewerken</DropdownMenuItem>
                                  <DropdownMenuItem>Wachtwoord resetten</DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-600">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Verwijderen
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="rules" className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Organisatieregels</CardTitle>
                      <p className="text-sm text-gray-500">Configureer regels voor stemrecht, verkiesbaarheid en functies</p>
                    </div>
                    <Dialog open={showNewRuleDialog} onOpenChange={setShowNewRuleDialog}>
                      <DialogTrigger asChild>
                        <Button data-testid="button-new-rule">
                          <Plus className="h-4 w-4 mr-2" />
                          Nieuwe Regel
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Nieuwe Organisatieregel</DialogTitle>
                        </DialogHeader>
                        <Form {...ruleForm}>
                          <form onSubmit={ruleForm.handleSubmit(onRuleSubmit)} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={ruleForm.control}
                                name="name"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Regelnaam</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Stemrecht voor standaard leden" {...field} data-testid="input-rule-name" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={ruleForm.control}
                                name="scope"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Toepassing</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <FormControl>
                                        <SelectTrigger data-testid="select-rule-scope">
                                          <SelectValue placeholder="Selecteer toepassing" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="STEMRECHT">Stemrecht</SelectItem>
                                        <SelectItem value="VERKIESBAAR">Verkiesbaarheid</SelectItem>
                                        <SelectItem value="FUNCTIE">Functiebeperking</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <FormField
                              control={ruleForm.control}
                              name="description"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Beschrijving (optioneel)</FormLabel>
                                  <FormControl>
                                    <Textarea placeholder="Uitleg van de regel..." {...field} data-testid="input-rule-description" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={ruleForm.control}
                                name="minYears"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Minimaal aantal jaren lid</FormLabel>
                                    <FormControl>
                                      <Input type="number" placeholder="5" {...field} data-testid="input-rule-min-years" />
                                    </FormControl>
                                    <FormDescription>Optioneel</FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={ruleForm.control}
                                name="minPayments"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Minimaal aantal betalingen</FormLabel>
                                    <FormControl>
                                      <Input type="number" placeholder="5" {...field} data-testid="input-rule-min-payments" />
                                    </FormControl>
                                    <FormDescription>Optioneel</FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <FormField
                              control={ruleForm.control}
                              name="consecutive"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                  <div className="space-y-0.5">
                                    <FormLabel className="text-base">Opeenvolgende betalingen</FormLabel>
                                    <FormDescription>
                                      Betalingen moeten opeenvolgend zijn (geen gemiste jaren)
                                    </FormDescription>
                                  </div>
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                      data-testid="switch-rule-consecutive"
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />

                            <div className="flex justify-end gap-2 pt-4">
                              <Button type="button" variant="outline" onClick={() => setShowNewRuleDialog(false)}>
                                Annuleren
                              </Button>
                              <Button type="submit" disabled={createRuleMutation.isPending} data-testid="button-create-rule">
                                {createRuleMutation.isPending ? "Aanmaken..." : "Regel Aanmaken"}
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  </CardHeader>
                  
                  <CardContent>
                    {!rules || rules.length === 0 ? (
                      <div className="text-center py-6 text-gray-500" data-testid="no-rules">
                        Nog geen organisatieregels geconfigureerd
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {rules.map((rule: any) => (
                          <div key={rule.id} className="p-4 border border-gray-200 rounded-xl" data-testid={`rule-item-${rule.id}`}>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <h4 className="font-semibold text-gray-900" data-testid={`rule-name-${rule.id}`}>
                                    {rule.name}
                                  </h4>
                                  <Badge variant={rule.active ? 'default' : 'destructive'} className={rule.active ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}>
                                    {rule.active ? 'Actief' : 'Inactief'}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600 mb-2" data-testid={`rule-description-${rule.id}`}>
                                  {getRuleDescription(rule)}
                                </p>
                                {rule.description && (
                                  <p className="text-xs text-gray-500">{rule.description}</p>
                                )}
                                <div className="mt-2 text-xs text-gray-500">
                                  Aangemaakt: {formatDate(rule.createdAt)}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2 ml-4">
                                <Button variant="outline" size="sm" data-testid={`rule-evaluate-${rule.id}`}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Evalueren
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" data-testid={`rule-actions-${rule.id}`}>
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem>Bewerken</DropdownMenuItem>
                                    <DropdownMenuItem>Dupliceren</DropdownMenuItem>
                                    <DropdownMenuItem className="text-red-600">
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Verwijderen
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
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
      </div>
    </div>
  );
}

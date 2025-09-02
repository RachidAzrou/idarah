import { useState, useEffect } from "react";
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
  CreditCard, 
  Shield, 
  Scale, 
  Users, 
  Plus, 
  MoreVertical,
  Upload,
  Save,
  Eye,
  Trash2,
  Edit,
  KeyRound,
  Copy
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatDate } from "@/lib/format";
import { RiAdminLine } from "react-icons/ri";

// Schemas for form validation
const organizationSchema = z.object({
  name: z.string().min(1, "Organisatienaam is verplicht"),
  slug: z.string().min(1, "URL slug is verplicht"),
  street: z.string().optional(),
  number: z.string().optional(),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  email: z.string().email("Ongeldig e-mailadres").optional().or(z.literal("")),
  phone: z.string().optional(),
  website: z.string().url("Ongeldige website URL").optional().or(z.literal("")),
  companyNumber: z.string().optional(),
  companyType: z.enum(['VZW', 'BVBA', 'NV', 'VOF', 'EENMANSZAAK', 'CVBA', 'SE', 'ANDERE']).optional(),
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
  scope: z.enum(['STEMRECHT', 'VERKIESBAAR']),
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
  const [showEditUserDialog, setShowEditUserDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [showNewRuleDialog, setShowNewRuleDialog] = useState(false);
  const [showEditRuleDialog, setShowEditRuleDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [organizationSaved, setOrganizationSaved] = useState(false);
  const [feesSaved, setFeesSaved] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries
  const { data: tenant, isLoading: tenantLoading, isFetching: tenantFetching } = useQuery({
    queryKey: ["/api/tenant/current"],
    staleTime: 30000, // 30 seconds for tenant data
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
      name: "",
      slug: "",
      street: "",
      number: "",
      postalCode: "",
      city: "",
      country: "België",
      email: "",
      phone: "",
      website: "",
      companyNumber: "",
      companyType: undefined,
      logoUrl: "",
      primaryColor: "#6366f1",
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

  // Watch for form changes to enable/disable save buttons
  const organizationFormValues = organizationForm.watch();
  const feeFormValues = feeForm.watch();

  // Reset organization saved state when form changes
  useEffect(() => {
    if (organizationSaved) {
      setOrganizationSaved(false);
    }
  }, [organizationFormValues]);

  // Reset fees saved state when form changes
  useEffect(() => {
    if (feesSaved) {
      setFeesSaved(false);
    }
  }, [feeFormValues]);

  // Initialize form with tenant data when available
  useEffect(() => {
    if (tenant && typeof tenant === 'object' && 'name' in tenant) {
      const tenantData = tenant as any;
      organizationForm.reset({
        name: tenantData.name || "",
        slug: tenantData.slug || "",
        street: tenantData.street || "",
        number: tenantData.number || "",
        postalCode: tenantData.postalCode || "",
        city: tenantData.city || "",
        country: tenantData.country || "België",
        email: tenantData.email || "",
        phone: tenantData.phone || "",
        website: tenantData.website || "",
        companyNumber: tenantData.companyNumber || "",
        companyType: tenantData.companyType || undefined,
        logoUrl: tenantData.logoUrl || "",
        primaryColor: tenantData.primaryColor || "#6366f1",
      });
      
      // Initialize fee form with tenant data
      const feeFormData = {
        studentFee: tenantData.studentFee || "15.00",
        adultFee: tenantData.adultFee || "25.00",
        seniorFee: tenantData.seniorFee || "20.00",
        defaultPaymentTerm: tenantData.defaultPaymentTerm || "YEARLY",
        defaultPaymentMethod: tenantData.defaultPaymentMethod || "SEPA",
      };
      
      feeForm.reset(feeFormData);
      
      setOrganizationSaved(false);
      setFeesSaved(false);
    }
  }, [tenant]);

  const userForm = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      role: "MEDEWERKER",
    },
  });

  const editUserForm = useForm<UserFormData>({
    resolver: zodResolver(userSchema.extend({
      password: z.string().optional(), // Password optional for editing
    })),
  });

  const ruleForm = useForm<RuleFormData>({
    resolver: zodResolver(ruleSchema),
    defaultValues: {
      scope: "STEMRECHT",
      consecutive: false,
      categories: [],
    },
  });

  const editRuleForm = useForm<RuleFormData>({
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
    onSuccess: async (result, variables) => {
      // Optimistic update - update cache immediately
      queryClient.setQueryData(["/api/tenant/current"], (oldData: any) => {
        if (!oldData) return oldData;
        return { ...oldData, ...variables };
      });
      
      await queryClient.invalidateQueries({ queryKey: ["/api/tenant/current"] });
      setOrganizationSaved(true);
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
    onSuccess: async (result, variables) => {
      // Optimistic update - update cache immediately met nieuwe data
      queryClient.setQueryData(["/api/tenant/current"], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          studentFee: variables.studentFee,
          adultFee: variables.adultFee,
          seniorFee: variables.seniorFee,
          defaultPaymentTerm: variables.defaultPaymentTerm,
          defaultPaymentMethod: variables.defaultPaymentMethod,
        };
      });
      
      // Nog steeds invalideren voor zekerheid
      await queryClient.invalidateQueries({ queryKey: ["/api/tenant/current"] });
      
      setFeesSaved(true);
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
    onSuccess: async (newUser) => {
      // Optimistic update - add new user to list immediately
      queryClient.setQueryData(["/api/users"], (oldData: any) => {
        if (!Array.isArray(oldData)) return [newUser];
        return [newUser, ...oldData];
      });
      
      await queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setShowNewUserDialog(false);
      userForm.reset();
      toast({
        title: "Gebruiker toegevoegd",
        description: "De nieuwe gebruiker is succesvol aangemaakt.",
      });
    },
  });

  const editUserMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      const response = await apiRequest("PUT", `/api/users/${editingUser.id}`, data);
      return response.json();
    },
    onSuccess: async (updatedUser) => {
      // Optimistic update - update user in list immediately
      queryClient.setQueryData(["/api/users"], (oldData: any) => {
        if (!Array.isArray(oldData)) return oldData;
        return oldData.map((user: any) => 
          user.id === editingUser.id ? { ...user, ...updatedUser } : user
        );
      });
      
      await queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setShowEditUserDialog(false);
      setEditingUser(null);
      editUserForm.reset();
      toast({
        title: "Gebruiker bijgewerkt",
        description: "De gebruikersgegevens zijn succesvol bijgewerkt.",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest("DELETE", `/api/users/${userId}`, {});
      return response.json();
    },
    onSuccess: async (result, userId) => {
      // Optimistic update - remove user from list immediately
      queryClient.setQueryData(["/api/users"], (oldData: any) => {
        if (!Array.isArray(oldData)) return oldData;
        return oldData.filter((user: any) => user.id !== userId);
      });
      
      await queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Gebruiker verwijderd",
        description: "De gebruiker is succesvol verwijderd.",
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
    onSuccess: async (newRule) => {
      // Optimistic update - add new rule to list immediately
      queryClient.setQueryData(["/api/rules"], (oldData: any) => {
        if (!Array.isArray(oldData)) return [newRule];
        return [newRule, ...oldData];
      });
      
      await queryClient.invalidateQueries({ queryKey: ["/api/rules"] });
      setShowNewRuleDialog(false);
      ruleForm.reset();
      toast({
        title: "Regel toegevoegd",
        description: "De nieuwe organisatieregel is aangemaakt.",
      });
    },
  });

  const updateRuleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PUT", `/api/rules/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rules"] });
      toast({ title: "Regel bijgewerkt", description: "De regel is succesvol bijgewerkt." });
      setShowEditRuleDialog(false);
    },
    onError: () => {
      toast({ title: "Fout", description: "Er is een fout opgetreden.", variant: "destructive" });
    }
  });

  const deleteRuleMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/rules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rules"] });
      toast({ title: "Regel verwijderd", description: "De regel is succesvol verwijderd." });
    },
    onError: () => {
      toast({ title: "Fout", description: "Er is een fout opgetreden.", variant: "destructive" });
    }
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

  const onEditUserSubmit = (data: UserFormData) => {
    editUserMutation.mutate(data);
  };

  const onRuleSubmit = (data: RuleFormData) => {
    createRuleMutation.mutate(data);
  };

  const onEditRuleSubmit = (data: RuleFormData) => {
    const ruleData = {
      ...data,
      parameters: {
        minYears: data.minYears ? parseInt(data.minYears) : undefined,
        minPayments: data.minPayments ? parseInt(data.minPayments) : undefined,
        consecutive: data.consecutive,
        categories: data.categories,
      },
    };
    updateRuleMutation.mutate({ id: editingRule.id, data: ruleData });
  };

  // User management handlers
  const handleEditUser = (user: any) => {
    setEditingUser(user);
    editUserForm.reset({
      name: user.name,
      email: user.email,
      role: user.role,
    });
    setShowEditUserDialog(true);
  };

  const handleResetPassword = async (user: any) => {
    try {
      const response = await apiRequest("POST", `/api/users/${user.id}/reset-password`, {});
      const result = await response.json();
      toast({
        title: "Wachtwoord gereset",
        description: `Nieuw tijdelijk wachtwoord: ${result.temporaryPassword}`,
      });
    } catch (error) {
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het resetten van het wachtwoord.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = (user: any) => {
    if (confirm(`Weet je zeker dat je ${user.name} wilt verwijderen?`)) {
      deleteUserMutation.mutate(user.id);
    }
  };

  const handleEditRule = (rule: any) => {
    setEditingRule(rule);
    editRuleForm.reset({
      name: rule.name,
      description: rule.description || "",
      scope: rule.scope,
      minYears: rule.parameters?.minYears?.toString() || "",
      minPayments: rule.parameters?.minPayments?.toString() || "",
      consecutive: rule.parameters?.consecutive || false,
      categories: rule.parameters?.categories || [],
    });
    setShowEditRuleDialog(true);
  };


  const handleDeleteRule = (rule: any) => {
    if (confirm(`Weet je zeker dat je de regel "${rule.name}" wilt verwijderen?`)) {
      deleteRuleMutation.mutate(rule.id);
    }
  };

  const getRuleScopeLabel = (scope: string) => {
    const labels: Record<string, string> = {
      'STEMRECHT': 'Stemrecht',
      'VERKIESBAAR': 'Verkiesbaarheid',
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
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="organization" className="flex items-center gap-2" data-testid="tab-organization">
                  <Building2 className="h-4 w-4" />
                  Organisatie
                </TabsTrigger>
                <TabsTrigger value="fees" className="flex items-center gap-2" data-testid="tab-fees">
                  <CreditCard className="h-4 w-4" />
                  Lidgelden
                </TabsTrigger>
                <TabsTrigger value="security" className="flex items-center gap-2" data-testid="tab-security">
                  <Users className="h-4 w-4" />
                  Gebruikers
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
                        <div className="space-y-6">
                          {/* Basis Informatie */}
                          <div>
                            <h3 className="text-lg font-medium mb-4">Basis Informatie</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          </div>

                          {/* Adres Informatie */}
                          <div>
                            <h3 className="text-lg font-medium mb-4">Adres</h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                              <div className="md:col-span-2">
                                <FormField
                                  control={organizationForm.control}
                                  name="street"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Straat</FormLabel>
                                      <FormControl>
                                        <Input placeholder="Moskeestraat" {...field} data-testid="input-org-street" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                              
                              <FormField
                                control={organizationForm.control}
                                name="number"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Nummer</FormLabel>
                                    <FormControl>
                                      <Input placeholder="123" {...field} data-testid="input-org-number" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={organizationForm.control}
                                name="postalCode"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Postcode</FormLabel>
                                    <FormControl>
                                      <Input placeholder="1000" {...field} data-testid="input-org-postal" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                              <FormField
                                control={organizationForm.control}
                                name="city"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Stad</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Brussel" {...field} data-testid="input-org-city" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={organizationForm.control}
                                name="country"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Land</FormLabel>
                                    <FormControl>
                                      <Input placeholder="België" {...field} data-testid="input-org-country" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>

                          {/* Contact Informatie */}
                          <div>
                            <h3 className="text-lg font-medium mb-4">Contact</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={organizationForm.control}
                                name="email"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>E-mailadres</FormLabel>
                                    <FormControl>
                                      <Input type="email" placeholder="info@moskee.be" {...field} data-testid="input-org-email" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={organizationForm.control}
                                name="phone"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Telefoonnummer</FormLabel>
                                    <FormControl>
                                      <Input placeholder="+32 2 123 45 67" {...field} data-testid="input-org-phone" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={organizationForm.control}
                                name="website"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Website</FormLabel>
                                    <FormControl>
                                      <Input placeholder="https://www.moskee.be" {...field} data-testid="input-org-website" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>

                          {/* Juridische Informatie */}
                          <div>
                            <h3 className="text-lg font-medium mb-4">Juridische Informatie</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={organizationForm.control}
                                name="companyNumber"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Ondernemingsnummer</FormLabel>
                                    <FormControl>
                                      <Input placeholder="0123.456.789" {...field} data-testid="input-org-company-number" />
                                    </FormControl>
                                    <FormDescription>
                                      Belgisch ondernemingsnummer (BE format)
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={organizationForm.control}
                                name="companyType"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Vennootschapsvorm</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <FormControl>
                                        <SelectTrigger data-testid="select-company-type">
                                          <SelectValue placeholder="Selecteer vennootschapsvorm" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="VZW">Vereniging zonder winstoogmerk (VZW)</SelectItem>
                                        <SelectItem value="BVBA">Besloten vennootschap (BV)</SelectItem>
                                        <SelectItem value="NV">Naamloze vennootschap (NV)</SelectItem>
                                        <SelectItem value="VOF">Vennootschap onder firma (VOF)</SelectItem>
                                        <SelectItem value="EENMANSZAAK">Eenmanszaak</SelectItem>
                                        <SelectItem value="CVBA">Coöperatieve vennootschap (CV)</SelectItem>
                                        <SelectItem value="SE">Europese vennootschap (SE)</SelectItem>
                                        <SelectItem value="ANDERE">Andere</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <Button
                            type="submit"
                            disabled={updateOrganizationMutation.isPending || organizationSaved}
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
                            disabled={updateFeeSettingsMutation.isPending || feesSaved}
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
                    {!users || !Array.isArray(users) || users.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 px-4 text-center" data-testid="no-users">
                        <div className="flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                          <Users className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                          Nog geen gebruikers toegevoegd
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
                          Voeg je eerste gebruiker toe om toegang te verlenen tot het systeem.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {Array.isArray(users) && users.map((currentUser: any) => {
                          const isCurrentUser = currentUser.email === user?.email;
                          return (
                          <div key={currentUser.id} className={`flex items-center justify-between p-4 border border-gray-200 rounded-xl ${isCurrentUser ? 'opacity-50' : ''}`} data-testid={`user-item-${currentUser.id}`}>
                            <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                                {currentUser.role === 'BEHEERDER' ? (
                                  <RiAdminLine className="h-5 w-5 text-primary-foreground" />
                                ) : (
                                  <Users className="h-5 w-5 text-primary-foreground" />
                                )}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900" data-testid={`user-name-${currentUser.id}`}>
                                  {currentUser.name}
                                  {isCurrentUser && <span className="text-xs text-gray-500 ml-2">(jij)</span>}
                                </div>
                                <div className="text-sm text-gray-500" data-testid={`user-email-${currentUser.id}`}>
                                  {currentUser.email}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant={currentUser.role === 'BEHEERDER' ? 'default' : 'secondary'} data-testid={`user-role-${currentUser.id}`}>
                                {currentUser.role === 'BEHEERDER' ? 'Beheerder' : 'Medewerker'}
                              </Badge>
                              <Badge variant={currentUser.active ? 'default' : 'destructive'} className={currentUser.active ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}>
                                {currentUser.active ? 'Actief' : 'Inactief'}
                              </Badge>
                              {!isCurrentUser && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" data-testid={`user-actions-${currentUser.id}`}>
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleEditUser(currentUser)} data-testid={`action-edit-user-${currentUser.id}`}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Bewerken
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleResetPassword(currentUser)} data-testid={`action-reset-password-${currentUser.id}`}>
                                      <KeyRound className="h-4 w-4 mr-2" />
                                      Wachtwoord resetten
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteUser(currentUser)} data-testid={`action-delete-user-${currentUser.id}`}>
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Verwijderen
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                          </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Edit User Dialog */}
                <Dialog open={showEditUserDialog} onOpenChange={setShowEditUserDialog}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Gebruiker Bewerken</DialogTitle>
                    </DialogHeader>
                    <Form {...editUserForm}>
                      <form onSubmit={editUserForm.handleSubmit(onEditUserSubmit)} className="space-y-4">
                        <FormField
                          control={editUserForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Naam</FormLabel>
                              <FormControl>
                                <Input placeholder="Voornaam Achternaam" {...field} data-testid="input-edit-user-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={editUserForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>E-mailadres</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="gebruiker@moskee.be" {...field} data-testid="input-edit-user-email" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={editUserForm.control}
                          name="role"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Rol</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-edit-user-role">
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

                        <div className="flex justify-end gap-2 pt-4">
                          <Button type="button" variant="outline" onClick={() => setShowEditUserDialog(false)}>
                            Annuleren
                          </Button>
                          <Button type="submit" disabled={editUserMutation.isPending} data-testid="button-update-user">
                            {editUserMutation.isPending ? "Bijwerken..." : "Gebruiker Bijwerken"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
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
                    {!rules || !Array.isArray(rules) || rules.length === 0 ? (
                      <div className="text-center py-6 text-gray-500" data-testid="no-rules">
                        Nog geen organisatieregels geconfigureerd
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {Array.isArray(rules) && rules.map((rule: any) => (
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
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" data-testid={`rule-actions-${rule.id}`}>
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleEditRule(rule)} data-testid={`action-edit-rule-${rule.id}`}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Bewerken
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteRule(rule)} data-testid={`action-delete-rule-${rule.id}`}>
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

                {/* Edit Rule Dialog */}
                <Dialog open={showEditRuleDialog} onOpenChange={setShowEditRuleDialog}>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Organisatieregel Bewerken</DialogTitle>
                    </DialogHeader>
                    <Form {...editRuleForm}>
                      <form onSubmit={editRuleForm.handleSubmit(onEditRuleSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={editRuleForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Regelnaam</FormLabel>
                                <FormControl>
                                  <Input placeholder="Stemrecht voor standaard leden" {...field} data-testid="input-edit-rule-name" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={editRuleForm.control}
                            name="scope"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Toepassing</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-edit-rule-scope">
                                      <SelectValue placeholder="Selecteer toepassing" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="STEMRECHT">Stemrecht</SelectItem>
                                    <SelectItem value="VERKIESBAAR">Verkiesbaarheid</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={editRuleForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Beschrijving (optioneel)</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Uitleg van de regel..." {...field} data-testid="input-edit-rule-description" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={editRuleForm.control}
                            name="minYears"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Minimaal aantal jaren lid</FormLabel>
                                <FormControl>
                                  <Input type="number" placeholder="5" {...field} data-testid="input-edit-rule-min-years" />
                                </FormControl>
                                <FormDescription>Optioneel</FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={editRuleForm.control}
                            name="minPayments"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Minimaal aantal betalingen</FormLabel>
                                <FormControl>
                                  <Input type="number" placeholder="5" {...field} data-testid="input-edit-rule-min-payments" />
                                </FormControl>
                                <FormDescription>Optioneel</FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={editRuleForm.control}
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
                                  data-testid="switch-edit-rule-consecutive"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <div className="flex justify-end gap-2 pt-4">
                          <Button type="button" variant="outline" onClick={() => setShowEditRuleDialog(false)}>
                            Annuleren
                          </Button>
                          <Button type="submit" disabled={updateRuleMutation.isPending} data-testid="button-update-rule">
                            {updateRuleMutation.isPending ? "Bijwerken..." : "Regel Bijwerken"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}

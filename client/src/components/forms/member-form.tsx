import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { MdOutlinePermIdentity } from "react-icons/md";
import { GoHome } from "react-icons/go";
import { CiBank } from "react-icons/ci";
import { BsBuildings } from "react-icons/bs";
import { RiCheckboxMultipleLine } from "react-icons/ri";
import { IdCard } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Member, MemberFinancialSettings, MemberPermissions } from "@shared/schema";

// Extended member type that includes related data
interface MemberWithDetails extends Member {
  financialSettings?: MemberFinancialSettings;
  permissions?: {
    privacyAgreement: boolean;
    photoVideoConsent: boolean;
    newsletterSubscription: boolean;
    whatsappList: boolean;
    interestedInActiveRole: boolean;
    roleDescription?: string;
  };
}
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";


const memberSchema = z.object({
  firstName: z.string().min(1, "Voornaam is verplicht"),
  lastName: z.string().min(1, "Achternaam is verplicht"),
  gender: z.enum(['M', 'V'], { required_error: "Geslacht is verplicht" }),
  dateOfBirth: z.date({ required_error: "Geboortedatum is verplicht" }),
  category: z.enum(['STUDENT', 'STANDAARD', 'SENIOR'], { required_error: "Categorie is verplicht" }),
  email: z.string().email("Ongeldig e-mailadres").optional().or(z.literal("")),
  phone: z.string().optional(),
  street: z.string().min(1, "Straat is verplicht"),
  number: z.string().min(1, "Nummer is verplicht"),
  bus: z.string().optional(),
  postalCode: z.string().min(1, "Postcode is verplicht"),
  city: z.string().min(1, "Stad is verplicht"),
  country: z.string().min(1, "Land is verplicht").default("België"),
  financialSettings: z.object({
    paymentMethod: z.enum(['SEPA', 'OVERSCHRIJVING', 'BANCONTACT', 'CASH']),
    iban: z.string().optional(),
    paymentTerm: z.enum(['MONTHLY', 'YEARLY']),
  }),
  organization: z.object({
    interestedInActiveRole: z.boolean().default(false),
    roleDescription: z.string().optional(),
    votingEligible: z.boolean().default(false),
  }),
  permissions: z.object({
    privacyAgreement: z.boolean().refine(val => val === true, "Akkoord met privacyverklaring is verplicht"),
    photoVideoConsent: z.boolean().default(false),
    newsletterSubscription: z.boolean().default(false),
    whatsappList: z.boolean().default(false),
  }),
}).refine((data) => {
  // IBAN is alleen verplicht voor SEPA en Overschrijving
  if ((data.financialSettings.paymentMethod === 'SEPA' || data.financialSettings.paymentMethod === 'OVERSCHRIJVING') && !data.financialSettings.iban) {
    return false;
  }
  return true;
}, {
  message: "IBAN is verplicht voor SEPA en Overschrijving",
  path: ["financialSettings", "iban"],
});

type MemberFormData = z.infer<typeof memberSchema>;

interface MemberFormProps {
  member?: MemberWithDetails;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function MemberForm({ member, onSuccess, onCancel }: MemberFormProps) {
  const [activeTab, setActiveTab] = useState("personal");
  const [isScanning, setIsScanning] = useState(false);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [duplicateInfo, setDuplicateInfo] = useState<any>(null);
  const [pendingData, setPendingData] = useState<MemberFormData | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Build default values based on whether we're editing or creating
  const getDefaultValues = (): Partial<MemberFormData> => {
    if (member) {
      // Parse member data for editing - use all actual member data
      const street = member.street || '';
      const number = member.number || '';
      const bus = member.bus || '';
      
      return {
        firstName: member.firstName || '',
        lastName: member.lastName || '',
        gender: (member.gender as 'M' | 'V') || 'M',
        dateOfBirth: member.birthDate ? new Date(member.birthDate) : undefined,
        category: member.category || 'STANDAARD',
        email: member.email || '',
        phone: member.phone || '',
        street: street,
        number: number,
        bus: bus,
        postalCode: member.postalCode || '',
        city: member.city || '',
        country: member.country || 'België',
        financialSettings: {
          paymentMethod: member.financialSettings?.paymentMethod || 'SEPA' as const,
          iban: member.financialSettings?.iban || '',
          paymentTerm: member.financialSettings?.paymentTerm || 'YEARLY' as const,
        },
        organization: {
          interestedInActiveRole: member.permissions?.interestedInActiveRole || false,
          roleDescription: member.permissions?.roleDescription || '',
          votingEligible: false,
        },
        permissions: {
          privacyAgreement: member.permissions?.privacyAgreement || false,
          photoVideoConsent: member.permissions?.photoVideoConsent || false,
          newsletterSubscription: member.permissions?.newsletterSubscription || false,
          whatsappList: member.permissions?.whatsappList || false,
        },
      };
    }
    
    // Default values for new member
    return {
      firstName: '',
      lastName: '',
      gender: 'M',
      category: 'STANDAARD',
      email: '',
      phone: '',
      street: '',
      number: '',
      bus: '',
      postalCode: '',
      city: '',
      country: 'België',
      financialSettings: {
        paymentMethod: 'SEPA',
        iban: '',
        paymentTerm: 'YEARLY',
      },
      organization: {
        interestedInActiveRole: false,
        roleDescription: '',
        votingEligible: false,
      },
      permissions: {
        privacyAgreement: false,
        photoVideoConsent: false,
        newsletterSubscription: false,
        whatsappList: false,
      },
    };
  };

  const form = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: getDefaultValues(),
  });

  // Functie om te controleren of een tab fouten heeft
  const hasTabErrors = (tabName: string) => {
    const errors = form.formState.errors;
    
    switch (tabName) {
      case "personal":
        return !!(errors.firstName || errors.lastName || errors.gender || errors.dateOfBirth || errors.category || errors.email || errors.phone);
      case "address":
        return !!(errors.street || errors.number || errors.postalCode || errors.city || errors.country);
      case "financial":
        return !!(errors.financialSettings?.paymentMethod || errors.financialSettings?.iban || errors.financialSettings?.paymentTerm);
      case "organization":
        return !!(errors.organization?.interestedInActiveRole || errors.organization?.roleDescription);
      case "permissions":
        return !!(errors.permissions?.privacyAgreement || errors.permissions?.photoVideoConsent || errors.permissions?.newsletterSubscription || errors.permissions?.whatsappList);
      default:
        return false;
    }
  };

  const checkDuplicatesMutation = useMutation({
    mutationFn: async (data: MemberFormData) => {
      // Generate a temporary member number for duplicate checking
      const tempMemberNumber = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
      
      const memberData = {
        memberNumber: tempMemberNumber,
        firstName: data.firstName,
        lastName: data.lastName,
        birthDate: data.dateOfBirth ? data.dateOfBirth.toISOString() : undefined,
        email: data.email || null,
        phone: data.phone || null,
        street: data.street,
        number: data.number,
        postalCode: data.postalCode,
        city: data.city,
      };
      
      const response = await apiRequest('POST', '/api/members/check-duplicates', memberData);
      return response.json();
    },
  });

  const createMemberMutation = useMutation({
    mutationFn: async (data: MemberFormData) => {
      // Transform data for backend compatibility
      const transformedData = {
        ...data,
        // Convert Date object to ISO string for backend
        birthDate: data.dateOfBirth ? data.dateOfBirth.toISOString() : undefined,
        // Remove the frontend-only dateOfBirth field
        dateOfBirth: undefined,
      };
      
      const method = member ? "PATCH" : "POST";
      const url = member ? `/api/members/${member.id}` : "/api/members";
      const response = await apiRequest(method, url, transformedData);
      return response.json();
    },
    onSuccess: async (newMember, variables) => {
      // Optimistic update - voeg nieuwe member toe aan lijst
      queryClient.setQueryData(["/api/members"], (oldData: any) => {
        if (!Array.isArray(oldData)) return [newMember];
        return [newMember, ...oldData];
      });
      
      // Update dashboard stats optimistically 
      queryClient.setQueryData(["/api/dashboard/stats"], (oldStats: any) => {
        if (!oldStats) return oldStats;
        return {
          ...oldStats,
          totalMembers: (parseInt(oldStats.totalMembers) + 1).toString(),
          activeMembers: (parseInt(oldStats.activeMembers) + (newMember.active ? 1 : 0)).toString(),
        };
      });
      
      await queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: member ? "Lid bijgewerkt" : "Lid aangemaakt",
        description: member ? "Het lid is succesvol bijgewerkt." : "Het nieuwe lid is succesvol toegevoegd.",
      });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: member ? "Fout bij bijwerken" : "Fout bij aanmaken",
        description: error.message || (member ? "Er is een fout opgetreden bij het bijwerken van het lid." : "Er is een fout opgetreden bij het aanmaken van het lid."),
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: MemberFormData) => {
    // Force validation and wait for it to complete
    const isValid = await form.trigger();
    
    if (!isValid) {
      const errors = form.formState.errors;
      console.log('Form validation errors:', errors);
      
      // Bepaal welke tab de eerste fout bevat
      let targetTab = "personal";
      if (hasTabErrors('personal')) {
        targetTab = "personal";
      } else if (hasTabErrors('address')) {
        targetTab = "address";
      } else if (hasTabErrors('financial')) {
        targetTab = "financial";
      } else if (hasTabErrors('organization')) {
        targetTab = "organization";
      } else if (hasTabErrors('permissions')) {
        targetTab = "permissions";
      }
      
      setActiveTab(targetTab);
      
      toast({
        title: "Formulier onvolledig",
        description: "Vul alle verplichte velden in om verder te gaan.",
        variant: "destructive",
      });
      return;
    }
    
    // For new members, check for duplicates first
    if (!member) {
      setPendingData(data);
      try {
        const duplicateCheck = await checkDuplicatesMutation.mutateAsync(data);
        
        if (duplicateCheck.hasDuplicates) {
          // Show duplicate warning
          setDuplicateInfo(duplicateCheck);
          setShowDuplicateWarning(true);
          return;
        }
      } catch (error) {
        console.error('Duplicate check failed:', error);
      }
    }
    
    createMemberMutation.mutate(data);
  };

  const handleConfirmDuplicate = () => {
    if (pendingData) {
      setShowDuplicateWarning(false);
      createMemberMutation.mutate(pendingData);
      setPendingData(null);
      setDuplicateInfo(null);
    }
  };

  const handleCancelDuplicate = () => {
    setShowDuplicateWarning(false);
    setPendingData(null);
    setDuplicateInfo(null);
  };

  // Mock EID scan functionaliteit - in productie zou dit een echte EID reader library gebruiken
  const handleEIDScan = async () => {
    setIsScanning(true);
    
    try {
      // Simulatie van EID scan - in productie zou dit een echte EID API aanroepen
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock EID gegevens (in productie komen deze van de EID reader)
      const eidData = {
        firstName: "Ahmed",
        lastName: "Ben Mansour",
        gender: "M" as const,
        dateOfBirth: new Date("1985-03-15"),
        street: "Nieuwstraat",
        number: "25",
        bus: "",
        postalCode: "2000",
        city: "Antwerpen",
        country: "België"
      };
      
      // Vul form velden automatisch in
      form.setValue("firstName", eidData.firstName);
      form.setValue("lastName", eidData.lastName);
      form.setValue("gender", eidData.gender);
      form.setValue("dateOfBirth", eidData.dateOfBirth);
      form.setValue("street", eidData.street);
      form.setValue("number", eidData.number);
      form.setValue("bus", eidData.bus);
      form.setValue("postalCode", eidData.postalCode);
      form.setValue("city", eidData.city);
      form.setValue("country", eidData.country);
      
      toast({
        title: "EID succesvol gescand",
        description: "Persoonlijke en adresgegevens zijn automatisch ingevuld.",
      });
    } catch (error) {
      toast({
        title: "EID scan mislukt",
        description: "Er is een probleem opgetreden bij het scannen van de EID. Probeer opnieuw.",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const nextTab = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault(); // Prevent form submission
    }
    const tabs = ["personal", "address", "financial", "organization", "permissions"];
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1]);
    }
  };

  const prevTab = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault(); // Prevent form submission
    }
    const tabs = ["personal", "address", "financial", "organization", "permissions"];
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1]);
    }
  };

  return (
    <div className="w-full">
      <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="pt-4">
              <div className="mb-6 flex justify-end border-b pb-4">
                <Button
                  type="button"
                  onClick={handleEIDScan}
                  disabled={isScanning}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 bg-[#b6d1fc] text-[#0053a6]"
                  data-testid="button-eid-scan"
                >
                  <IdCard className="h-4 w-4" />
                  {isScanning ? "Scannen..." : "Scan EID"}
                </Button>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="personal" data-testid="tab-personal" className="flex items-center gap-2">
                  <MdOutlinePermIdentity className="h-4 w-4" />
                  Persoonlijk
                  {hasTabErrors("personal") && <span className="text-red-500 ml-1">!</span>}
                </TabsTrigger>
                <TabsTrigger value="address" data-testid="tab-address" className="flex items-center gap-2">
                  <GoHome className="h-4 w-4" />
                  Adres
                  {hasTabErrors("address") && <span className="text-red-500 ml-1">!</span>}
                </TabsTrigger>
                <TabsTrigger value="financial" data-testid="tab-financial" className="flex items-center gap-2">
                  <CiBank className="h-4 w-4" />
                  Financieel
                  {hasTabErrors("financial") && <span className="text-red-500 ml-1">!</span>}
                </TabsTrigger>
                <TabsTrigger value="organization" data-testid="tab-organization" className="flex items-center gap-2">
                  <BsBuildings className="h-4 w-4" />
                  Organisatie
                  {hasTabErrors("organization") && <span className="text-red-500 ml-1">!</span>}
                </TabsTrigger>
                <TabsTrigger value="permissions" data-testid="tab-permissions" className="flex items-center gap-2">
                  <RiCheckboxMultipleLine className="h-4 w-4" />
                  Toestemmingen
                  {hasTabErrors("permissions") && <span className="text-red-500 ml-1">!</span>}
                </TabsTrigger>
              </TabsList>

              <div className="min-h-[420px] py-6">
                <TabsContent value="personal" className="space-y-4 mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Voornaam *</FormLabel>
                        <FormControl>
                          <Input placeholder="bijv. Mohamed" {...field} data-testid="input-firstname" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Achternaam *</FormLabel>
                        <FormControl>
                          <Input placeholder="bijv. El-Amrani" {...field} data-testid="input-lastname" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Geslacht *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-gender">
                              <SelectValue placeholder="Selecteer geslacht" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="M">Man</SelectItem>
                            <SelectItem value="V">Vrouw</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Geboortedatum *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              value={field.value ? format(field.value, "dd/MM/yyyy", { locale: nl }) : ""}
                              onChange={(e) => {
                                const inputValue = e.target.value;
                                
                                // Handle numeric input (e.g., 04061993 -> 04/06/1993)
                                if (/^\d+$/.test(inputValue)) {
                                  if (inputValue.length === 8) {
                                    const day = inputValue.substring(0, 2);
                                    const month = inputValue.substring(2, 4);
                                    const year = inputValue.substring(4, 8);
                                    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                                    if (!isNaN(date.getTime()) && parseInt(month) >= 1 && parseInt(month) <= 12 && parseInt(day) >= 1 && parseInt(day) <= 31) {
                                      field.onChange(date);
                                      return;
                                    }
                                  }
                                }
                                
                                // Handle formatted input (DD/MM/YYYY)
                                if (inputValue.length === 10 && inputValue.includes('/')) {
                                  const [day, month, year] = inputValue.split('/');
                                  if (day && month && year) {
                                    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                                    if (!isNaN(date.getTime())) {
                                      field.onChange(date);
                                    }
                                  }
                                }
                              }}
                              placeholder="DD/MM/YYYY"
                              className="pr-10 border-gray-200"
                              data-testid="input-birthdate"
                              maxLength={10}
                            />
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  type="button"
                                  className="absolute right-2 top-2 h-6 w-6 p-1 hover:bg-transparent hover:scale-100 focus:bg-transparent active:bg-transparent transition-none transform-none"
                                >
                                  <CalendarIcon className="h-4 w-4" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start" side="bottom">
                                <div className="p-3 border-b">
                                  <div className="flex items-center justify-between space-x-2">
                                    <Select
                                      value={field.value ? field.value.getMonth().toString() : ""}
                                      onValueChange={(month) => {
                                        const currentDate = field.value || new Date();
                                        const newDate = new Date(currentDate.getFullYear(), parseInt(month), currentDate.getDate());
                                        field.onChange(newDate);
                                      }}
                                    >
                                      <SelectTrigger className="w-[120px] h-8">
                                        <SelectValue placeholder="Maand" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {Array.from({ length: 12 }, (_, i) => (
                                          <SelectItem key={i} value={i.toString()}>
                                            {format(new Date(2000, i, 1), "MMMM", { locale: nl })}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <Select
                                      value={field.value ? field.value.getFullYear().toString() : ""}
                                      onValueChange={(year) => {
                                        const currentDate = field.value || new Date();
                                        const newDate = new Date(parseInt(year), currentDate.getMonth(), currentDate.getDate());
                                        field.onChange(newDate);
                                      }}
                                    >
                                      <SelectTrigger className="w-[80px] h-8">
                                        <SelectValue placeholder="Jaar" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {Array.from({ length: 100 }, (_, i) => {
                                          const year = new Date().getFullYear() - i;
                                          return (
                                            <SelectItem key={year} value={year.toString()}>
                                              {year}
                                            </SelectItem>
                                          );
                                        })}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={(date) => {
                                    field.onChange(date);
                                  }}
                                  locale={nl}
                                  month={field.value || new Date()}
                                  onMonthChange={(month) => field.onChange(month)}
                                  showOutsideDays={false}
                                  className="p-3"
                                  defaultMonth={new Date()}
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categorie *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-category">
                              <SelectValue placeholder="Selecteer categorie" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="STUDENT">Student</SelectItem>
                            <SelectItem value="STANDAARD">Standaard</SelectItem>
                            <SelectItem value="SENIOR">Senior</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mailadres (optioneel)</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="mohamed@telenet.be" {...field} data-testid="input-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefoon (optioneel)</FormLabel>
                        <FormControl>
                          <Input placeholder="+32 2 123 45 67" {...field} data-testid="input-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="address" className="space-y-4 mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="street"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Straat *</FormLabel>
                        <FormControl>
                          <Input placeholder="Wetstraat" {...field} data-testid="input-street" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nummer *</FormLabel>
                        <FormControl>
                          <Input placeholder="16" {...field} data-testid="input-number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bus (optioneel)</FormLabel>
                        <FormControl>
                          <Input placeholder="A" {...field} data-testid="input-bus" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="postalCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Postcode *</FormLabel>
                        <FormControl>
                          <Input placeholder="1000" {...field} data-testid="input-postalcode" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stad *</FormLabel>
                        <FormControl>
                          <Input placeholder="Brussel" {...field} data-testid="input-city" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Land *</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-country" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="financial" className="space-y-4 mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="financialSettings.paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Betaalmethode</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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

                  <FormField
                    control={form.control}
                    name="financialSettings.iban"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IBAN {(form.watch("financialSettings.paymentMethod") === "SEPA" || form.watch("financialSettings.paymentMethod") === "OVERSCHRIJVING") && "*"}</FormLabel>
                        <FormControl>
                          <Input placeholder="BE68 5390 0754 7034" {...field} data-testid="input-iban" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="financialSettings.paymentTerm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Betalingstermijn</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                </div>
              </TabsContent>

              <TabsContent value="organization" className="space-y-4 mt-0">
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="organization.votingEligible"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stemgerechtigd?</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={(value) => field.onChange(value === "true")}
                            value={field.value ? "true" : "false"}
                            className="flex gap-6"
                            data-testid="radio-voting-eligible"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="true" id="voting-yes" />
                              <Label htmlFor="voting-yes">Ja</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="false" id="voting-no" />
                              <Label htmlFor="voting-no">Nee</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="organization.interestedInActiveRole"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Interesse in actieve rol?</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={(value) => field.onChange(value === "true")}
                            value={field.value ? "true" : "false"}
                            className="flex gap-6"
                            data-testid="radio-active-role"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="true" id="role-yes" />
                              <Label htmlFor="role-yes">Ja</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="false" id="role-no" />
                              <Label htmlFor="role-no">Nee</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="organization.roleDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={!form.watch("organization.interestedInActiveRole") ? "text-gray-400" : ""}>
                          In welke rol zie jij jezelf de moskee helpen?
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Beschrijf je gewenste rol..." 
                            {...field} 
                            disabled={!form.watch("organization.interestedInActiveRole")}
                            className={!form.watch("organization.interestedInActiveRole") ? "bg-gray-100 text-gray-400" : ""}
                            data-testid="input-role-description" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  
                </div>
              </TabsContent>

              <TabsContent value="permissions" className="space-y-4 mt-0">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Toestemmingen</h3>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="permissions.privacyAgreement"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="checkbox-privacy"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-sm font-normal">
                                Ik ga akkoord met de privacyverklaring *
                              </FormLabel>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="permissions.photoVideoConsent"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="checkbox-photo-video"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-sm font-normal">
                                Toestemming voor foto/video gebruik bij evenementen
                              </FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="permissions.newsletterSubscription"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="checkbox-newsletter"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-sm font-normal">
                                Aanmelden voor nieuwsbrief
                              </FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="permissions.whatsappList"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="checkbox-whatsapp"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-sm font-normal">
                                WhatsApp verzendlijst toevoegen
                              </FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium mb-4">Lidmaatschap overzicht</h3>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Lidnummer:</span>
                        <span className="font-mono text-sm">Wordt automatisch toegewezen</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Lidgeld:</span>
                        <span className="font-medium">
                          {form.watch("financialSettings.paymentTerm") === "MONTHLY" ? "€15,00 per maand" : "€150,00 per jaar"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Frequentie:</span>
                        <span className="text-sm">
                          {form.watch("financialSettings.paymentTerm") === "MONTHLY" ? "Maandelijks" : "Jaarlijks"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              </div>
            </Tabs>
            </div>

            <div className="flex justify-between pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={prevTab}
                disabled={activeTab === "personal"}
                data-testid="button-previous"
              >
                Vorige
              </Button>

              <div className="flex gap-2">
                {activeTab !== "permissions" ? (
                  <Button
                    type="button"
                    onClick={nextTab}
                    data-testid="button-next"
                  >
                    Volgende
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={createMemberMutation.isPending}
                    data-testid="button-submit"
                  >
                    {createMemberMutation.isPending ? (member ? "Lid wordt opgeslagen..." : "Lid wordt aangemaakt...") : (member ? "Opslaan" : "Lid Aanmaken")}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>

        {/* Duplicate Warning Dialog */}
        <Dialog open={showDuplicateWarning} onOpenChange={setShowDuplicateWarning}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-amber-800">
                <AlertTriangle className="h-5 w-5" />
                Mogelijk dubbel lid gedetecteerd
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {duplicateInfo?.duplicates?.map((duplicate: any, index: number) => (
                <div key={index} className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    <strong>Een lid met soortgelijke gegevens bestaat al:</strong>
                  </p>
                  <div className="mt-2 text-sm text-gray-700">
                    <p>• Naam: {duplicate.existingMember.firstName} {duplicate.existingMember.lastName}</p>
                    <p>• Lidnummer: {duplicate.existingMember.memberNumber}</p>
                    {duplicate.existingMember.email && (
                      <p>• E-mail: {duplicate.existingMember.email}</p>
                    )}
                  </div>
                </div>
              ))}
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Wat gebeurt er:</strong>
                  <br />• Het nieuwe lid krijgt automatisch een uniek lidnummer
                  <br />• Alle andere gegevens blijven zoals ingevuld
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleCancelDuplicate}>
                Annuleren
              </Button>
              <Button 
                onClick={handleConfirmDuplicate}
                className="bg-amber-600 hover:bg-amber-700"
              >
                Toch aanmaken
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </div>
  );
}

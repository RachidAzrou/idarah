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


const memberSchema = z.object({
  firstName: z.string().min(1, "Voornaam is verplicht"),
  lastName: z.string().min(1, "Achternaam is verplicht"),
  gender: z.enum(['M', 'V'], { required_error: "Geslacht is verplicht" }),
  birthDate: z.date({ required_error: "Geboortedatum is verplicht" }),
  category: z.enum(['STUDENT', 'VOLWASSEN', 'SENIOR'], { required_error: "Categorie is verplicht" }),
  email: z.string().email("Ongeldig e-mailadres").optional().or(z.literal("")),
  phone: z.string().optional(),
  street: z.string().min(1, "Straat is verplicht"),
  number: z.string().min(1, "Nummer is verplicht"),
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
  }),
  permissions: z.object({
    privacyAgreement: z.boolean().refine(val => val === true, "Akkoord met privacyverklaring is verplicht"),
    photoVideoConsent: z.boolean().default(false),
    newsletterSubscription: z.boolean().default(false),
    whatsappList: z.boolean().default(false),
  }),
}).refine((data) => {
  if (data.financialSettings.paymentMethod !== 'CASH' && !data.financialSettings.iban) {
    return false;
  }
  return true;
}, {
  message: "IBAN is verplicht voor alle betaalmethoden behalve contant",
  path: ["financialSettings", "iban"],
});

type MemberFormData = z.infer<typeof memberSchema>;

interface MemberFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function MemberForm({ onSuccess, onCancel }: MemberFormProps) {
  const [activeTab, setActiveTab] = useState("personal");
  const [isScanning, setIsScanning] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      gender: 'M',
      category: 'VOLWASSEN',
      email: '',
      phone: '',
      street: '',
      number: '',
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
      },
      permissions: {
        privacyAgreement: false,
        photoVideoConsent: false,
        newsletterSubscription: false,
        whatsappList: false,
      },
    },
  });

  const createMemberMutation = useMutation({
    mutationFn: async (data: MemberFormData) => {
      const response = await apiRequest("POST", "/api/members", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Lid aangemaakt",
        description: "Het nieuwe lid is succesvol toegevoegd.",
      });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij aanmaken",
        description: error.message || "Er is een fout opgetreden bij het aanmaken van het lid.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: MemberFormData) => {
    createMemberMutation.mutate(data);
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
        birthDate: new Date("1985-03-15"),
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
      form.setValue("birthDate", eidData.birthDate);
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

  const nextTab = () => {
    const tabs = ["personal", "address", "financial", "organization", "permissions"];
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1]);
    }
  };

  const prevTab = () => {
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
                  className="flex items-center gap-2"
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
                </TabsTrigger>
                <TabsTrigger value="address" data-testid="tab-address" className="flex items-center gap-2">
                  <GoHome className="h-4 w-4" />
                  Adres
                </TabsTrigger>
                <TabsTrigger value="financial" data-testid="tab-financial" className="flex items-center gap-2">
                  <CiBank className="h-4 w-4" />
                  Financieel
                </TabsTrigger>
                <TabsTrigger value="organization" data-testid="tab-organization" className="flex items-center gap-2">
                  <BsBuildings className="h-4 w-4" />
                  Organisatie
                </TabsTrigger>
                <TabsTrigger value="permissions" data-testid="tab-permissions" className="flex items-center gap-2">
                  <RiCheckboxMultipleLine className="h-4 w-4" />
                  Toestemmingen
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
                    name="birthDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Geboortedatum *</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            value={field.value ? new Date(field.value).toISOString().split('T')[0] : ""}
                            onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                            data-testid="input-birthdate"
                          />
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
                            <SelectItem value="VOLWASSEN">Volwassen</SelectItem>
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
                        <FormLabel>IBAN {form.watch("financialSettings.paymentMethod") !== "CASH" && "*"}</FormLabel>
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
                        <span className="font-mono text-sm">0001</span>
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
                    {createMemberMutation.isPending ? "Lid wordt aangemaakt..." : "Lid Aanmaken"}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>
    </div>
  );
}

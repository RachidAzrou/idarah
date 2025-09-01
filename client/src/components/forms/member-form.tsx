import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";


const memberSchema = z.object({
  firstName: z.string().min(1, "Voornaam is verplicht"),
  lastName: z.string().min(1, "Achternaam is verplicht"),
  gender: z.enum(['M', 'V']),
  birthDate: z.string().optional(),
  category: z.enum(['STUDENT', 'VOLWASSEN', 'SENIOR']),
  email: z.string().email("Ongeldig e-mailadres").optional().or(z.literal("")),
  phone: z.string().optional(),
  street: z.string().optional(),
  number: z.string().optional(),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  country: z.string().default("België"),
  financialSettings: z.object({
    paymentMethod: z.enum(['SEPA', 'OVERSCHRIJVING', 'BANCONTACT', 'CASH']),
    iban: z.string().optional(),
    paymentTerm: z.enum(['MONTHLY', 'YEARLY']),
  }),
});

type MemberFormData = z.infer<typeof memberSchema>;

interface MemberFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function MemberForm({ onSuccess, onCancel }: MemberFormProps) {
  const [activeTab, setActiveTab] = useState("personal");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      gender: 'M',
      category: 'VOLWASSEN',
      country: 'België',
      financialSettings: {
        paymentMethod: 'SEPA',
        paymentTerm: 'YEARLY',
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

  const nextTab = () => {
    const tabs = ["personal", "address", "financial", "organization"];
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1]);
    }
  };

  const prevTab = () => {
    const tabs = ["personal", "address", "financial", "organization"];
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1]);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="personal" data-testid="tab-personal">Persoonlijk</TabsTrigger>
                <TabsTrigger value="address" data-testid="tab-address">Adres</TabsTrigger>
                <TabsTrigger value="financial" data-testid="tab-financial">Financieel</TabsTrigger>
                <TabsTrigger value="organization" data-testid="tab-organization">Organisatie</TabsTrigger>
              </TabsList>

              <div className="min-h-[420px] py-6">
                <TabsContent value="personal" className="space-y-4 mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Voornaam</FormLabel>
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
                        <FormLabel>Achternaam</FormLabel>
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
                        <FormLabel>Geslacht</FormLabel>
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
                        <FormLabel>Geboortedatum (optioneel)</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-birthdate" />
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
                        <FormLabel>Categorie</FormLabel>
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
                        <FormLabel>Straat (optioneel)</FormLabel>
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
                        <FormLabel>Nummer (optioneel)</FormLabel>
                        <FormControl>
                          <Input placeholder="16" {...field} data-testid="input-number" />
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
                        <FormLabel>Postcode (optioneel)</FormLabel>
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
                        <FormLabel>Stad (optioneel)</FormLabel>
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
                        <FormLabel>Land</FormLabel>
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
                        <FormLabel>IBAN (optioneel)</FormLabel>
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
                <div className="text-center py-8">
                  <p className="text-gray-500">Organisatie instellingen worden automatisch toegepast na het aanmaken van het lid.</p>
                </div>
              </TabsContent>
              </div>
            </Tabs>

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
                {activeTab !== "organization" ? (
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
      </CardContent>
    </Card>
  );
}

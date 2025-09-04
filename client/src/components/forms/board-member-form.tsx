import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, User, Mail, Phone, Link, Crown, FileText } from "lucide-react";
import { MdOutlinePermIdentity } from "react-icons/md";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { cn } from "@/lib/utils";

const boardMemberSchema = z.object({
  linkType: z.enum(['EXISTING_MEMBER', 'EXTERNAL_PERSON'], { required_error: "Kies een type" }),
  
  // For existing member
  memberId: z.string().optional(),
  
  // For external person
  externalName: z.string().optional(),
  email: z.string().email("Ongeldig e-mailadres").optional().or(z.literal("")),
  phone: z.string().optional(),
  
  // Board role info
  role: z.string().min(1, "Rol is verplicht").default('BESTUURSLID'),
  status: z.enum(['ACTIEF', 'INACTIEF']).default('ACTIEF'),
  termStart: z.union([
    z.date(),
    z.string().transform((val) => new Date(val))
  ]).refine((date) => date instanceof Date && !isNaN(date.getTime()), {
    message: "Ongeldige startdatum"
  }),
  termEnd: z.union([
    z.date(),
    z.string().transform((val) => new Date(val))
  ]).optional().refine((date) => !date || (date instanceof Date && !isNaN(date.getTime())), {
    message: "Ongeldige einddatum"
  }),
  
  // Additional info
  responsibilities: z.string().optional(),
  avatarUrl: z.string().optional(),
  orderIndex: z.number().optional(),
}).refine((data) => {
  if (data.linkType === 'EXISTING_MEMBER') {
    return !!data.memberId;
  }
  if (data.linkType === 'EXTERNAL_PERSON') {
    return !!data.externalName;
  }
  return true;
}, {
  message: "Selecteer een lid of voer externe naam in",
  path: ["memberId"]
});

type BoardMemberFormData = z.infer<typeof boardMemberSchema>;

interface BoardMemberFormProps {
  onSubmit: (data: BoardMemberFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  isEditMode?: boolean;
  initialData?: Partial<BoardMemberFormData & {
    memberId: string;
    externalName: string;
    email: string;
    phone: string;
    termStart: string;
    termEnd: string;
    orderIndex: number;
  }>;
}

export function BoardMemberForm({ onSubmit, onCancel, isLoading = false, isEditMode = false, initialData }: BoardMemberFormProps) {
  // Determine initial link type based on initialData
  const getInitialLinkType = () => {
    if (initialData?.memberId) return 'EXISTING_MEMBER';
    if (initialData?.externalName) return 'EXTERNAL_PERSON';
    return 'EXISTING_MEMBER';
  };

  const [linkType, setLinkType] = useState<'EXISTING_MEMBER' | 'EXTERNAL_PERSON'>(getInitialLinkType());
  const [memberSearch, setMemberSearch] = useState(initialData?.externalName || "");
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [activeTab, setActiveTab] = useState(isEditMode ? "personal" : "linking");

  // Fetch members for autocomplete
  const { data: members } = useQuery<any[]>({
    queryKey: ["/api/members", { q: memberSearch }],
    staleTime: 10000,
    enabled: linkType === 'EXISTING_MEMBER' && memberSearch.length > 0,
  });

  // Fetch member details for edit mode
  const { data: memberDetails } = useQuery<any>({
    queryKey: ["/api/members", initialData?.memberId],
    staleTime: 10000,
    enabled: !!(isEditMode && initialData?.memberId),
  });

  const form = useForm<BoardMemberFormData>({
    resolver: zodResolver(boardMemberSchema),
    defaultValues: {
      linkType: getInitialLinkType(),
      status: initialData?.status || 'ACTIEF',
      memberId: initialData?.memberId || '',
      externalName: initialData?.externalName || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      role: initialData?.role || 'BESTUURSLID',
      termStart: initialData?.termStart ? new Date(initialData.termStart) : undefined,
      termEnd: initialData?.termEnd ? new Date(initialData.termEnd) : undefined,
      responsibilities: initialData?.responsibilities || '',
      orderIndex: initialData?.orderIndex || 0,
    },
  });

  const handleMemberSelect = (member: any) => {
    setSelectedMember(member);
    form.setValue('memberId', member.id);
    setMemberSearch(`${member.firstName} ${member.lastName}`);
  };

  const handleLinkTypeChange = (type: 'EXISTING_MEMBER' | 'EXTERNAL_PERSON') => {
    setLinkType(type);
    form.setValue('linkType', type);
    
    // Reset fields when changing type
    if (type === 'EXISTING_MEMBER') {
      form.setValue('externalName', '');
      form.setValue('email', '');
      form.setValue('phone', '');
    } else {
      form.setValue('memberId', '');
      setSelectedMember(null);
      setMemberSearch('');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid w-full ${isEditMode ? 'grid-cols-3' : 'grid-cols-4'}`}>
            {!isEditMode && (
              <TabsTrigger value="linking" data-testid="tab-linking" className="flex items-center gap-2">
                <Link className="h-4 w-4" />
                Koppeling
              </TabsTrigger>
            )}
            <TabsTrigger value="personal" data-testid="tab-personal" className="flex items-center gap-2">
              <MdOutlinePermIdentity className="h-4 w-4" />
              Persoonlijk
            </TabsTrigger>
            <TabsTrigger value="role" data-testid="tab-role" className="flex items-center gap-2">
              <Crown className="h-4 w-4" />
              Bestuursrol
            </TabsTrigger>
            <TabsTrigger value="extra" data-testid="tab-extra" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Extra
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Koppeling */}
          <TabsContent value="linking">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Koppeling</CardTitle>
                <CardDescription>Kies of dit een bestaand lid of een externe persoon is</CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="linkType"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <RadioGroup
                          onValueChange={(value) => {
                            field.onChange(value);
                            handleLinkTypeChange(value as 'EXISTING_MEMBER' | 'EXTERNAL_PERSON');
                          }}
                          value={field.value}
                          className="space-y-3"
                          data-testid="radio-link-type"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="EXISTING_MEMBER" id="existing" />
                            <Label htmlFor="existing">Bestaand lid</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="EXTERNAL_PERSON" id="external" />
                            <Label htmlFor="external">Externe persoon</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Persoonsgegevens */}
          <TabsContent value="personal">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Persoonsgegevens</CardTitle>
                <CardDescription>
                  {isEditMode ? "Persoonlijke informatie (alleen bekijken)" : "Vul de persoonlijke gegevens in"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditMode ? (
                  /* Edit Mode: Read-only display */
                  <div className="space-y-4 text-gray-600">
                    {/* Member Info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Naam</Label>
                        <div className="mt-1 p-2 bg-gray-50 rounded border text-gray-700">
                          {initialData?.memberId 
                            ? `${memberDetails?.firstName || 'Onbekend'} ${memberDetails?.lastName || 'Lid'}` 
                            : (initialData?.externalName || 'Externe persoon')}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Type</Label>
                        <div className="mt-1 p-2 bg-gray-50 rounded border text-gray-700">
                          {initialData?.memberId ? 'Intern lid' : 'Externe persoon'}
                        </div>
                      </div>
                    </div>
                    
                    {initialData?.memberId && (
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Lidnummer</Label>
                          <div className="mt-1 p-2 bg-gray-50 rounded border text-gray-700">
                            #{memberDetails?.memberNumber || 'Onbekend'}
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Categorie</Label>
                          <div className="mt-1 p-2 bg-gray-50 rounded border text-gray-700">
                            {memberDetails?.category || 'Onbekend'}
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Status</Label>
                          <div className="mt-1 p-2 bg-gray-50 rounded border text-gray-700">
                            {memberDetails?.active ? 'Actief' : 'Inactief'}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-500">E-mail</Label>
                        <div className="mt-1 p-2 bg-gray-50 rounded border text-gray-700">
                          {(initialData?.memberId ? memberDetails?.email : initialData?.email) || 'Niet opgegeven'}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Telefoon</Label>
                        <div className="mt-1 p-2 bg-gray-50 rounded border text-gray-700">
                          {(initialData?.memberId ? memberDetails?.phone : initialData?.phone) || 'Niet opgegeven'}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Add Mode: Normal form fields */
                  linkType === 'EXISTING_MEMBER' ? (
                    <>
                      {/* Member Search */}
                      <div className="space-y-2">
                        <Label htmlFor="member-search">Zoek lid</Label>
                        <div className="relative">
                          <Input
                            id="member-search"
                            placeholder="Typ naam om te zoeken..."
                            value={memberSearch}
                            onChange={(e) => setMemberSearch(e.target.value)}
                            data-testid="input-member-search"
                          />
                          {memberSearch.length > 0 && members && members.length > 0 && !selectedMember && (
                            <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-40 overflow-y-auto">
                              {members.map((member: any) => (
                                <button
                                  key={member.id}
                                  type="button"
                                  className="w-full px-3 py-2 text-left hover:bg-gray-50 border-b last:border-b-0"
                                  onClick={() => handleMemberSelect(member)}
                                  data-testid={`option-member-${member.id}`}
                                >
                                  <div className="font-medium">{member.firstName} {member.lastName}</div>
                                  <div className="text-sm text-gray-500">#{member.memberNumber}</div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Selected Member Preview */}
                      {selectedMember && (
                        <div className="p-4 bg-gray-50 rounded-lg" data-testid="member-preview">
                          <h4 className="font-medium mb-2">Geselecteerd lid</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4" />
                              <span>{selectedMember.firstName} {selectedMember.lastName}</span>
                            </div>
                            {selectedMember.email && (
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                <span>{selectedMember.email}</span>
                              </div>
                            )}
                            {selectedMember.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4" />
                                <span>{selectedMember.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {/* External Person Fields */}
                      <FormField
                        control={form.control}
                        name="externalName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Naam *</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="Volledige naam"
                                data-testid="input-external-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>E-mail</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="email"
                                placeholder="naam@voorbeeld.com"
                                data-testid="input-external-email"
                              />
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
                            <FormLabel>Telefoon</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="+32 123 456 789"
                                data-testid="input-external-phone"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 3: Bestuursrol */}
          <TabsContent value="role">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Bestuursrol</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rol</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Voorzitter, Secretaris, Bestuurslid, etc."
                          data-testid="input-role"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="termStart"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Startdatum *</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                                data-testid="button-term-start"
                              >
                                {field.value ? (
                                  format(field.value, "PPP", { locale: nl })
                                ) : (
                                  <span>Selecteer datum</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date > new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="termEnd"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Einddatum (optioneel)</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                                data-testid="button-term-end"
                              >
                                {field.value ? (
                                  format(field.value, "PPP", { locale: nl })
                                ) : (
                                  <span>Selecteer datum</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-status">
                            <SelectValue placeholder="Selecteer status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ACTIEF">Actief</SelectItem>
                          <SelectItem value="INACTIEF">Inactief</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 4: Extra informatie */}
          <TabsContent value="extra">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Extra informatie</CardTitle>
                <CardDescription>Optionele informatie over taken en verantwoordelijkheden</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="responsibilities"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Verantwoordelijkheden / Takenpakket</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Beschrijf de hoofdtaken en verantwoordelijkheden..."
                          className="min-h-[100px]"
                          data-testid="textarea-responsibilities"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            data-testid="button-cancel-form"
          >
            Annuleren
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading}
            data-testid="button-submit-form"
          >
{isLoading ? "Opslaan..." : (initialData ? "Opslaan" : "Bestuurslid Toevoegen")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
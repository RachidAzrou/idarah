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
import { CalendarIcon, User, Mail, Phone, Link, Crown, FileText, Search, UserCircle } from "lucide-react";
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
  role: z.enum(['VOORZITTER', 'VICE_VOORZITTER', 'SECRETARIS', 'PENNINGMEESTER', 'BESTUURSLID', 'ANDERS']).default('BESTUURSLID'),
  customRole: z.string().optional(),
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
  ]).refine((date) => date instanceof Date && !isNaN(date.getTime()), {
    message: "Einddatum is verplicht"
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
}).refine((data) => {
  if (data.role === 'ANDERS') {
    return data.customRole && data.customRole.trim().length > 0;
  }
  return true;
}, {
  message: "Aangepaste rol is verplicht wanneer 'Anders' is geselecteerd",
  path: ["customRole"]
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

  // Fetch all members for search
  const { data: allMembers = [] } = useQuery<any[]>({
    queryKey: ["/api/members"],
    staleTime: 10000,
    enabled: linkType === 'EXISTING_MEMBER',
  });

  // Filter members based on search locally
  const filteredMembers = allMembers.filter((member: any) => {
    if (!memberSearch || memberSearch.length < 2) return false;
    const searchLower = memberSearch.toLowerCase();
    const fullName = `${member.firstName} ${member.lastName}`.toLowerCase();
    return (
      fullName.includes(searchLower) ||
      member.memberNumber.toString().includes(searchLower)
    );
  }).slice(0, 10); // Limit to 10 results

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
      customRole: initialData?.customRole || '',
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
    
    // Auto-navigate to personal tab after selection
    setActiveTab('personal');
  };

  // Function to check if a tab has errors
  const hasTabErrors = (tabName: string) => {
    const errors = form.formState.errors;
    
    switch (tabName) {
      case "linking":
        return !!(errors.linkType || errors.memberId || errors.externalName);
      case "personal":
        return !!(errors.externalName || errors.email || errors.phone);
      case "role":
        return !!(errors.role || errors.termStart || errors.termEnd || errors.status);
      case "extra":
        return !!(errors.responsibilities || errors.avatarUrl || errors.orderIndex);
      default:
        return false;
    }
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
      // Auto-navigate to personal tab for external person
      setActiveTab('personal');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => {
        // Transform data for backend compatibility
        const transformedData = {
          ...data,
          // Convert Date objects to ISO strings for backend
          termStart: data.termStart ? data.termStart.toISOString() : undefined,
          termEnd: data.termEnd ? data.termEnd.toISOString() : undefined,
        };
        onSubmit(transformedData);
      }, (errors) => {
        // Handle form validation errors - navigate to first tab with errors
        if (!isEditMode && (errors.linkType || errors.memberId || errors.externalName)) {
          setActiveTab('linking');
        } else if (errors.externalName || errors.email || errors.phone) {
          setActiveTab('personal');
        } else if (errors.role || errors.termStart || errors.termEnd || errors.status) {
          setActiveTab('role');
        } else if (errors.responsibilities || errors.avatarUrl || errors.orderIndex) {
          setActiveTab('extra');
        }
      })} className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid w-full ${isEditMode ? 'grid-cols-3' : 'grid-cols-4'}`}>
            {!isEditMode && (
              <TabsTrigger value="linking" data-testid="tab-linking" className="flex items-center gap-2">
                <Link className="h-4 w-4" />
                Koppeling
                {hasTabErrors("linking") && <span className="text-red-500 ml-1">•</span>}
              </TabsTrigger>
            )}
            <TabsTrigger value="personal" data-testid="tab-personal" className="flex items-center gap-2">
              <MdOutlinePermIdentity className="h-4 w-4" />
              Persoonlijk
              {hasTabErrors("personal") && <span className="text-red-500 ml-1">•</span>}
            </TabsTrigger>
            <TabsTrigger value="role" data-testid="tab-role" className="flex items-center gap-2">
              <Crown className="h-4 w-4" />
              Bestuursrol
              {hasTabErrors("role") && <span className="text-red-500 ml-1">•</span>}
            </TabsTrigger>
            <TabsTrigger value="extra" data-testid="tab-extra" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Extra
              {hasTabErrors("extra") && <span className="text-red-500 ml-1">•</span>}
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
                          
                          {linkType === 'EXISTING_MEMBER' && (
                            <div className="ml-6 mt-3 space-y-3">
                              <div className="relative">
                                <Input
                                  placeholder="Zoek op naam of lidnummer..."
                                  value={memberSearch}
                                  onChange={(e) => setMemberSearch(e.target.value)}
                                  className="pr-10"
                                  data-testid="input-member-search"
                                />
                                <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                              </div>
                              
                              {memberSearch && memberSearch.length > 1 && (
                                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg bg-white shadow-sm">
                                  {filteredMembers && filteredMembers.length > 0 ? (
                                    <div className="p-2 space-y-1">
                                      {filteredMembers.map((member) => (
                                        <div
                                          key={member.id}
                                          className="flex items-center gap-3 p-3 hover:bg-blue-50 cursor-pointer rounded-lg transition-colors duration-150 border border-transparent hover:border-blue-200"
                                          onClick={() => handleMemberSelect(member)}
                                          data-testid={`member-option-${member.id}`}
                                        >
                                          <div className="flex-shrink-0">
                                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                                              {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                                            </div>
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <div className="font-medium text-gray-900 truncate">
                                              {member.firstName} {member.lastName}
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                              <span className="inline-flex items-center gap-1">
                                                <User className="h-3 w-3" />
                                                #{member.memberNumber}
                                              </span>
                                              {member.email && (
                                                <span className="inline-flex items-center gap-1 truncate">
                                                  <Mail className="h-3 w-3" />
                                                  {member.email}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                          <div className="flex-shrink-0 text-blue-500">
                                            <User className="h-4 w-4" />
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="p-6 text-center">
                                      <UserCircle className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                                      <p className="text-gray-500 font-medium">Geen leden gevonden</p>
                                      <p className="text-sm text-gray-400 mt-1">Probeer een andere zoekopdracht</p>
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {selectedMember && (
                                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg shadow-sm">
                                  <div className="flex items-center gap-3">
                                    <div className="flex-shrink-0">
                                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                                        {selectedMember.firstName.charAt(0)}{selectedMember.lastName.charAt(0)}
                                      </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="font-semibold text-blue-900 text-lg">
                                        {selectedMember.firstName} {selectedMember.lastName}
                                      </div>
                                      <div className="flex items-center gap-4 text-sm text-blue-700 mt-1">
                                        <span className="inline-flex items-center gap-1">
                                          <User className="h-4 w-4" />
                                          Lidnummer #{selectedMember.memberNumber}
                                        </span>
                                        {selectedMember.email && (
                                          <span className="inline-flex items-center gap-1">
                                            <Mail className="h-4 w-4" />
                                            {selectedMember.email}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-full h-8 w-8 p-0"
                                      onClick={() => {
                                        setSelectedMember(null);
                                        setMemberSearch('');
                                        form.setValue('memberId', '');
                                      }}
                                      data-testid="button-clear-member"
                                    >
                                      ✕
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
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
                  /* Edit Mode: Different handling for internal vs external members */
                  initialData?.memberId ? (
                    /* Internal member - Read-only display */
                    <div className="space-y-4 text-gray-600">
                      {/* Member Info */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Naam</Label>
                          <div className="mt-1 p-2 bg-gray-50 rounded border text-gray-700">
                            {`${memberDetails?.firstName || 'Onbekend'} ${memberDetails?.lastName || 'Lid'}`}
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Type</Label>
                          <div className="mt-1 p-2 bg-gray-50 rounded border text-gray-700">
                            Intern lid
                          </div>
                        </div>
                      </div>
                      
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
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-500">E-mail</Label>
                          <div className="mt-1 p-2 bg-gray-50 rounded border text-gray-700">
                            {memberDetails?.email || 'Niet opgegeven'}
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Telefoon</Label>
                          <div className="mt-1 p-2 bg-gray-50 rounded border text-gray-700">
                            {memberDetails?.phone || 'Niet opgegeven'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-800">
                          💡 Persoonlijke gegevens van interne leden kunnen alleen via het lidmaatschap worden aangepast.
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* External person - Editable fields */
                    <div className="space-y-4">
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
                                data-testid="input-external-name-edit"
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
                                data-testid="input-external-email-edit"
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
                                data-testid="input-external-phone-edit"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )
                ) : (
                  /* Add Mode: Normal form fields */
                  linkType === 'EXISTING_MEMBER' ? (
                    selectedMember ? (
                      /* Show selected member info (prefilled and greyed out) */
                      <div className="space-y-4 text-gray-600">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 text-green-800 mb-2">
                            <User className="w-4 h-4" />
                            <span className="font-medium">Geselecteerd lid</span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Naam</span>
                              <p className="font-medium">{selectedMember.firstName} {selectedMember.lastName}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Lidnummer</span>
                              <p className="font-medium">#{selectedMember.memberNumber}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Categorie</span>
                              <p className="font-medium">{selectedMember.category}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Status</span>
                              <p className="font-medium">{selectedMember.active ? 'Actief' : 'Inactief'}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">E-mail</span>
                              <p className="font-medium">{selectedMember.email || 'Niet opgegeven'}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Telefoon</span>
                              <p className="font-medium">{selectedMember.phone || 'Niet opgegeven'}</p>
                            </div>
                          </div>
                          <div className="mt-3 flex gap-2">
                            <button
                              type="button"
                              onClick={() => setActiveTab('role')}
                              className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                            >
                              Ga naar Bestuursrol →
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedMember(null);
                                setMemberSearch('');
                                form.setValue('memberId', '');
                              }}
                              className="px-3 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                            >
                              Ander lid kiezen
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Member Search */}
                        <div className="space-y-2">
                          <Label htmlFor="member-search">Zoek lid</Label>
                          <div className="relative">
                            <Input
                              id="member-search"
                              placeholder="Zoek op naam of lidnummer (bijv. Ahmed Hassan of #0004)..."
                              value={memberSearch}
                              onChange={(e) => setMemberSearch(e.target.value)}
                              data-testid="input-member-search"
                            />
                            {memberSearch.length > 1 && filteredMembers && filteredMembers.length > 0 && (
                              <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-40 overflow-y-auto">
                                {filteredMembers.map((member: any) => (
                                  <button
                                    key={member.id}
                                    type="button"
                                    className="w-full px-3 py-2 text-left hover:bg-gray-50 border-b last:border-b-0"
                                    onClick={() => handleMemberSelect(member)}
                                    data-testid={`option-member-${member.id}`}
                                  >
                                    <div className="font-medium">{member.firstName} {member.lastName}</div>
                                    <div className="text-sm text-gray-500">#{member.memberNumber} • {member.category}</div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        {memberSearch.length > 1 && filteredMembers && filteredMembers.length === 0 && (
                          <div className="text-sm text-gray-500 italic">
                            Geen leden gevonden voor "{memberSearch}"
                          </div>
                        )}
                      </>
                    )
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
                                onBlur={(e) => {
                                  field.onBlur();
                                  // Auto navigate to role tab if name is filled
                                  if (e.target.value.trim()) {
                                    setTimeout(() => setActiveTab('role'), 500);
                                  }
                                }}
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
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        data-testid="select-role"
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecteer een rol" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="BESTUURSLID">Gewoon Bestuurslid</SelectItem>
                          <SelectItem value="VOORZITTER">Voorzitter</SelectItem>
                          <SelectItem value="VICE_VOORZITTER">Vice-voorzitter</SelectItem>
                          <SelectItem value="SECRETARIS">Secretaris</SelectItem>
                          <SelectItem value="PENNINGMEESTER">Penningmeester</SelectItem>
                          <SelectItem value="ANDERS">Anders</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Custom role field when "ANDERS" is selected */}
                {form.watch("role") === "ANDERS" && (
                  <FormField
                    control={form.control}
                    name="customRole"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Aangepaste rol</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Bijv. Coördinator, Adviseur, ..."
                            data-testid="input-custom-role"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="termStart"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Startdatum *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              value={field.value ? format(field.value, "dd/MM/yyyy", { locale: nl }) : ""}
                              onChange={(e) => {
                                const inputValue = e.target.value;
                                
                                // Handle numeric input with automatic formatting
                                if (/^\d+$/.test(inputValue)) {
                                  // Auto-format as user types: 04061993 -> 04/06/1993
                                  if (inputValue.length === 8) {
                                    const day = inputValue.substring(0, 2);
                                    const month = inputValue.substring(2, 4);
                                    const year = inputValue.substring(4, 8);
                                    
                                    // Validate date components
                                    const dayNum = parseInt(day);
                                    const monthNum = parseInt(month);
                                    const yearNum = parseInt(year);
                                    
                                    if (dayNum >= 1 && dayNum <= 31 && monthNum >= 1 && monthNum <= 12 && yearNum >= 1900 && yearNum <= 2100) {
                                      const date = new Date(yearNum, monthNum - 1, dayNum);
                                      if (!isNaN(date.getTime()) && date.getDate() === dayNum) {
                                        field.onChange(date);
                                        return;
                                      }
                                    }
                                  }
                                  // Allow partial input for progressive typing
                                  return;
                                }
                                
                                // Handle formatted input (DD/MM/YYYY)
                                if (inputValue.includes('/')) {
                                  const parts = inputValue.split('/');
                                  if (parts.length === 3) {
                                    const [day, month, year] = parts;
                                    if (day && month && year && year.length === 4) {
                                      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                                      if (!isNaN(date.getTime())) {
                                        field.onChange(date);
                                      }
                                    }
                                  }
                                }
                              }}
                              placeholder="DD/MM/YYYY of 04061993"
                              className="pr-10 border-gray-200"
                              data-testid="input-term-start"
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
                                        const newDate = new Date(currentDate.getFullYear(), parseInt(month), Math.min(currentDate.getDate(), new Date(currentDate.getFullYear(), parseInt(month) + 1, 0).getDate()));
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
                                        const newDate = new Date(parseInt(year), currentDate.getMonth(), Math.min(currentDate.getDate(), new Date(parseInt(year), currentDate.getMonth() + 1, 0).getDate()));
                                        field.onChange(newDate);
                                      }}
                                    >
                                      <SelectTrigger className="w-[80px] h-8">
                                        <SelectValue placeholder="Jaar" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {Array.from({ length: 100 }, (_, i) => {
                                          const year = new Date().getFullYear() + 10 - i;
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
                                  onSelect={field.onChange}
                                  month={field.value || new Date()}
                                  initialFocus
                                  locale={nl}
                                  classNames={{
                                    months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                                    month: "space-y-4",
                                    caption: "flex justify-center pt-1 relative items-center",
                                    caption_label: "text-sm font-medium",
                                    nav: "space-x-1 flex items-center",
                                    nav_button: cn(
                                      "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
                                    ),
                                    nav_button_previous: "absolute left-1",
                                    nav_button_next: "absolute right-1",
                                    table: "w-full border-collapse space-y-1",
                                    head_row: "flex",
                                    head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                                    row: "flex w-full mt-2",
                                    cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                                    day: cn("h-9 w-9 p-0 font-normal aria-selected:opacity-100"),
                                    day_range_end: "day-range-end",
                                    day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                                    day_today: "bg-accent text-accent-foreground",
                                    day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                                    day_disabled: "text-muted-foreground opacity-50",
                                    day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                                    day_hidden: "invisible",
                                  }}
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
                    name="termEnd"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Einddatum *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              value={field.value ? format(field.value, "dd/MM/yyyy", { locale: nl }) : ""}
                              onChange={(e) => {
                                const inputValue = e.target.value;
                                
                                // Handle numeric input with automatic formatting
                                if (/^\d+$/.test(inputValue)) {
                                  // Auto-format as user types: 31122025 -> 31/12/2025
                                  if (inputValue.length === 8) {
                                    const day = inputValue.substring(0, 2);
                                    const month = inputValue.substring(2, 4);
                                    const year = inputValue.substring(4, 8);
                                    
                                    // Validate date components
                                    const dayNum = parseInt(day);
                                    const monthNum = parseInt(month);
                                    const yearNum = parseInt(year);
                                    
                                    if (dayNum >= 1 && dayNum <= 31 && monthNum >= 1 && monthNum <= 12 && yearNum >= 1900 && yearNum <= 2100) {
                                      const date = new Date(yearNum, monthNum - 1, dayNum);
                                      if (!isNaN(date.getTime()) && date.getDate() === dayNum) {
                                        field.onChange(date);
                                        return;
                                      }
                                    }
                                  }
                                  // Allow partial input for progressive typing
                                  return;
                                }
                                
                                // Handle formatted input (DD/MM/YYYY)
                                if (inputValue.includes('/')) {
                                  const parts = inputValue.split('/');
                                  if (parts.length === 3) {
                                    const [day, month, year] = parts;
                                    if (day && month && year && year.length === 4) {
                                      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                                      if (!isNaN(date.getTime())) {
                                        field.onChange(date);
                                      }
                                    }
                                  }
                                }
                              }}
                              placeholder="DD/MM/YYYY of 31122025"
                              className="pr-10 border-gray-200"
                              data-testid="input-term-end"
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
                                        const newDate = new Date(currentDate.getFullYear(), parseInt(month), Math.min(currentDate.getDate(), new Date(currentDate.getFullYear(), parseInt(month) + 1, 0).getDate()));
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
                                        const newDate = new Date(parseInt(year), currentDate.getMonth(), Math.min(currentDate.getDate(), new Date(parseInt(year), currentDate.getMonth() + 1, 0).getDate()));
                                        field.onChange(newDate);
                                      }}
                                    >
                                      <SelectTrigger className="w-[80px] h-8">
                                        <SelectValue placeholder="Jaar" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {Array.from({ length: 100 }, (_, i) => {
                                          const year = new Date().getFullYear() + 10 - i;
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
                                  onSelect={field.onChange}
                                  month={field.value || new Date()}
                                  initialFocus
                                  locale={nl}
                                  classNames={{
                                    months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                                    month: "space-y-4",
                                    caption: "flex justify-center pt-1 relative items-center",
                                    caption_label: "text-sm font-medium",
                                    nav: "space-x-1 flex items-center",
                                    nav_button: cn(
                                      "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
                                    ),
                                    nav_button_previous: "absolute left-1",
                                    nav_button_next: "absolute right-1",
                                    table: "w-full border-collapse space-y-1",
                                    head_row: "flex",
                                    head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                                    row: "flex w-full mt-2",
                                    cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                                    day: cn("h-9 w-9 p-0 font-normal aria-selected:opacity-100"),
                                    day_range_end: "day-range-end",
                                    day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                                    day_today: "bg-accent text-accent-foreground",
                                    day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                                    day_disabled: "text-muted-foreground opacity-50",
                                    day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                                    day_hidden: "invisible",
                                  }}
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                        </FormControl>
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
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, User, Mail, Phone } from "lucide-react";
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
  role: z.string().min(1, "Rol is verplicht"),
  status: z.enum(['ACTIEF', 'INACTIEF']).default('ACTIEF'),
  termStart: z.date({ required_error: "Startdatum is verplicht" }),
  termEnd: z.date().optional(),
  
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
}

export function BoardMemberForm({ onSubmit, onCancel, isLoading = false }: BoardMemberFormProps) {
  const [linkType, setLinkType] = useState<'EXISTING_MEMBER' | 'EXTERNAL_PERSON'>('EXISTING_MEMBER');
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState<any>(null);

  // Fetch members for autocomplete
  const { data: members } = useQuery<any[]>({
    queryKey: ["/api/members", { q: memberSearch }],
    staleTime: 10000,
    enabled: linkType === 'EXISTING_MEMBER' && memberSearch.length > 0,
  });

  const form = useForm<BoardMemberFormData>({
    resolver: zodResolver(boardMemberSchema),
    defaultValues: {
      linkType: 'EXISTING_MEMBER',
      status: 'ACTIEF',
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
        {/* 1. Koppeling Type */}
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

        {/* 2. Persoonsgegevens */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Persoonsgegevens</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {linkType === 'EXISTING_MEMBER' ? (
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
            )}
          </CardContent>
        </Card>

        {/* 3. Bestuursrol */}
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
                  <FormLabel>Rol *</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Bijv. Voorzitter, Secretaris, etc."
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

        {/* 4. Extra informatie */}
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

            <FormField
              control={form.control}
              name="avatarUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Avatar URL</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="https://voorbeeld.com/foto.jpg"
                      data-testid="input-avatar-url"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="orderIndex"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Volgorde in lijst</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="number"
                      placeholder="1, 2, 3..."
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      data-testid="input-order-index"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

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
            {isLoading ? "Opslaan..." : "Bestuurslid Toevoegen"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
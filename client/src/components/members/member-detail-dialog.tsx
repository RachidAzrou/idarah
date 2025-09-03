import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Member, MemberFinancialSettings } from "@shared/schema";
import { formatCurrencyBE, formatDateBE, getMemberCategoryLabel } from "@/lib/format";
import { User, Calendar, CreditCard, Phone, Mail, MapPin, FileText, Edit, X, UserCircle, Contact, Shield, Settings, Home, Building2, CheckSquare } from "lucide-react";

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

interface MemberDetailDialogProps {
  member: MemberWithDetails | null;
  open: boolean;
  onClose: () => void;
  onEdit?: (member: MemberWithDetails) => void;
}

export function MemberDetailDialog({ member, open, onClose, onEdit }: MemberDetailDialogProps) {
  const [activeTab, setActiveTab] = useState('personal');
  
  if (!member) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Lid Details</DialogTitle>
          <DialogDescription>
            Bekijk alle details van dit lid
          </DialogDescription>
        </DialogHeader>

        {/* Header Info */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-sm text-gray-600">#{member.memberNumber}</span>
            <Badge variant={member.active ? "default" : "secondary"}>
              {member.active ? 'Actief' : 'Inactief'}
            </Badge>
          </div>
          <h3 className="font-semibold text-lg">
            {member.firstName} {member.lastName}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {getMemberCategoryLabel(member.category)}
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="personal" className="flex items-center gap-2">
              <UserCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Persoonlijk</span>
            </TabsTrigger>
            <TabsTrigger value="address" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Adres</span>
            </TabsTrigger>
            <TabsTrigger value="financial" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Financieel</span>
            </TabsTrigger>
            <TabsTrigger value="organization" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Organisatie</span>
            </TabsTrigger>
            <TabsTrigger value="permissions" className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Toestemmingen</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-3">
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2 text-sm">
                <User className="h-4 w-4" />
                Persoonlijke gegevens
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Naam</span>
                  <p className="font-medium">{member.firstName} {member.lastName}</p>
                </div>
                <div>
                  <span className="text-gray-500">Geslacht</span>
                  <p className="font-medium">{member.gender || '-'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Geboortedatum</span>
                  <p className="font-medium">{member.birthDate ? formatDateBE(member.birthDate) : '-'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Categorie</span>
                  <p className="font-medium">{getMemberCategoryLabel(member.category)}</p>
                </div>
                <div>
                  <span className="text-gray-500">E-mail adres</span>
                  <p className="font-medium">{member.email}</p>
                </div>
                <div>
                  <span className="text-gray-500">Telefoon</span>
                  <p className="font-medium">{member.phone || '-'}</p>
                </div>
              </div>
            </div>

          </TabsContent>

          <TabsContent value="address" className="space-y-3">
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2 text-sm">
                <Home className="h-4 w-4" />
                Adresgegevens
              </h4>
              <div className="grid grid-cols-1 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Adres</span>
                  <div className="font-medium">
                    {(member.street || member.number) ? (
                      <>
                        <p>{member.street} {member.number}{member.bus ? ` bus ${member.bus}` : ''}</p>
                        {(member.city || member.postalCode) && (
                          <p>{member.postalCode} {member.city}</p>
                        )}
                        {member.country && <p>{member.country}</p>}
                      </>
                    ) : (
                      <p>-</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </TabsContent>

          <TabsContent value="financial" className="space-y-3">
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2 text-sm">
                <CreditCard className="h-4 w-4" />
                Financiële gegevens
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Betaalmethode</span>
                  <p className="font-medium">{member.financialSettings?.paymentMethod || 'SEPA'}</p>
                </div>
                <div>
                  <span className="text-gray-500">IBAN</span>
                  <p className="font-medium font-mono">{member.financialSettings?.iban || '-'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Betalingstermijn</span>
                  <p className="font-medium">{member.financialSettings?.paymentTerm === 'MONTHLY' ? 'Maandelijks' : member.financialSettings?.paymentTerm === 'YEARLY' ? 'Jaarlijks' : '-'}</p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="organization" className="space-y-3">
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4" />
                Organisatie gegevens
              </h4>
              <div className="grid grid-cols-1 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Interesse in actieve rol</span>
                  <p className="font-medium">{member.permissions?.interestedInActiveRole ? 'Ja' : 'Nee'}</p>
                  {member.permissions?.interestedInActiveRole && member.permissions?.roleDescription && (
                    <div className="mt-2">
                      <span className="text-gray-500">Beschrijving</span>
                      <p className="font-medium text-sm">{member.permissions.roleDescription}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="permissions" className="space-y-3">
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2 text-sm">
                <CheckSquare className="h-4 w-4" />
                Toestemmingen
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Privacy verklaring</span>
                  <p className="font-medium">{member.permissions?.privacyAgreement ? 'Akkoord gegeven' : 'Niet gegeven'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Foto/video toestemming</span>
                  <p className="font-medium">{member.permissions?.photoVideoConsent ? 'Ja' : 'Nee'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Nieuwsbrief</span>
                  <p className="font-medium">{member.permissions?.newsletterSubscription ? 'Ja' : 'Nee'}</p>
                </div>
                <div>
                  <span className="text-gray-500">WhatsApp lijst</span>
                  <p className="font-medium">{member.permissions?.whatsappList ? 'Ja' : 'Nee'}</p>
                </div>
              </div>
            </div>

            {/* System Info moved here */}
            <Separator />
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4" />
                Systeem informatie
              </h4>
              <div className="grid grid-cols-1 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Aangemaakt op</span>
                  <p className="font-medium">{formatDateBE(member.createdAt)}</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

      </DialogContent>
    </Dialog>
  );
}
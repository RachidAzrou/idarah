import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Member } from "@shared/schema";
import { formatCurrencyBE, formatDateBE, getMemberCategoryLabel } from "@/lib/format";
import { User, Calendar, CreditCard, Phone, Mail, MapPin, FileText, Edit, X, UserCircle, Contact, Shield, Settings } from "lucide-react";

interface MemberDetailDialogProps {
  member: Member | null;
  open: boolean;
  onClose: () => void;
  onEdit?: (member: Member) => void;
}

export function MemberDetailDialog({ member, open, onClose, onEdit }: MemberDetailDialogProps) {
  const [activeTab, setActiveTab] = useState('personal');
  
  if (!member) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Lid Details</DialogTitle>
          <DialogDescription>
            Bekijk alle details van dit lid
          </DialogDescription>
        </DialogHeader>

        {/* Header Info */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-sm text-gray-600">#{member.memberNumber}</span>
            <Badge variant={member.status === 'ACTIVE' ? "default" : "secondary"}>
              {member.status === 'ACTIVE' ? 'Actief' : 'Inactief'}
            </Badge>
          </div>
          <h3 className="font-semibold text-lg">
            {member.firstName} {member.lastName}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {getMemberCategoryLabel(member.category)}
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="personal" className="flex items-center gap-2">
              <UserCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Persoonlijk</span>
            </TabsTrigger>
            <TabsTrigger value="contact" className="flex items-center gap-2">
              <Contact className="h-4 w-4" />
              <span className="hidden sm:inline">Contact</span>
            </TabsTrigger>
            <TabsTrigger value="membership" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Lidmaatschap</span>
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Systeem</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Persoonlijke gegevens
              </h4>
              <div className="grid grid-cols-2 gap-6 text-sm">
                <div>
                  <span className="text-gray-500">Voornaam</span>
                  <p className="font-medium">{member.firstName}</p>
                </div>
                <div>
                  <span className="text-gray-500">Achternaam</span>
                  <p className="font-medium">{member.lastName}</p>
                </div>
                <div>
                  <span className="text-gray-500">Geboortedatum</span>
                  <p className="font-medium">{member.dateOfBirth ? formatDateBE(member.dateOfBirth) : '-'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Geslacht</span>
                  <p className="font-medium">{member.gender || '-'}</p>
                </div>
              </div>
            </div>

            {/* Notes in Personal Tab */}
            {member.notes && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Opmerkingen
                  </h4>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                    <p className="text-sm">{member.notes}</p>
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="contact" className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Contactgegevens
              </h4>
              <div className="grid grid-cols-2 gap-6 text-sm">
                <div>
                  <span className="text-gray-500">E-mail</span>
                  <p className="font-medium">{member.email}</p>
                </div>
                <div>
                  <span className="text-gray-500">Telefoon</span>
                  <p className="font-medium">{member.phone || '-'}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500">Adres</span>
                  <div className="font-medium">
                    {member.address ? (
                      <>
                        <p>{member.address}</p>
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

            {/* Emergency Contact */}
            {(member.emergencyContactName || member.emergencyContactPhone) && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Noodcontact
                  </h4>
                  <div className="grid grid-cols-2 gap-6 text-sm">
                    <div>
                      <span className="text-gray-500">Naam</span>
                      <p className="font-medium">{member.emergencyContactName || '-'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Telefoon</span>
                      <p className="font-medium">{member.emergencyContactPhone || '-'}</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="membership" className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Lidmaatschap informatie
              </h4>
              <div className="grid grid-cols-3 gap-6 text-sm">
                <div>
                  <span className="text-gray-500">Lidnummer</span>
                  <p className="font-mono font-medium">{member.memberNumber}</p>
                </div>
                <div>
                  <span className="text-gray-500">Categorie</span>
                  <p className="font-medium">{getMemberCategoryLabel(member.category)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Status</span>
                  <Badge variant={member.status === 'ACTIVE' ? "default" : "secondary"}>
                    {member.status === 'ACTIVE' ? 'Actief' : 'Inactief'}
                  </Badge>
                </div>
                <div>
                  <span className="text-gray-500">Lid sinds</span>
                  <p className="font-medium">{member.joinDate ? formatDateBE(member.joinDate) : '-'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Lidgeld</span>
                  <p className="font-medium">{member.membershipFee ? formatCurrencyBE(member.membershipFee) : '-'}</p>
                </div>
                <div>
                  <span className="text-gray-500">SEPA mandaat</span>
                  <Badge variant={member.hasSepaMandate ? "default" : "secondary"}>
                    {member.hasSepaMandate ? 'Actief' : 'Niet actief'}
                  </Badge>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Systeem informatie
              </h4>
              <div className="grid grid-cols-2 gap-6 text-sm">
                <div>
                  <span className="text-gray-500">Aangemaakt op</span>
                  <p className="font-medium">{formatDateBE(member.createdAt)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Laatst gewijzigd</span>
                  <p className="font-medium">{member.updatedAt ? formatDateBE(member.updatedAt) : '-'}</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="pt-4 border-t">
          <div className="flex gap-3">
            {onEdit && (
              <Button 
                onClick={() => {
                  onEdit(member);
                  onClose();
                }}
                className="flex-1"
                data-testid="button-edit-member"
              >
                <Edit className="h-4 w-4 mr-2" />
                Bewerken
              </Button>
            )}
            <Button 
              onClick={onClose}
              variant="outline"
              className="flex-1"
              data-testid="button-close-detail"
            >
              <X className="h-4 w-4 mr-2" />
              Sluiten
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
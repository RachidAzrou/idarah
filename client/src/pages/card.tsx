import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { LiveCard } from "@/components/cards/live-card";
import { CardCanvas } from "@/components/card/CardCanvas";
import { AspectBox } from "@/components/card/AspectBox";
import { FullScreenButton } from "@/components/card/FullScreenButton";
import { InstallCoach, useInstallCoach } from "@/components/pwa/InstallCoach";
import { useQuery } from "@tanstack/react-query";
import type { Member, CardMeta, Tenant } from "@shared/schema";

interface CardData {
  member: Member;
  cardMeta: CardMeta;
  tenant: Tenant;
}

export function CardPage() {
  const [, params] = useRoute("/card/:memberId");
  const [cardData, setCardData] = useState<CardData | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const installCoach = useInstallCoach();

  // Fetch card data
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/members', params?.memberId, refreshTrigger],
    queryFn: async () => {
      if (!params?.memberId) return null;
      
      // For now, get member data and create mock card data
      const response = await fetch(`/api/members/${params.memberId}`);
      if (!response.ok) {
        throw new Error('Member not found');
      }
      
      const member = await response.json();
      
      // Mock card meta and tenant data for testing
      const mockCardMeta: CardMeta = {
        id: 'mock-card-id',
        tenantId: member.tenantId,
        memberId: member.id,
        version: 1,
        etag: 'mock-etag',
        secureToken: 'mock-secure-token',
        qrToken: 'mock-qr-token',
        status: 'ACTUEEL',
        validUntil: new Date(new Date().getFullYear(), 11, 31),
        lastRenderedAt: new Date(),
      };
      
      const mockTenant: Tenant = {
        id: member.tenantId,
        name: 'Test Moskee',
        slug: 'test-moskee',
        street: null,
        number: null,
        postalCode: null,
        city: null,
        country: 'België',
        email: null,
        phone: null,
        website: null,
        companyNumber: null,
        companyType: null,
        logoUrl: null,
        primaryColor: '#bb2e2e',
        studentFee: '15.00',
        adultFee: '25.00',
        seniorFee: '20.00',
        defaultPaymentTerm: 'YEARLY',
        defaultPaymentMethod: 'SEPA',
        createdAt: new Date(),
      };
      
      return {
        member,
        cardMeta: mockCardMeta,
        tenant: mockTenant,
      };
    },
    enabled: !!params?.memberId,
  });

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
    refetch();
  };

  if (!params?.memberId) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Geen lid geselecteerd</h1>
          <p>Selecteer een lid om de digitale kaart te bekijken.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Lidkaart laden...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Lidkaart niet gevonden</h1>
          <p>De opgevraagde lidkaart bestaat niet of is niet beschikbaar.</p>
        </div>
      </div>
    );
  }

  return (
    <CardCanvas>
      <FullScreenButton />
      <AspectBox>
        <LiveCard
          member={data.member}
          cardMeta={data.cardMeta}
          tenant={data.tenant}
          onRefresh={handleRefresh}
          isRefreshing={isLoading}
          standalone={true}
          className="h-full w-full"
        />
      </AspectBox>
      <InstallCoach 
        isOpen={installCoach.isOpen} 
        onClose={installCoach.close} 
      />
    </CardCanvas>
  );
}
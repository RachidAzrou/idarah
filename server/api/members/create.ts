import { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../../db';
import { members, memberFinancialSettings } from '../../../shared/schema';
import { createFirstFeeForMember } from '../../../lib/server/fees/first-fee';
import { beNow } from '../../../lib/server/time';

const createMemberSchema = z.object({
  memberNumber: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  gender: z.enum(['M', 'V']),
  birthDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  category: z.enum(['STUDENT', 'VOLWASSEN', 'SENIOR']),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  street: z.string().optional(),
  number: z.string().optional(),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  joinDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  
  // Financial settings
  preferredMethod: z.enum(['SEPA', 'OVERSCHRIJVING', 'BANCONTACT', 'CASH']),
  preferredTerm: z.enum(['MONTHLY', 'YEARLY']),
  monthlyAmount: z.number().default(0),
  yearlyAmount: z.number().default(0),
  iban: z.string().optional(),
  sepaMandate: z.string().optional(),
});

export async function createMemberHandler(req: Request, res: Response) {
  try {
    const tenantId = (req as any).tenantId;
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant context required' });
    }

    const body = createMemberSchema.parse(req.body);
    const joinDate = body.joinDate || beNow();

    // Start transaction
    const result = await db.transaction(async (tx) => {
      // Create member
      const [member] = await tx.insert(members).values({
        tenantId,
        memberNumber: body.memberNumber,
        firstName: body.firstName,
        lastName: body.lastName,
        gender: body.gender,
        birthDate: body.birthDate?.toISOString(),
        category: body.category,
        email: body.email,
        phone: body.phone,
        street: body.street,
        number: body.number,
        postalCode: body.postalCode,
        city: body.city,
        country: body.country,
        joinDate: joinDate.toISOString(),
        isActive: true
      }).returning();

      // Create financial settings
      await tx.insert(memberFinancialSettings).values({
        memberId: member.id,
        preferredMethod: body.preferredMethod,
        preferredTerm: body.preferredTerm,
        monthlyAmount: body.monthlyAmount.toString(),
        yearlyAmount: body.yearlyAmount.toString(),
        iban: body.iban,
        sepaMandate: body.sepaMandate,
        billingAnchorAt: joinDate.toISOString()
      });

      return member;
    });

    // Create first fee (outside transaction to avoid issues)
    try {
      await createFirstFeeForMember(result.id, joinDate);
    } catch (feeError) {
      console.error('Failed to create first fee:', feeError);
      // Don't fail the member creation, just log the error
    }

    res.status(201).json({
      success: true,
      member: result,
      message: 'Member created successfully with first fee'
    });

  } catch (error) {
    console.error('Member creation error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.errors 
      });
    }

    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
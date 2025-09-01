import { Request, Response } from 'express';
import { z } from 'zod';
import { generateTenantFees } from '../../../../lib/server/fees/generator';
import { beNow } from '../../../../lib/server/time';

const generateFeesSchema = z.object({
  tenantId: z.string().optional(),
  asOf: z.string().optional().transform(val => val ? new Date(val) : undefined),
  strategy: z.enum(['current', 'catchup']).default('current')
});

export async function generateFeesHandler(req: Request, res: Response) {
  try {
    // Check authorization header (should contain API key or JWT)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    // TODO: Validate the token/API key here
    // For now, we'll accept any Bearer token

    const body = generateFeesSchema.parse(req.body);
    const { tenantId, asOf, strategy } = body;

    // If no tenantId provided, try to get from request context (middleware)
    const targetTenantId = tenantId || (req as any).tenantId;
    
    if (!targetTenantId) {
      return res.status(400).json({ error: 'tenantId is required' });
    }

    const currentTime = asOf || beNow();

    await generateTenantFees(targetTenantId, currentTime, strategy);

    res.json({
      success: true,
      message: `Fees generated successfully for tenant ${targetTenantId}`,
      strategy,
      asOf: currentTime.toISOString()
    });

  } catch (error) {
    console.error('Fee generation error:', error);
    
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
import { Router } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { authMiddleware } from "../middleware/auth";
import { tenantMiddleware } from "../middleware/tenant";

const router = Router();


// Get all public screens (requires auth)
router.get('/', authMiddleware, tenantMiddleware, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const screens = await storage.getPublicScreensByTenant(tenantId);
    res.json(screens);
  } catch (error) {
    console.error('Error fetching public screens:', error);
    res.status(500).json({ error: 'Failed to fetch public screens' });
  }
});

// Get public screen by token (public route)
router.get('/token/:token', async (req, res) => {
  try {
    const screen = await storage.getPublicScreenByToken(req.params.token);
    if (!screen) {
      return res.status(404).json({ error: 'Screen not found' });
    }
    
    // Check if the screen is active
    if (!screen.active) {
      return res.status(403).json({ 
        error: 'Screen inactive', 
        message: 'Dit scherm is momenteel niet actief',
        type: screen.type 
      });
    }
    
    // For LEDENLIJST screens, also fetch member and fee data
    let screenData: any = screen;
    if (screen.type === 'LEDENLIJST') {
      try {
        console.log(`Fetching members for tenant: ${screen.tenantId}`);
        const members = await storage.getMembersByTenant(screen.tenantId);
        console.log(`Found ${members.length} total members`);
        // Only send active members for public display
        const activeMembers = members.filter(member => member.active);
        console.log(`Found ${activeMembers.length} active members for public display`);
        
        // Also fetch membership fees for payment status
        const allFees = await storage.getMembershipFeesByTenant(screen.tenantId);
        console.log(`Found ${allFees.length} membership fees`);
        
        // Organize fees by member and period for easy lookup
        const feesByMember = allFees.reduce((acc: any, fee: any) => {
          if (!acc[fee.memberId]) acc[fee.memberId] = [];
          acc[fee.memberId].push(fee);
          return acc;
        }, {});
        
        // Add payment status to each member
        const membersWithPayments = activeMembers.map(member => ({
          ...member,
          membershipFees: feesByMember[member.id] || []
        }));
        
        screenData = {
          ...screen,
          members: membersWithPayments
        } as any;
      } catch (error) {
        console.error('Error fetching members for public screen:', error);
        // Continue without member data rather than failing the whole request
      }
    }
    
    res.json(screenData);
  } catch (error) {
    console.error('Error fetching public screen:', error);
    res.status(500).json({ error: 'Failed to fetch public screen' });
  }
});

// Create new public screen (requires auth)
router.post('/', authMiddleware, tenantMiddleware, async (req, res) => {
  try {
    const createSchema = z.object({
      name: z.string().min(1),
      type: z.enum(['LEDENLIJST', 'MEDEDELINGEN', 'MULTIMEDIA']),
      active: z.boolean(),
      config: z.any().default({})
    });

    const data = createSchema.parse(req.body);
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const screenData = {
      ...data,
      tenantId,
      publicToken: `screen-${Math.random().toString(36).substring(2, 15)}`,
      config: data.config || {}
    };
    
    const screen = await storage.createPublicScreen(screenData);
    res.status(201).json(screen);
  } catch (error) {
    console.error('Error creating public screen:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid data', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to create public screen' });
  }
});

// Update public screen (requires auth)
// Also support PATCH for partial updates
router.patch('/:id', authMiddleware, tenantMiddleware, async (req, res) => {
  try {
    const updateSchema = z.object({
      name: z.string().min(1).optional(),
      active: z.boolean().optional(),
      config: z.any().optional()
    });

    const data = updateSchema.parse(req.body);
    const screen = await storage.updatePublicScreen(req.params.id, data);
    res.json(screen);
  } catch (error) {
    console.error('Error updating public screen:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid data', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to update public screen' });
  }
});

// Update public screen
router.put('/:id', authMiddleware, tenantMiddleware, async (req, res) => {
  try {
    const updateSchema = z.object({
      name: z.string().min(1).optional(),
      active: z.boolean().optional(),
      config: z.any().optional()
    });

    const data = updateSchema.parse(req.body);
    const screen = await storage.updatePublicScreen(req.params.id, data);
    res.json(screen);
  } catch (error) {
    console.error('Error updating public screen:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid data', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to update public screen' });
  }
});

// Delete public screen (requires auth)
router.delete('/:id', authMiddleware, tenantMiddleware, async (req, res) => {
  try {
    await storage.deletePublicScreen(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting public screen:', error);
    res.status(500).json({ error: 'Failed to delete public screen' });
  }
});

export default router;
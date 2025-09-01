import { Router } from "express";
import { z } from "zod";
import { publicScreensStore } from "../../client/src/lib/mock/public-screens";

const router = Router();

// Get all public screens
router.get('/', async (req, res) => {
  try {
    const screens = publicScreensStore.list();
    res.json(screens);
  } catch (error) {
    console.error('Error fetching public screens:', error);
    res.status(500).json({ error: 'Failed to fetch public screens' });
  }
});

// Get public screen by token (public route)
router.get('/token/:token', async (req, res) => {
  try {
    const screen = publicScreensStore.byToken(req.params.token);
    if (!screen) {
      return res.status(404).json({ error: 'Screen not found' });
    }
    res.json(screen);
  } catch (error) {
    console.error('Error fetching public screen:', error);
    res.status(500).json({ error: 'Failed to fetch public screen' });
  }
});

// Create new public screen
router.post('/', async (req, res) => {
  try {
    const createSchema = z.object({
      name: z.string().min(1),
      type: z.enum(['PAYMENT_MATRIX', 'ANNOUNCEMENTS']),
      active: z.boolean(),
      config: z.any()
    });

    const data = createSchema.parse(req.body);
    const screen = publicScreensStore.create(data);
    res.status(201).json(screen);
  } catch (error) {
    console.error('Error creating public screen:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid data', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to create public screen' });
  }
});

// Update public screen
router.put('/:id', async (req, res) => {
  try {
    const updateSchema = z.object({
      name: z.string().min(1).optional(),
      active: z.boolean().optional(),
      config: z.any().optional()
    });

    const data = updateSchema.parse(req.body);
    const screen = publicScreensStore.update(req.params.id, data);
    res.json(screen);
  } catch (error) {
    console.error('Error updating public screen:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid data', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to update public screen' });
  }
});

// Delete public screen
router.delete('/:id', async (req, res) => {
  try {
    publicScreensStore.remove(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting public screen:', error);
    res.status(500).json({ error: 'Failed to delete public screen' });
  }
});

export default router;
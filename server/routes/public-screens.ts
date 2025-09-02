import { Router } from "express";
import { z } from "zod";
import multer from "multer";
import path from "path";
import { storage } from "../storage";
import { authMiddleware } from "../middleware/auth";
import { tenantMiddleware } from "../middleware/tenant";

const router = Router();

// Configure multer for file uploads
const storage_multer = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Generate unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage_multer,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow images and videos
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Alleen afbeeldingen en video\'s zijn toegestaan'));
    }
  }
});

// Upload media file for multimedia screens
router.post('/upload', authMiddleware, tenantMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Geen bestand geüpload' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const fileType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';

    res.json({
      url: fileUrl,
      type: fileType,
      filename: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Fout bij het uploaden van het bestand' });
  }
});

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
    res.json(screen);
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
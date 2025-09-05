// Vercel serverless function for API endpoints
import express from 'express';

// Import the built Express server
let app;
try {
  const serverModule = await import('../dist/index.js');
  app = serverModule.default;
} catch (error) {
  console.error('Error loading server:', error);
  
  // Fallback minimal server
  app = express();
  app.use(express.json());
  app.get('/api/health', (req, res) => {
    res.json({ status: 'Server loading...', error: error.message });
  });
}

export default app;
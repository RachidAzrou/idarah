// Vercel serverless function for API endpoints
const express = require('express');
const path = require('path');

// Import the built Express server
let app;
try {
  app = require('../dist/index.js').default;
} catch (error) {
  console.error('Error loading server:', error);
  
  // Fallback minimal server
  app = express();
  app.use(express.json());
  app.get('/api/health', (req, res) => {
    res.json({ status: 'Server loading...', error: error.message });
  });
}

module.exports = app;
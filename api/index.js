// Vercel serverless function
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

// Import the built Express app
import('../dist/index.js').then(({ default: app }) => {
  module.exports = (req, res) => {
    return app(req, res);
  };
});

// For now, simple export
module.exports = async (req, res) => {
  try {
    const app = await import('../dist/index.js');
    return app.default(req, res);
  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};
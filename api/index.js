// Vercel API endpoint that imports the built server
const { default: app } = require('../dist/index.js');

module.exports = app;
const express = require("express");
// const { postgraphile } = require("postgraphile");
const cors = require('cors');

// Force immediate logging
require('console').Console({ stdout: process.stdout, stderr: process.stderr });

const app = express();

// Add CORS middleware with explicit configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Add basic health check endpoint
app.get('/health', (req, res) => {
  res.send('OK');
});

// Add test route
app.get('/', (req, res) => {
  res.send('Express server is running successfully!');
});

console.log("=== Starting server ===");
console.log("Current timestamp:", new Date().toISOString());
console.log("Environment variables:");
console.log("DATABASE_URL:", process.env.DATABASE_URL);
console.log("PORT:", process.env.PORT);

// Start the server directly without database connection
const port = process.env.PORT || 5000;
app.listen(port, '0.0.0.0', (err) => {
  if (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
  console.log(`Server started on port ${port}`);
  console.log(`Test endpoint available at: http://localhost:${port}`);
});

// Error handling
app.on('error', (error) => {
  console.error('Server error:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Performing graceful shutdown...');
  process.exit(0);
});
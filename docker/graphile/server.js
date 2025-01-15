const express = require("express");
const { postgraphile } = require("postgraphile");

// Force immediate logging
require('console').Console({ stdout: process.stdout, stderr: process.stderr });

const app = express();

console.log("=== Starting server ===");
console.log("Current timestamp:", new Date().toISOString());
console.log("Environment variables:");
console.log("DATABASE_URL:", process.env.DATABASE_URL);
console.log("PORT:", process.env.PORT);

// Test database connection before starting server
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

pool.connect()
  .then(() => {
    console.log("Successfully connected to PostgreSQL");
    
    app.use(
      postgraphile(
        process.env.DATABASE_URL,
        "public",
        {
          watchPg: true,
          graphiql: true,
          enhanceGraphiql: true,
          enableCors: true,
        }
      )
    );
    console.log("PostGraphile middleware initialized successfully");

    // Start server only after confirming database connection
    const port = process.env.PORT || 5000;
    app.listen(port, '0.0.0.0', (err) => {
      if (err) {
        console.error("Failed to start server:", err);
        process.exit(1);
      }
      console.log(`Server started on port ${port}`);
      console.log(`GraphiQL available at: http://localhost:${port}/graphiql`);
    });
  })
  .catch(err => {
    console.error("Failed to connect to PostgreSQL:", err);
    process.exit(1);
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
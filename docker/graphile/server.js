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

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

try {
  app.use(
    postgraphile(
      process.env.DATABASE_URL || "postgres://user:pass@host:5432/dbname",
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
} catch (error) {
  console.error("Failed to initialize PostGraphile:", error);
  process.exit(1);
}

const port = process.env.PORT || 5000;
app.listen(port, '0.0.0.0', (err) => {
  if (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
  console.log(`Server started on port ${port}`);
  console.log(`GraphiQL available at: http://localhost:${port}/graphiql`);
});

// Add error handling
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
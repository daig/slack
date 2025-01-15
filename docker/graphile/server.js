const express = require("express");
const { postgraphile } = require("postgraphile");

const app = express();

console.log("Starting server...");
console.log("Database URL:", process.env.DATABASE_URL || "postgres://user:pass@host:5432/dbname");

app.use(
  postgraphile(
    process.env.DATABASE_URL || "postgres://user:pass@host:5432/dbname",
    "public",
    {
      watchPg: true,
      graphiql: true,
      enhanceGraphiql: true,
    }
  )
);

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
  console.log("GraphiQL available at: http://localhost:" + port + "/graphiql");
});

// Add error handling
app.on('error', (error) => {
  console.error('Server error:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
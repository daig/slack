const express = require("express");
const { postgraphile, makePluginHook } = require("postgraphile");
const { default: PgPubsub } = require('@graphile/pg-pubsub');
const cors = require('cors');

const app = express();
const pluginHook = makePluginHook([PgPubsub]);

console.log("Starting server...");
console.log("Database URL:", process.env.DATABASE_URL || "postgres://user:pass@host:5432/dbname");

// Configure CORS
const corsOptions = {
  origin: process.env.REACT_APP_GRAPHQL_ENDPOINT ? `http://${new URL(process.env.REACT_APP_GRAPHQL_ENDPOINT).hostname}` : 'http://localhost',
  credentials: true
};

// Enable CORS for all routes
app.use(cors(corsOptions));

// Enable pre-flight requests for all routes
app.options('*', cors(corsOptions));

const postgraphileOptions = {
  pluginHook,
  watchPg: true,
  graphiql: true,
  enhanceGraphiql: true,
  subscriptions: true,
  simpleSubscriptions: true,
  // Add these JWT-related options
  enableCors: true,
  graphileBuildOptions: {
    // Add subscription-related build options
    subscriptionAuthorizationFunction: 'process_subscription_authorization',
  },
  appendPlugins: [
    // Add any additional plugins here
  ],
};

const middleware = postgraphile(
  process.env.DATABASE_URL || "postgres://user:pass@host:5432/dbname",
  "public",
  postgraphileOptions
);

app.use(middleware);

const port = process.env.PORT || 5000;
const server = app.listen(port, () => {
  console.log(`Server started on port ${port}`);
  console.log("GraphiQL available at: http://localhost:" + port + "/graphiql");
  const wsServer = middleware.websocketServer;
  if (wsServer) {
    console.log("WebSocket server is running");
  }
});

// Add error handling
app.on('error', (error) => {
  console.error('Server error:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
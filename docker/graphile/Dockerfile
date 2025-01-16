FROM node:alpine
LABEL description="Instant high-performance GraphQL API for your PostgreSQL database https://github.com/graphile/postgraphile"

WORKDIR /app

# Install dependencies
RUN npm init -y && \
    npm install postgraphile postgraphile-plugin-connection-filter @graphile/pg-pubsub express cors

# Copy server.js instead of creating it inline
COPY server.js .

EXPOSE 5000

CMD ["node", "server.js"]
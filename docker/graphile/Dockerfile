FROM node:alpine
LABEL description="Instant high-performance GraphQL API for your PostgreSQL database https://github.com/graphile/postgraphile"

ENV NODE_ENV=development
ENV NODE_OPTIONS="--no-buffer"

WORKDIR /app

# Install dependencies
RUN npm init -y && \
    npm install postgraphile postgraphile-plugin-connection-filter express cors pg

# Copy server.js instead of creating it inline
COPY server.js .

EXPOSE 5000

CMD ["node", "server.js"]
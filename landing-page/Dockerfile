FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy pre-built dist directory
COPY dist/ ./dist/

EXPOSE 3000

CMD ["npm", "start"] 
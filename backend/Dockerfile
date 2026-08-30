# ---- Backend Dockerfile (Node.js / Express) ----
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source files
COPY server.js ./
COPY migrations.js ./
COPY src/ ./src/

# Expose port
EXPOSE 5000

# Start server
CMD ["node", "server.js"]

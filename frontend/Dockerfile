# ---- Frontend Dockerfile (Next.js) ----

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build the Next.js app
ARG NEXT_PUBLIC_API_URL=http://localhost:5000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

# Stage 2: Production runner
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy built output from builder
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy the Tesseract trained data if needed
COPY --from=builder /app/eng.traineddata ./eng.traineddata

EXPOSE 3000

CMD ["node", "server.js"]

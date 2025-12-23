FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the app (runs vite build + esbuild)
RUN npm run build

# Production image
FROM node:20-bookworm-slim AS runner

ENV NODE_ENV=production

WORKDIR /app

# Copy built files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 8080

# Cloud Run sets PORT=8080
CMD ["node", "dist/index.js"]


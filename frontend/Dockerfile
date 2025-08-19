# Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application
COPY . .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

# Copy necessary files from builder
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Install production dependencies only
RUN npm ci --only=production

# Expose port 3000
EXPOSE 3000

# Set environment variables for runtime
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Start the application
CMD ["node", "server.js"]

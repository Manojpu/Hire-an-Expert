# Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies required for node-gyp
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application
COPY . .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production
ENV NEXT_PUBLIC_API_URL=http://localhost:8000/api
ENV NEXT_PUBLIC_SOCKET_URL=http://localhost:8000

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

# Copy necessary files from builder
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/next.config.js ./
COPY --from=builder --chmod=755 /app/node_modules/.bin ./node_modules/.bin

# Create public directory if it doesn't exist
RUN mkdir -p ./public

# Set production environment
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV PORT 3000

# Expose port 3000
EXPOSE 3000

# Start the application
CMD ["node", "server.js"]

# Set environment variables for runtime
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Start the application
CMD ["node", "server.js"]

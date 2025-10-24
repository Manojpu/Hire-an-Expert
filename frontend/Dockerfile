FROM node:20-alpine as build

# Set working directory
WORKDIR /app

# Copy package files only
COPY package.json ./

# Install dependencies (without lock files to avoid platform issues)
RUN npm install --legacy-peer-deps

# Copy all files
COPY . .

# Accept build arguments for environment variables
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID
ARG VITE_STRIPE_PUBLISHABLE_KEY
ARG VITE_AI_HEALTHCHECK_ENABLED
ARG VITE_API_GATEWAY_URL

# Set environment variables from build args
ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY
ENV VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN
ENV VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID
ENV VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET
ENV VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID
ENV VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID
ENV VITE_STRIPE_PUBLISHABLE_KEY=$VITE_STRIPE_PUBLISHABLE_KEY
ENV VITE_AI_HEALTHCHECK_ENABLED=$VITE_AI_HEALTHCHECK_ENABLED
ENV VITE_API_GATEWAY_URL=$VITE_API_GATEWAY_URL

# Build application
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy the built assets from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 3000 (mapped in docker-compose)
EXPOSE 3000

# Start Nginx server
CMD ["nginx", "-g", "daemon off;"]

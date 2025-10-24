FROM node:20-alpine as build

# Set working directory
WORKDIR /app

# Copy package files only
COPY package.json ./

# Install dependencies (without lock files to avoid platform issues)
RUN npm install --legacy-peer-deps

# Copy all files
COPY . .

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

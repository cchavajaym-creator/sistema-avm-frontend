# ---- Build stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (leverage Docker cache)
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the source and build
COPY . .

# Build Angular app (defaultConfiguration is production per angular.json)
RUN npm run build


# ---- Runtime stage ----
FROM nginx:alpine AS runtime

# Copy custom nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from the builder stage
COPY --from=builder /app/dist/fuse /usr/share/nginx/html

# Expose default NGINX port
EXPOSE 80

# Start NGINX
CMD ["nginx", "-g", "daemon off;"]


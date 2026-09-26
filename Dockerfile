# Multi-stage build for Vite React app
# Stage 1: Build the app
FROM node:22-alpine AS builder

WORKDIR /app

# Accept build arguments for environment variables
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_STRAVA_CLIENT_ID
ARG VITE_STRAVA_CLIENT_SECRET
ARG VITE_APPINSIGHTS_CONNECTION_STRING

# Set as environment variables for the build
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_STRAVA_CLIENT_ID=$VITE_STRAVA_CLIENT_ID
ENV VITE_STRAVA_CLIENT_SECRET=$VITE_STRAVA_CLIENT_SECRET
ENV VITE_APPINSIGHTS_CONNECTION_STRING=$VITE_APPINSIGHTS_CONNECTION_STRING

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built app from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]

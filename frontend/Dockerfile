# Build stage
FROM node:20-alpine as build-stage
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# You should inject VITE_API_URL during the build process
RUN npm run build

# Production stage using Nginx
FROM nginx:alpine
# Copy built static files to Nginx public folder
COPY --from=build-stage /app/dist /usr/share/nginx/html
# Copy custom Nginx configuration if needed (e.g. for React Router fallback)
# COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

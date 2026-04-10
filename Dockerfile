# Stage 1: Build the application
# Updated to Node 20 to satisfy Vite's requirements
FROM node:20-alpine AS build

# Set working directory inside the container
WORKDIR /work

# Copy package files and install dependencies
COPY package*.json ./
COPY . .

# Build the React app
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:stable-alpine

# Copy the build output to Nginx
COPY --from=build /work/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
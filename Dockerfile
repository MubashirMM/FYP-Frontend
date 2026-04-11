# Stage 1: Build the application
# Use 'slim' instead of 'alpine' to avoid compatibility issues with native modules
FROM node:20-slim AS build

WORKDIR /work

COPY package*.json ./

# Optional: sometimes needed for native builds in slim images
# RUN apt-get update && apt-get install -y python3 make g++ 

RUN npm install

COPY . . 

RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:stable-alpine

COPY --from=build /work/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
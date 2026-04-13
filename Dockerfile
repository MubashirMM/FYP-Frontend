# Stage 1: Build
FROM node:20-slim AS build
WORKDIR /work
COPY package*.json ./
RUN npm install
COPY . . 

# --- THE MAGIC LINE ---
# This finds every file in /src and replaces 'localhost:8000' with your desired address
# Even if you forgot an .env file, this forces it to change.
RUN find src -type f -exec sed -i 's/localhost:8000/localhost:8000/g' {} +

RUN npm run build

# Stage 2: Serve
FROM nginx:stable-alpine
COPY --from=build /work/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

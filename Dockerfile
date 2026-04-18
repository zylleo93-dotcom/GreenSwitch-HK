# Build stage
FROM node:20-slim AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Production stage — Node.js serves both API and static files
FROM node:20-slim

WORKDIR /app

# Copy package files and install production deps only
COPY package*.json ./
RUN npm install --omit=dev

# Copy the built frontend from the build stage
COPY --from=build /app/dist ./dist

# Copy the server file
COPY server.js ./

# Hugging Face Spaces runs with UID 1000
USER 1000

# Expose the port Hugging Face Spaces expects
EXPOSE 7860

CMD ["node", "server.js"]

# Stage 1: build the Vite app
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: serve the static build
FROM node:18-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/dist ./dist
CMD ["sh", "-c", "serve -s dist -l tcp://0.0.0.0:${PORT:-4173}"]

# Multi-stage build for the Vite React app.
# Stage 1 builds the static assets; stage 2 serves them with Caddy
# (the existing Caddyfile is already SPA-aware: try_files {path} /index.html).

FROM node:20-alpine AS build
WORKDIR /app
COPY package.json ./
RUN npm install --silent

# Build-time env. The Vite app reads VITE_API_URL at build time, so it must
# be present here. docker-compose passes this as a build-arg.
ARG VITE_API_URL=http://localhost:5007
ENV VITE_API_URL=$VITE_API_URL

COPY . .
RUN npm run build

FROM caddy:2.8-alpine AS runtime
WORKDIR /app
COPY Caddyfile /app/Caddyfile
COPY --from=build /app/dist /app/dist

ENV PORT=3000
EXPOSE 3000
CMD ["caddy", "run", "--config", "/app/Caddyfile", "--adapter", "caddyfile"]

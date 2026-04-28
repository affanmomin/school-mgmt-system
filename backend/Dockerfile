# Multi-stage build for the Node/Express backend.
# Stage 1 installs dependencies; stage 2 ships only what's needed at runtime.

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev --silent

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src
COPY public ./public

# Run as a non-root user (Alpine ships an unprivileged "node" user)
USER node

EXPOSE 5007
CMD ["node", "./src/server.js"]

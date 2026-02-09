# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

RUN apk add --no-cache curl

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

RUN mkdir -p /app/data && chown node:node /app/data

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["node", "dist/index.js"]

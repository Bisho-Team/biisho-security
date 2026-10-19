FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --legacy-peer-deps --fetch-retries=5 --fetch-retry-mintimeout=20000

FROM node:20-alpine AS builder
WORKDIR /app

# NEXT_PUBLIC_* values are inlined into the bundle at build time
ARG NEXT_PUBLIC_API_URL=http://localhost:3001/api
ARG NEXT_PUBLIC_WS_URL=ws://localhost:3002
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL
ENV NEXT_TELEMETRY_DISABLED=1
# next/font fetches Google Fonts at build time; Node's 250ms happy-eyeballs
# connect timeout fails on slow links, so force plain IPv4 connects
ENV NODE_OPTIONS="--no-network-family-autoselection --dns-result-order=ipv4first"

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./

EXPOSE 3000
CMD ["npx", "next", "start", "-p", "3000"]

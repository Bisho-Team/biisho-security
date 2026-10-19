FROM node:18-alpine

WORKDIR /app

# Prisma engines need OpenSSL on Alpine
RUN apk add --no-cache openssl

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN --mount=type=cache,target=/root/.npm \
    --mount=type=cache,target=/root/.cache/prisma \
    npm ci --fetch-retries=5 --fetch-retry-mintimeout=20000

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3001

# Start the application
CMD ["npm", "start"]

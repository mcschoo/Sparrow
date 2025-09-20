# ---- Stage 1: Build ----
FROM node:20-alpine AS builder

WORKDIR /app

# Install deps (cache npm ci layer)
COPY package.json package-lock.json* ./
RUN npm ci

# Copy rest of the source
COPY . .

# Build the Next.js app
RUN npm run build

# ---- Stage 2: Runtime ----
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy only required runtime files
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./next.config.mjs
COPY --from=builder /app/tsconfig.json ./tsconfig.json

EXPOSE 3000

CMD ["npm", "start"]

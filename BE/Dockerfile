# --- Build Stage ---
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production && cp -R node_modules ../prod_node_modules
RUN npm ci

COPY . .
RUN npm run build

# --- Production Stage ---
FROM node:20-alpine AS production

WORKDIR /app

COPY --from=builder /prod_node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

RUN mkdir -p uploads

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "dist/main.js"]

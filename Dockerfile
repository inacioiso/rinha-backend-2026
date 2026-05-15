# ── Estágio 1: compila o TypeScript ───────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ── Estágio 2: pré-processa o dataset ────────────────────────────────────────S
FROM node:22-alpine AS preprocessor

WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts

COPY --from=builder /app/dist ./dist
COPY resources ./resources

RUN node --max-old-space-size=1024 dist/preprocess.js

# ── Estágio 3: runtime ────────────────────────────────────────────────────────
FROM node:22-alpine AS runtime

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

COPY --from=builder /app/dist ./dist

COPY --from=preprocessor /app/resources/references.bin ./resources/references.bin
COPY resources/normalization.json ./resources/normalization.json
COPY resources/mcc_risk.json      ./resources/mcc_risk.json

ENV NODE_ENV=production
ENV PORT=9999
ENV HOST=0.0.0.0

EXPOSE 9999

CMD ["node", "dist/server.js"]
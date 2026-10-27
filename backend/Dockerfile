# syntax=docker/dockerfile:1

FROM node:24-alpine AS deps
RUN apk add --no-cache python3 make g++ openssl libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY prisma ./prisma
RUN npx prisma generate

FROM deps AS build
COPY tsconfig.json tsconfig.build.json nest-cli.json prisma7.config.ts ./
COPY src ./src
RUN npm run build

FROM node:24-alpine AS runtime
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
# prisma/seed.ts importa el cliente generado desde src/generated
COPY --from=build /app/src/generated ./src/generated
COPY --from=build /app/prisma7.config.ts ./
COPY --from=build /app/package.json ./
EXPOSE 3001
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]

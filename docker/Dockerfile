FROM node:22-alpine AS build
WORKDIR /app
# `npm install` instead of `npm ci`: the installed npm (11.5.2) produces a
# lockfile its own `npm ci` then rejects as out-of-sync for this dependency
# tree (a known arborist bug) — `npm install` resolves the same tree without
# tripping that check.
COPY package*.json ./
COPY prisma ./prisma
RUN npm install --legacy-peer-deps
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S app && adduser -S app -G app
COPY package*.json ./
# Kept for ops convenience (e.g. `docker run <image> npx prisma migrate deploy`);
# NOT used to regenerate the client here — the compiled client already ships
# inside dist/ from the build stage, and regenerating would need prisma7.config.ts
# and dotenv, which this minimal runtime stage deliberately doesn't carry.
COPY prisma ./prisma
RUN npm install --legacy-peer-deps --omit=dev
COPY --from=build /app/dist ./dist
USER app
EXPOSE 3000
CMD ["node", "dist/main.js"]

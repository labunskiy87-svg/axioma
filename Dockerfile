FROM node:24-alpine AS dependencies
WORKDIR /app
RUN npm install --global pnpm@11.19.0
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod
FROM node:24-alpine
ENV NODE_ENV=production HOST=0.0.0.0
WORKDIR /app
USER root
RUN apk add --no-cache font-dejavu
COPY --from=dependencies /app/node_modules ./node_modules
COPY package.json ./
COPY server ./server
RUN mkdir /app/storage && chown node:node /app/storage
USER node
EXPOSE 3001
CMD ["node", "server/start.mjs"]

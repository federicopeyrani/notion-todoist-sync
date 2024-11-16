FROM oven/bun:1.1.34 AS build

WORKDIR /app

COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile --production

COPY src src/
COPY .env ./

RUN bun build src/index.ts --outdir dist

FROM oven/bun:1.1.34 AS runtime

WORKDIR /app

COPY .env ./
COPY --from=build /app/dist ./

CMD ["bun", "index.js"]
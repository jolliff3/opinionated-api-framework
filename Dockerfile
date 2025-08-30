FROM docker.io/library/node:22-alpine AS builder

WORKDIR /usr/src

COPY package.json package-lock.json  ./

RUN npm ci --include=dev --ignore-scripts

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

RUN npm ci --omit=dev --ignore-scripts && \
    mkdir -p /usr/src/node_modules_prod && \
    cp -R node_modules /usr/src/node_modules_prod

FROM gcr.io/distroless/nodejs22-debian12:latest

WORKDIR /app

COPY --from=builder /usr/src/dist /app
COPY --from=builder /usr/src/node_modules_prod/node_modules /app/node_modules
COPY --from=builder /usr/src/package.json /app/

USER nonroot

ENTRYPOINT [ "/nodejs/bin/node" ]
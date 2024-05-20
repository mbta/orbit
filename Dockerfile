### Elixir Deps
FROM hexpm/elixir:1.16.1-erlang-26.2.1-alpine-3.18.4 AS elixir-deps

# needed to retrieve mix dependencies
RUN apk add --no-cache git

ENV PORT=4000 MIX_ENV=prod LANG="C.UTF-8"

COPY ./mix.exs /app/mix.exs
COPY ./mix.lock /app/mix.lock
WORKDIR /app
RUN mix local.hex --force
RUN mix local.rebar --force
RUN mix deps.get --only-prod
RUN mix deps.compile


### Node Deps and Build Frontend
FROM node:20.13.1-alpine3.19 AS node

# npm deps
ENV NODE_ENV=production
COPY ./package.json /app/package.json
COPY ./package-lock.json /app/package-lock.json
WORKDIR /app
RUN npm ci

# build frontend
COPY --from=elixir-deps /app/deps /app/deps
COPY ./tailwind.config.js /app/tailwind.config.js
COPY ./js /app/js
COPY ./css /app/css
COPY ./lib/orbit_web /app/lib/orbit_web
WORKDIR /app
# TODO make esbuild emit sourcemaps
RUN npm run build:js -- --minify
RUN npm run build:css -- --minify


### Build Backend
FROM elixir-deps AS elixir

COPY ./priv/static /app/priv/static
COPY --from=node /app/priv/static/assets /app/priv/static/assets
COPY ./priv/repo/migrations /app/priv/repo/migrations
COPY ./config /app/config
COPY ./lib /app/lib
WORKDIR /app
RUN mix compile
RUN mix phx.digest
RUN mix release --path /app-release


### Production Stage
# Run in minimal Alpine container
FROM alpine:3.19.1 AS runtime

# HTTP port
EXPOSE 4000

# Erlang depends on these
RUN apk add --no-cache ncurses-libs libstdc++ libgcc

# Fetch Amazon RDS certificate chain
RUN wget -O /usr/local/share/amazon-certs.pem https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem
RUN chmod a=r /usr/local/share/amazon-certs.pem

# Run as unprivileged user in production
RUN addgroup -S orbit && adduser -S -G orbit orbit
USER orbit
WORKDIR /home/orbit

# Run properly in production
ENV PORT=4000 MIX_ENV=prod TERM=xterm LANG="C.UTF-8"
COPY --from=elixir --chown=orbit:orbit /app-release .
CMD ["bin/orbit", "start"]

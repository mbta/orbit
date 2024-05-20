### Build Stage
FROM hexpm/elixir:1.16.1-erlang-26.2.1-alpine-3.18.4 AS build

# needed to retrieve mix dependencies
RUN apk add --no-cache git

ENV PORT=4000 MIX_ENV=prod LANG="C.UTF-8"

# Install elixir dependencies
COPY ./mix.exs /app/mix.exs
COPY ./mix.lock /app/mix.lock
WORKDIR /app
RUN mix local.hex --force
RUN mix local.rebar --force
RUN mix deps.get --only-prod
RUN mix deps.compile

# Build
COPY ./priv/repo/migrations /app/priv/repo/migrations
COPY ./config /app/config
COPY ./lib /app/lib
COPY ./js /app/js
COPY ./css /app/css
WORKDIR /app
RUN mix compile
# mix assets.deploy is an alias for tailwind, esbuild, and mix phx.digest
RUN mix assets.deploy
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
COPY --from=build --chown=orbit:orbit /app-release .
CMD ["bin/orbit", "start"]

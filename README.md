# Orbit 🪐

[Glides](https://github.com/mbta/glides) for Heavy Rail

## Pre-reqs

- Homebrew ([installation directions](https://brew.sh/))
- Postgres: `brew install postgresql`
  - Brew may ask you to upgrade your database upon installation: `brew postgresql-upgrade-database`
  - Start Postgres with `brew services start postgresql`
  - If this is the first time you've used it, you may need to create a database. Run `createdb`
- asdf: `brew install asdf`
- `asdf install`
  - You may need to run `asdf plugin add` some of `erlang`, `elixir`, or `nodejs` first.

## Set up

- `asdf install`
- `mix setup`

Run the server with `mix phx.server`.

Now you can visit [`localhost:4001`](http://localhost:4001) from your browser.

## Docker

To run the Docker container locally, run `docker compose up --build`.
Find what port the server is using with `docker compose ps`,
and then visit `localhost:<port>`.

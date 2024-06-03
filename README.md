# Orbit 🪐

[Glides](https://github.com/mbta/glides) for Heavy Rail

## Pre-reqs

- Homebrew ([installation directions](https://brew.sh/))
- Postgres: `brew install postgresql`
  - Brew may ask you to upgrade your database upon installation: `brew postgresql-upgrade-database`
  - Start Postgres with `brew services start postgresql`
  - If this is the first time you've used it, you may need to create a database. Run `createdb`
- `mise` or `asdf`:
  - `mise`:
    - `curl https://mise.run | sh` or `brew install mise`
    - `mise install`
  - `asdf`:
    - `brew install asdf`
    - You may need to run `asdf plugin add` some of `erlang`, `elixir`, or `nodejs`.
    - `asdf install`

## Set up

- `bin/setup` (rerun after any dependencies are updated)

Run the server with `mix phx.server`.

Now you can visit [`localhost:4000`](http://localhost:4000) from your browser.

## Tests

Run `bin/test` to run all backend and frontend test suites.

Run `mix test test/path/to/file_test.exs` or `npm run test:jest -- js/path/to/file.test.ts` to run a specific unit test.

See [`bin/test`](bin/test), [`mix.exs`](mix.exs), and [`package.json`](package.json) for other test commands.

## Docker

To run the Docker container locally, run `docker compose up --build`.
Find what port the server is using with `docker compose ps`,
and then visit `localhost:<port>`.

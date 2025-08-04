# Orbit 🪐

[Glides](https://github.com/mbta/glides) for Heavy Rail

## Pre-reqs

- Homebrew ([installation directions](https://brew.sh/))
- Postgres: `brew install postgresql`
  - Brew may ask you to upgrade your database upon installation: `brew postgresql-upgrade-database`
  - Start Postgres with `brew services start postgresql`
  - If this is the first time you've used it, you may need to create a database. Run `createdb`
  - You may also need a `postgres` role: `createuser -s postgres`
- `mise` or `asdf`:
  - `mise`:
    - `curl https://mise.run | sh` or `brew install mise`
    - `mise install`
  - `asdf`:
    - `brew install asdf`
    - You may need to run `asdf plugin add` some of `erlang`, `elixir`, or `nodejs`.
    - `asdf install`
- For full functionality:
  - Also follow the steps in the "Receiving messages from OCS" section below.
  - Look inside `dev.secret.example.exs` for additional examples that can be configured inside
    `dev.secret.exs`, such as for tools like Fullstory and Sentry.

## Set up

- `bin/setup` (rerun after any dependencies are updated)

Run the server with `mix phx.server`.

Now you can visit [`localhost:4001`](http://localhost:4001) from your browser.

## Tests

Run `bin/test` to run all backend and frontend test suites.

Run `mix test test/path/to/file_test.exs` or `npm run test:jest -- js/path/to/file.test.ts` to run a specific unit test.

See [`bin/test`](bin/test), [`mix.exs`](mix.exs), and [`package.json`](package.json) for other test commands.

To see code coverage, run `mix test --cover` or `npm run test:jest -- --coverage`. These generate `lcov.info` files which can be viewed with tools like the VSCode extension "Coverage Gutters".

## Docker

To run the Docker container locally, run `docker compose up --build`.
Find what port the server is using with `docker compose ps`,
and then visit `localhost:<port>`.

## Receiving messages from OCS

In order to know about schedule changes, Orbit streams messages from OCS via AWS Kinesis, using the BroadwayKinesis library. We must provide the Kinesis stream name and consumer ARN. In production, these values are set from environment variables. By default, streaming is disabled for all other build types.

To enable streaming for local builds, there are two required steps, as follows. Note that currently, OCS streaming is not supported when running the local Docker container.

### (1) Configure AWS keys

BroadwayKinesis uses ExAws configuration that requires AWS access keys. These keys are automatically provided in production, but must be configured locally.
To configure your keys via AWS CLI and 1Password (recommended), do the following:

1. Follow the [setup instructions](https://www.notion.so/mbta-downtown-crossing/Loading-Secrets-from-1Password-into-Applications-101aa4debcb24372bdc3835918404c93) to configure AWS CLI with credentials stored in 1Password
2. Add "AWS Access Keys" config to your `dev.secret.exs` for this project (Can be copied/uncommented from `dev.secret.example.exs`).

Now local dev builds will load your credentials via AWS CLI.

**Note:** AWS keys should never be checked into source control.

## (2) Specify kinesis stream config

1. In `dev.secret.exs` include `Orbit.Ocs.Stream.Producer` config settings. (Can be copied/uncommented from `dev.secret.example.exs`).
2. Set `enabled?` to true
3. Provide real values for the `kinesis_stream` and `kinesis_consumer_arn` fields.
   - For local development, you want the `ctd-ocs-raw-messages` stream and its attached "orbit-local" consumer. (You view these via AWS console/CLI. Request help from the team if you cannot find them.)
   - **Note:** The real value of `kinesis_consumer_arn` is considered sensitive, and should not be included in any file tracked by source control.
   - **Note:** While there is also a `ctd-ocs-raw-messages-dev` stream, it is used for specific debugging scenarios and may not be active. Generally you want the non-dev stream, which provides actual live OCS data.

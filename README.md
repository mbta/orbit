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

## Additional pre-reqs for local dev

To run locally, you must configure some settings in `dev.secret.exs`. If you have not yet created a `dev.secret.exs` file for this project, copy the `dev.secret.example.exs` file as a starting point. Then edit/uncomment sections in the file to do the following:

- Configure AWS credentials for running locally. Recommended way:
  - Follow the [setup instructions](https://www.notion.so/mbta-downtown-crossing/Loading-Secrets-from-1Password-into-Applications-101aa4debcb24372bdc3835918404c93) to configure AWS CLI with credentials stored in 1Password
  - Uncomment the "AWS Access Keys" config from `dev.secret.example.exs`. Now local dev builds will load your credentials via AWS CLI.

- If you wish for your local build to receive OCS messages, see the "Receiving messages from OCS" section below.

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

In order to know about schedule changes, Orbit streams messages from OCS via AWS Kinesis, using the BroadwayKinesis library. The library requires that the `kinesis_stream` and `kinesis_consumer_arn` config values be known at compile-time. In production, these values should be set from environment variables. By default, streaming is disabled for all other build types.

To enable streaming for local builds, in `dev.secret.exs`:

- Set `enable_ocs_stream_consumer?` to true
- Copy/uncomment the `Orbit.Ocs.Stream.Producer` config settings from `dev.secret.example.exs`
- Provide real values for the `kinesis_stream` and `kinesis_consumer_arn` fields
  - (Note: The real value of `kinesis_consumer_arn` is considered sensitive, and should not be included in any file tracked by source control.)

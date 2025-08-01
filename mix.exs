defmodule Orbit.MixProject do
  use Mix.Project

  def project do
    [
      app: :orbit,
      version: "0.1.0",
      elixir: "~> 1.16",
      elixirc_paths: elixirc_paths(Mix.env()),
      start_permanent: Mix.env() == :prod,
      aliases: aliases(),
      preferred_cli_env: [
        test_all: :test
      ],
      deps: deps(),
      dialzyer: [
        plt_add_apps: [:mix]
      ],
      test_coverage: [tool: LcovEx]
    ]
  end

  # Configuration for the OTP application.
  #
  # Type `mix help compile.app` for more information.
  def application do
    [
      mod: {Orbit.Application, []},
      extra_applications: [:logger, :runtime_tools]
    ]
  end

  # Specifies which paths to compile per environment.
  defp elixirc_paths(:test), do: ["lib", "test/support"]
  defp elixirc_paths(_), do: ["lib"]

  # Specifies your project dependencies.
  #
  # Type `mix help deps` for examples and options.
  defp deps do
    [
      {:bandit, "== 1.7.0"},
      {:broadway_kinesis, github: "mbta/broadway_kinesis"},
      # used by ex_aws to parse AWS CLI settings/credentials
      {:configparser_ex, "== 4.0.0", only: :dev},
      {:credo, "== 1.7.12", only: [:dev, :test], runtime: false},
      {:csv, "== 3.2.2"},
      {:dialyxir, "== 1.4.5", only: [:dev, :test], runtime: false},
      {:diskusage_logger, "== 0.2.0", only: :prod},
      {:ehmon, github: "mbta/ehmon", only: :prod},
      {:ecto_sql, "== 3.13.2"},
      {:ex_aws, "== 2.5.9"},
      {:ex_aws_rds, "== 2.0.2"},
      {:ex_aws_s3, "== 2.5.7"},
      {:ex_machina, "== 2.8.0", only: :test},
      {:fast_local_datetime, "== 1.0.1"},
      {:floki, "== 0.38.0", only: :test},
      {:geocalc, "== 0.8.5"},
      {:guardian, "== 2.3.2"},
      {:guardian_phoenix, "== 2.0.1"},
      # used by ex_aws
      {:hackney, "== 1.25.0"},
      {:heroicons,
       github: "tailwindlabs/heroicons",
       tag: "v2.2.0",
       sparse: "optimized",
       app: false,
       compile: false,
       depth: 1},
      {:httpoison, "== 2.2.3"},
      {:jason, "== 1.4.4"},
      {:lcov_ex, "== 0.3.4", only: [:test], runtime: false},
      {:logster, "== 2.0.0-rc.5"},
      {:mock, "== 0.3.9", only: :test},
      {:oban, "== 2.19.4"},
      {:phoenix, "== 1.7.21"},
      {:phoenix_ecto, "== 4.6.3"},
      {:phoenix_html, "== 4.2.1"},
      {:phoenix_live_dashboard, "== 0.8.7"},
      {:phoenix_live_reload, "== 1.6.0", only: :dev},
      {:phoenix_live_view, "== 1.1.2"},
      {:postgrex, "== 0.20.0"},
      {:sentry, "== 10.10.0"},
      {:sobelow, "== 0.14.0", only: [:dev, :test], runtime: false},
      {:telemetry_metrics, "== 1.1.0"},
      {:telemetry_poller, "== 1.2.0"},
      {:timex, "== 3.7.11"},
      {:tz, "== 0.28.1"},
      {:ueberauth, "== 0.10.8"},
      {:ueberauth_oidcc, "== 0.4.1"}
    ]
  end

  # Aliases are shortcuts or tasks specific to the current project.
  # For example, to install project dependencies and perform other setup tasks, run:
  #
  #     $ mix setup
  #
  # See the documentation for `Mix` for more info on aliases.
  defp aliases do
    [
      "ecto.setup": [
        "ecto.create",
        "ecto.migrate",
        # only run seeds.exs in dev,
        if Mix.env() == :dev do
          "run priv/repo/seeds.exs"
        else
          # noop
          fn _args -> :ok end
        end
      ],
      "ecto.reset": [
        "ecto.drop",
        "ecto.setup"
      ],
      test: [
        "ecto.create --quiet",
        "ecto.migrate --quiet",
        "test"
      ],
      sobelow: ["sobelow --config"],
      # Must be separate from `test` so that you can pass args to `test`,
      # and only run `test` on those files and not `credo` on all files.
      # runs in MIX_ENV=test because of preferred_cli_env above
      test_all: [
        "test",
        "credo",
        "format --check-formatted",
        "sobelow"
        # dialyzer for some reason has to be in MIX_ENV=dev, so run it separately.
      ]
    ]
  end
end

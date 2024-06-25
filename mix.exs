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
      ]
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
      {:bandit, "== 1.2.0"},
      {:credo, "== 1.7.5", only: [:dev, :test], runtime: false},
      {:dialyxir, "== 1.4.3", only: [:dev, :test], runtime: false},
      {:diskusage_logger, "== 0.2.0", only: :prod},
      {:ehmon, github: "mbta/ehmon", only: :prod},
      {:ecto_sql, "== 3.11.3"},
      {:ex_aws, "== 2.5.1"},
      {:ex_aws_rds, "== 2.0.2"},
      {:floki, ">= 0.30.0", only: :test},
      # used by ex_aws
      {:hackney, "== 1.20.1"},
      {:heroicons,
       github: "tailwindlabs/heroicons",
       tag: "v2.1.1",
       sparse: "optimized",
       app: false,
       compile: false,
       depth: 1},
      {:jason, "== 1.4.1"},
      {:logster, "== 2.0.0-rc.3"},
      {:oban, "== 2.17.10"},
      {:phoenix, "== 1.7.11"},
      {:phoenix_ecto, "== 4.6.1"},
      {:phoenix_html, "== 4.1.1"},
      {:phoenix_live_dashboard, "== 0.8.3"},
      {:phoenix_live_reload, "== 1.4.1", only: :dev},
      {:phoenix_live_view, "== 0.20.9"},
      {:postgrex, ">= 0.0.0"},
      {:sentry, "== 10.6.1"},
      {:sobelow, "== 0.13.0", only: [:dev, :test], runtime: false},
      {:telemetry_metrics, "== 1.0.0"},
      {:telemetry_poller, "== 1.1.0"},
      {:tz, "== 0.26.5"}
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

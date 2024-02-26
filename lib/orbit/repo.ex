defmodule Orbit.Repo do
  use Ecto.Repo,
    otp_app: :orbit,
    adapter: Ecto.Adapters.Postgres

  @doc """
  called before each database connection to add RDS IAM auth
  as configured by runtime.exs Orbit.Repo :configure
  """
  @spec add_prod_credentials(Keyword.t()) :: Keyword.t()
  def add_prod_credentials(config, auth_token_fn \\ &ExAws.RDS.generate_db_auth_token/4) do
    hostname = Keyword.fetch!(config, :hostname)
    username = Keyword.fetch!(config, :username)
    port = Keyword.get(config, :port, 5432)

    token =
      auth_token_fn.(
        hostname,
        username,
        port,
        %{}
      )

    Keyword.merge(config,
      password: token
    )
  end
end

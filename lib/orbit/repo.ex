defmodule Orbit.Repo do
  use Ecto.Repo,
    otp_app: :orbit,
    adapter: Ecto.Adapters.Postgres
end

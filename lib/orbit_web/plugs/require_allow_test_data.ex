defmodule OrbitWeb.Plugs.RequireAllowTestData do
  @behaviour Plug

  @impl Plug
  def init(opts), do: opts

  @impl Plug
  def call(conn, _opts) do
    if Application.get_env(:orbit, :allow_test_data?, false) do
      conn
    else
      conn
      |> Plug.Conn.put_status(:method_not_allowed)
      |> Phoenix.Controller.text("Not Allowed")
      |> Plug.Conn.halt()
    end
  end
end

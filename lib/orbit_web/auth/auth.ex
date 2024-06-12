defmodule OrbitWeb.Auth.Auth do
  alias Plug.Conn
  alias Orbit.Authentication.User
  alias Orbit.Repo

  @spec login(Conn.t(), String.t(), integer(), String.t() | nil, [String.t()], String.t() | nil) ::
          Conn.t()
  def login(conn, username, ttl_seconds, _refresh_token, _groups, logout_url) do
    email = String.downcase(username)

    Repo.transaction(fn ->
      user =
        case Repo.get_by(User, email: email) do
          nil ->
            Repo.insert!(%User{email: email})

          u ->
            u
        end

      user
    end)

    conn
    |> OrbitWeb.Auth.Guardian.Plug.sign_in(
      username,
      # claims
      %{},
      ttl: {ttl_seconds, :seconds}
    )
    |> Plug.Conn.put_session(:username, username)
    |> Plug.Conn.put_session(:logout_url, logout_url)
  end

  @spec logged_in_user(Conn.t()) :: map() | nil
  def logged_in_user(conn) do
    if Map.has_key?(conn.assigns, :logged_in_user) do
      conn.assigns[:logged_in_user]
    else
      if email = OrbitWeb.Auth.Guardian.Plug.current_resource(conn) do
        email = String.downcase(email)
        Repo.get_by(User, email: email)
      else
        nil
      end
    end
  end

  @spec logout(Conn.t()) :: Conn.t()
  def logout(conn) do
    conn
    |> Plug.Conn.assign(:logged_in_user, nil)
    |> OrbitWeb.Auth.Guardian.Plug.sign_out()
  end
end

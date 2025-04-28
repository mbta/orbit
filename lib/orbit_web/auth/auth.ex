defmodule OrbitWeb.Auth.Auth do
  alias Orbit.Authentication.User
  alias Orbit.Repo
  alias Phoenix.Socket
  alias Plug.Conn

  @spec login(Conn.t(), String.t(), integer(), [String.t()], String.t() | nil) ::
          Conn.t()
  def login(conn, username, ttl_seconds, groups, logout_url) do
    email = String.downcase(username)

    user =
      case Repo.get_by(User, email: email) do
        nil -> Repo.insert!(%User{email: email})
        u -> u
      end

    # We use a user struct as the Guardian resource
    conn
    |> OrbitWeb.Auth.Guardian.Plug.sign_in(
      user,
      # claims
      %{groups: groups},
      ttl: {ttl_seconds, :seconds}
    )
    |> Plug.Conn.put_session(:username, username)
    |> Plug.Conn.put_session(:logout_url, logout_url)
  end

  @spec logged_in_user(Conn.t()) :: User.t() | nil
  def logged_in_user(conn) do
    if Map.has_key?(conn.assigns, :logged_in_user) do
      conn.assigns[:logged_in_user]
    else
      OrbitWeb.Auth.Guardian.Plug.current_resource(conn)
    end
  end

  @spec logout(Conn.t()) :: Conn.t()
  def logout(conn) do
    conn
    |> Plug.Conn.assign(:logged_in_user, nil)
    |> OrbitWeb.Auth.Guardian.Plug.sign_out()
  end

  @spec socket_token_valid?(Socket.t()) :: boolean()
  def socket_token_valid?(socket) do
    token = Guardian.Phoenix.Socket.current_token(socket)

    case OrbitWeb.Auth.Guardian.decode_and_verify(token) do
      {:ok, _} ->
        true

      {:error, _} ->
        false
    end
  end
end

defmodule OrbitWeb.Auth.Guardian do
  use Guardian, otp_app: :orbit
  alias Orbit.Authentication.User
  alias Orbit.Repo

  @spec subject_for_token(Guardian.Token.resource(), Guardian.Token.claims()) ::
          {:ok, String.t()} | {:error, atom()}
  def subject_for_token(%User{email: email}, _claims) do
    {:ok, email}
  end

  @spec resource_from_claims(Guardian.Token.claims()) ::
          {:ok, Guardian.Token.resource()} | {:error, atom()}
  def resource_from_claims(%{"sub" => id}) do
    case Repo.get_by(User, email: id) do
      nil -> {:error, :user_not_found}
      user -> {:ok, user}
    end
  end
end

defmodule OrbitWeb.Auth.Guardian.Pipeline do
  use Guardian.Plug.Pipeline,
    otp_app: :orbit,
    error_handler: OrbitWeb.Auth.Guardian.ErrorHandler,
    module: OrbitWeb.Auth.Guardian

  plug(Guardian.Plug.VerifySession, claims: %{"typ" => "access"})
  plug(Guardian.Plug.VerifyHeader, claims: %{"typ" => "access"})
  plug(Guardian.Plug.LoadResource, allow_blank: true)
end

defmodule OrbitWeb.Auth.Guardian.ErrorHandler do
  @behaviour Guardian.Plug.ErrorHandler

  @impl Guardian.Plug.ErrorHandler
  def auth_error(conn, {_type, _reason}, _opts) do
    conn
    |> Plug.Conn.put_session(:login_target, conn.request_path)
    # remove the invalid Guardian session so we don't get caught in a redirect loop
    |> OrbitWeb.Auth.Auth.logout()
    |> OrbitWeb.AuthController.redirect_needs_login()
  end
end

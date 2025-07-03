defmodule OrbitWeb.UserSocket do
  @moduledoc """
  Will always allow connection, even if user is unauthenticated or out of date,
  So that we can tell the client what the issue is and they can handle it (by refreshing).

  If we refuse unauthenticated connections, then the client can't tell the difference between
  an auth problem where they should log in again, and a network problem where they should reconnect.
  Phoenix has a way to reply with a connection error, and it reaches the browser, but not in a
  way that's visible to the frontend application code.

  After connection, clients should connect to the `metadata` channel to learn whether they were
  authenticated or not.

  All other channels should remember to check the release version and
  authentication/authorization before allowing a client to join the channel.
  """

  use Phoenix.Socket
  require Logger

  channel "metadata", OrbitWeb.MetadataChannel
  channel "vehicles", OrbitWeb.TrainLocationsChannel

  @doc """
  fields that are added to socket.assigns
  """
  @type metadata :: %{
          server_release: String.t(),
          client_release: String.t() | nil,
          release_matches: boolean(),
          authenticated: boolean(),
          user_id: integer() | nil,
          email: String.t() | nil,
          authentication_error: :no_token | :invalid_token | nil
        }

  @impl true
  def connect(params, socket, _connect_info) do
    server_release = Application.fetch_env!(:orbit, :release)
    client_release = params["release"]

    {socket, user, authentication_error} =
      case Guardian.Phoenix.Socket.authenticate(socket, OrbitWeb.Auth.Guardian, params["token"]) do
        {:error, :no_token} ->
          {socket, nil, :no_token}

        {:error, _e} ->
          {socket, nil, :invalid_token}

        {:ok, authed_socket} ->
          user = Guardian.Phoenix.Socket.current_resource(authed_socket)
          {authed_socket, user, nil}
      end

    metadata = %{
      server_release: server_release,
      client_release: client_release,
      release_matches: client_release == server_release,
      authenticated: user != nil,
      user_id: user && user.id,
      email: user && user.email,
      authentication_error: authentication_error
    }

    metadata_log = Enum.map_join(metadata, " ", fn {key, val} -> "#{key}=#{val}" end)
    Logger.info("user_socket connected #{metadata_log}")

    {:ok, assign(socket, metadata)}
  end

  # Socket IDs are topics that allow you to identify all sockets for a given user:
  #
  #     def id(socket), do: "user_socket:#{socket.assigns.user_id}"
  #
  # Would allow you to broadcast a "disconnect" event and terminate
  # all active sockets and channels for a given user:
  #
  #     Elixir.OrbitWeb.Endpoint.broadcast("user_socket:#{user.id}", "disconnect", %{})
  #
  # Returning `nil` makes this socket anonymous.
  @impl true
  def id(socket) do
    case socket.assigns.user_id do
      nil ->
        nil

      id ->
        "user_socket:#{id}"
    end
  end
end

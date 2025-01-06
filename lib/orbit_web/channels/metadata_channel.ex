defmodule OrbitWeb.MetadataChannel do
  @moduledoc """
  Data that should be returned when connecting to user_socket.ex,
  except that you phoenix can't reply to a socket connection, so instead
  clients should join this channel after connecting.
  """
  use OrbitWeb, :channel

  @impl true
  def join("metadata", _payload, socket) do
    reply = %{
      server_release: socket.assigns.server_release,
      authenticated: socket.assigns.authenticated
    }

    {:ok, reply, socket}
  end
end

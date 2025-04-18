defmodule OrbitWeb.TrainLocationsChannel do
  use OrbitWeb, :channel
  alias OrbitWeb.Auth.Auth

  @impl true
  def join("train_locations", _payload, socket) do
    current_positions = Realtime.PollingServer.subscribe(self(), :vehicle_positions)
    {:ok, %{data: JSON.encode!(current_positions)}, socket}
  end

  @impl true
  def handle_info({:new_data, entity_type, data}, socket) do
    if Auth.socket_token_valid?(socket) do
      push(socket, Atom.to_string(entity_type), %{data: JSON.encode!(data)})
      {:noreply, socket}
    else
      push(socket, "auth_expired", %{})
      {:stop, :normal, socket}
    end
  end
end

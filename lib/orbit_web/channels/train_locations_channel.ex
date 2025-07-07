defmodule OrbitWeb.TrainLocationsChannel do
  use OrbitWeb, :channel
  alias OrbitWeb.Auth.Auth

  @impl true
  def join("vehicles", _payload, socket) do
    current_vehicles = Realtime.TripMatcherServer.subscribe(self())
    {:ok, %{data: current_vehicles}, socket}
  end

  @impl true
  def handle_info({:new_data, entity_type, data}, socket) do
    if Auth.socket_token_valid?(socket) do
      push(socket, Atom.to_string(entity_type), %{data: data})
      {:noreply, socket}
    else
      push(socket, "auth_expired", %{})
      {:stop, :normal, socket}
    end
  end
end

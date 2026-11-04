defmodule OrbitWeb.TrainLocationsChannel do
  use OrbitWeb, :channel
  alias OrbitWeb.Auth.Auth

  @impl true
  def join("vehicles", %{"line" => line}, socket) do
    case Realtime.Data.route_id_from_string(line) do
      nil ->
        {:error, %{reason: "invalid_line"}}

      route_id ->
        current_vehicles = Realtime.TripMatcherServer.subscribe(self(), route_id)
        {:ok, %{data: current_vehicles}, socket}
    end
  end

  def join("vehicles", _payload, _socket), do: {:error, %{reason: "missing_line"}}

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

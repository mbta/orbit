defmodule Realtime.RTR do
  @moduledoc """
  for parsing data out of RTR's json feeds
  """

  alias Realtime.Data.VehiclePosition
  alias Realtime.PollingServer

  def parse_data(filedata) do
    json = Jason.decode!(filedata)

    %{
      timestamp: json["header"]["timestamp"],
      entities: json["entity"]
    }
  end

  @spec parse_vehicle_positions(String.t()) ::
          PollingServer.realtime_info(VehiclePosition.t()) | nil
  def parse_vehicle_positions(""), do: nil

  def parse_vehicle_positions(filedata) do
    json = Jason.decode!(filedata)

    %{
      timestamp: json["header"]["timestamp"],
      entities:
        json["entity"]
        |> Enum.map(&parse_vehicle_position/1)
        |> Enum.filter(fn vp -> vp.route_id != nil end)
    }
  end

  @spec parse_vehicle_position(map()) :: VehiclePosition.t()
  def parse_vehicle_position(entity_json) do
    vehicle = entity_json["vehicle"]

    %VehiclePosition{
      route_id: Realtime.Data.route_id_from_string(vehicle["trip"]["route_id"]),
      direction: vehicle["trip"]["direction_id"],
      label: vehicle["vehicle"]["label"],
      position: parse_position(vehicle["position"]),
      heading: vehicle["position"]["bearing"],
      station_id: Realtime.Data.Stations.platforms_to_stations()[vehicle["stop_id"]],
      current_status: parse_current_status(vehicle["current_status"]),
      timestamp: DateTime.from_unix!(vehicle["timestamp"]),
      vehicle_id: vehicle["vehicle"]["id"],
      # attached later
      trip: nil
    }
  end

  @spec parse_position(map() | nil) :: Util.Position.t() | nil
  defp parse_position(%{"latitude" => latitude, "logitude" => longitude}) do
    %Util.Position{latitude: latitude, longitude: longitude}
  end

  defp parse_position(_), do: nil

  @spec parse_current_status(String.t()) :: :INCOMING_AT | :STOPPED_AT | :IN_TRANSIT_TO
  defp parse_current_status("INCOMING_AT"), do: :INCOMING_AT
  defp parse_current_status("STOPPED_AT"), do: :STOPPED_AT
  defp parse_current_status("IN_TRANSIT_TO"), do: :IN_TRANSIT_TO
end

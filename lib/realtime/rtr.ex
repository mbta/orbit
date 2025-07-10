defmodule Realtime.RTR do
  @moduledoc """
  for parsing data out of RTR's json feeds
  """

  alias Realtime.Data.TripUpdate
  alias Realtime.Data.VehiclePosition
  alias Realtime.PollingServer

  # Parse VehiclePositions from the enhanced json file. Special cased for empty files.
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
        |> Enum.filter(fn vp -> vp.route_id != nil && vp.label != nil end)
    }
  end

  @spec parse_vehicle_position(map()) :: VehiclePosition.t()
  def parse_vehicle_position(entity_json) do
    vehicle = entity_json["vehicle"]
    route_id = Realtime.Data.route_id_from_string(vehicle["trip"]["route_id"])

    %VehiclePosition{
      route_id: route_id,
      direction: vehicle["trip"]["direction_id"],
      label:
        if route_id == :Red do
          String.replace_prefix(vehicle["vehicle"]["label"], "15", "25")
        else
          vehicle["vehicle"]["label"]
        end,
      cars:
        if route_id == :Red do
          Enum.map(parse_cars(vehicle["multi_carriage_details"]), fn car ->
            String.replace_prefix(car, "15", "25")
          end)
        else
          parse_cars(vehicle["multi_carriage_details"])
        end,
      position: parse_position(vehicle["position"]),
      heading: vehicle["position"]["bearing"],
      station_id: Realtime.Data.Stations.platforms_to_stations()[vehicle["stop_id"]],
      stop_id: vehicle["stop_id"],
      current_status: parse_current_status(vehicle["current_status"]),
      timestamp: DateTime.from_unix!(vehicle["timestamp"]),
      vehicle_id: vehicle["vehicle"]["id"],
      trip_id: vehicle["trip"]["trip_id"]
    }
  end

  # Parse TripUpdates from the enhanced json file. Special cased for empty files.
  @spec parse_trip_updates(String.t()) :: PollingServer.realtime_info(TripUpdate.t()) | nil
  def parse_trip_updates(""), do: nil

  def parse_trip_updates(filedata) do
    json = Jason.decode!(filedata)

    %{
      timestamp: json["header"]["timestamp"],
      entities:
        json["entity"]
        |> Enum.map(&parse_trip_update/1)
        |> Enum.filter(fn tu -> tu.route_id != nil end)
    }
  end

  @spec parse_trip_update(map()) :: TripUpdate.t()
  def parse_trip_update(entity_json) do
    trip_update = entity_json["trip_update"]

    %TripUpdate{
      label: trip_update["vehicle"]["label"],
      route_id: Realtime.Data.route_id_from_string(trip_update["trip"]["route_id"]),
      direction: trip_update["trip"]["direction_id"],
      route_pattern_id: trip_update["trip"]["route_pattern_id"],
      trip_id: trip_update["trip"]["trip_id"],
      vehicle_id: trip_update["vehicle"]["id"],
      timestamp: trip_update["timestamp"],
      stop_time_updates:
        (trip_update["stop_time_update"] || []) |> Enum.map(&parse_stop_time_update/1)
    }
  end

  @spec parse_stop_time_update(map()) :: Realtime.Data.TripUpdate.StopTimeUpdate.t()
  defp parse_stop_time_update(stu_json) do
    nonrev = stu_json["schedule_relationship"] == "SKIPPED"

    stu = %Realtime.Data.TripUpdate.StopTimeUpdate{
      station_id: Realtime.Data.Stations.platforms_to_stations()[stu_json["stop_id"]]
    }

    if nonrev do
      %{stu | predicted_arrival_time: stu_json["passthrough_time"]}
    else
      %{
        stu
        | predicted_arrival_time: stu_json["arrival"] && stu_json["arrival"]["time"],
          predicted_departure_time: stu_json["departure"] && stu_json["departure"]["time"]
      }
    end
  end

  @spec parse_cars([map()]) :: [String.t()]
  defp parse_cars(carriage_details) do
    Enum.map(carriage_details, fn car -> car["label"] end)
  end

  @spec parse_position(map() | nil) :: Util.Position.t() | nil
  defp parse_position(%{"latitude" => latitude, "longitude" => longitude}) do
    %Util.Position{latitude: latitude, longitude: longitude}
  end

  defp parse_position(_), do: nil

  @spec parse_current_status(String.t()) :: :INCOMING_AT | :STOPPED_AT | :IN_TRANSIT_TO
  defp parse_current_status("INCOMING_AT"), do: :INCOMING_AT
  defp parse_current_status("STOPPED_AT"), do: :STOPPED_AT
  defp parse_current_status("IN_TRANSIT_TO"), do: :IN_TRANSIT_TO
end

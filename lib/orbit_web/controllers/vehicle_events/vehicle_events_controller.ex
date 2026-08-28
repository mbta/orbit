defmodule OrbitWeb.VehicleEventsController do
  use OrbitWeb, :controller

  require Logger

  import Ecto.Query

  alias Orbit.Repo
  alias Realtime.Data.VehicleEvent

  @spec vehicle_events(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def vehicle_events(conn, params) do
    service_date = parse_param(params, :service_date) || Util.Time.current_service_date()

    filters =
      ([
         :vehicle_id,
         :station_id,
         :direction_id,
         :arrival_departure
       ]
       |> Enum.map(fn key -> {key, parse_param(params, key)} end)
       |> Enum.reject(fn {_key, value} -> value == nil end)) ++
        [service_date: service_date]

    render(conn, :vehicle_events,
      service_date: service_date,
      vehicle_events:
        Repo.all(
          from(vehicle_event in VehicleEvent,
            where: ^filters,
            order_by: :timestamp
          )
        )
        |> Enum.map(&convert_datetimes/1),
      layout: false
    )
  end

  defp parse_param(params, :service_date) do
    with date_string when not is_nil(date_string) <- Map.get(params, "service_date"),
         {:ok, date} <- Date.from_iso8601(date_string) do
      date
    end
  end

  defp parse_param(params, :vehicle_id), do: Map.get(params, "vehicle_id")
  defp parse_param(params, :station_id), do: Map.get(params, "station_id")

  defp parse_param(params, :direction_id) do
    case Map.get(params, "direction_id") do
      "0" -> 0
      "1" -> 1
      _ -> nil
    end
  end

  defp parse_param(params, :arrival_departure), do: Map.get(params, "arr_dep")

  defp convert_datetimes(vehicle_event) do
    vehicle_event
    |> Map.take([:timestamp, :inserted_at, :updated_at])
    |> Map.new(fn {key, value} -> {key, DateTime.shift_zone!(value, "America/New_York")} end)
    |> then(&Map.merge(vehicle_event, &1))
  end
end

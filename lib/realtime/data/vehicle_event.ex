defmodule Realtime.Data.VehicleEvent do
  use Ecto.Schema
  import Ecto.Changeset
  import Ecto.Query

  alias Orbit.RailLine
  alias Orbit.Repo

  @recent_cutoff_m -180

  @type t :: %__MODULE__{
          service_date: Date.t(),
          cars: [String.t()],
          station_id: String.t(),
          vehicle_id: String.t(),
          direction_id: integer(),
          rail_line: RailLine.t(),
          arrival_departure: :arrival | :departure,
          timestamp: DateTime.t()
        }

  @type departure_lookup :: %{
          {vehicle_id :: String.t(), station_id :: String.t()} => %{
            station_id: String.t(),
            vehicle_id: String.t(),
            direction_id: integer(),
            timestamp: DateTime.t()
          }
        }

  schema "vehicle_events" do
    field(:service_date, :date)
    field(:rail_line, RailLine)
    field(:cars, {:array, :string})
    field(:station_id, :string)
    field(:vehicle_id, :string)
    field(:direction_id, :integer)
    field(:arrival_departure, Ecto.Enum, values: [:arrival, :departure])
    field(:timestamp, :utc_datetime)
    timestamps(type: :utc_datetime)
  end

  def changeset(struct, attrs \\ %{}) do
    struct
    |> cast(
      attrs,
      [
        :service_date,
        :rail_line,
        :cars,
        :station_id,
        :vehicle_id,
        :direction_id,
        :arrival_departure,
        :timestamp
      ]
    )
    |> validate_required([
      :service_date,
      :rail_line,
      :cars,
      :station_id,
      :vehicle_id,
      :direction_id,
      :arrival_departure,
      :timestamp
    ])
    |> validate_inclusion(:direction_id, [0, 1])
    |> validate_inclusion(:arrival_departure, [:arrival, :departure])
  end

  @spec recent_departures(DateTime.t()) :: departure_lookup()
  def recent_departures(now) do
    search_cutoff = DateTime.add(now, @recent_cutoff_m, :minute)
    service_date = Util.Time.service_date_for_utc_datetime(now)

    Repo.all(
      from(event in __MODULE__,
        where:
          event.service_date == ^service_date and event.arrival_departure == :departure and
            event.timestamp > ^search_cutoff,
        group_by: [event.vehicle_id, event.station_id, event.direction_id],
        select: %{
          vehicle_id: event.vehicle_id,
          station_id: event.station_id,
          direction_id: event.direction_id,
          timestamp: max(event.timestamp)
        },
        # For a given vehicle/station pair, the group_by will return potentially two events, one per direction.
        # We are only interested in the more recent event. Sorting in ascending order here by timestamp will
        # mean that the later event is kept by Enum.into/3 below.
        order_by: max(event.timestamp)
      )
    )
    # NB pm: Should be possible for Repo.all to return a map, I think?
    # But I couldn't quickly figure it out, hence the group_by above followed by this
    |> Enum.into(%{}, &{{&1.vehicle_id, &1.station_id}, &1})
  end
end

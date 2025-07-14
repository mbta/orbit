defmodule Orbit.Ocs.Entities do
  @moduledoc """
  Responsible for processing parsed OCS messages, and writing appropriate changes
  to the Trains and Trips in the database.
  Also provides querying of relevant entities for the current service date.
  """
  require Logger

  alias Orbit.Ocs.Train
  alias Orbit.Ocs.Trip
  alias Orbit.RailLine
  alias Orbit.Repo

  alias Orbit.Ocs.Message

  alias Orbit.Ocs.Message.{
    TschAsnMessage,
    TschConMessage,
    TschDelMessage,
    TschDstMessage,
    TschLnkMessage,
    TschNewMessage,
    TschOffMessage,
    TschRldMessage,
    TschTagMessage
  }

  import Ecto.Query

  @type entities() :: [Trip.t()]

  @spec query_latest(DateTime.t()) :: entities()
  def query_latest(current_datetime \\ DateTime.utc_now()) do
    # TODO: What filtering/sorting makes sense for this query?
    service_date = Util.Time.service_date_for_utc_datetime(current_datetime)
    Repo.all(from(trip in Trip, where: trip.service_date == ^service_date))
  end

  @spec apply_changes(Message.t()) :: [{:ok, any} | {:error, any()}]
  def apply_changes(%TschNewMessage{} = message) do
    # A note about upserts:
    #
    # We generally don't expect to receive multiple TSCH_NEW messages for the same
    # Trip UID within a service date and rail line. However, under some scenarios, such as
    # after application downtime, or while testing locally, it is possible for Orbit to
    # receive repeat messages from Kinesis that were already processed in the DB.
    #
    # Since OCS messages are generally considered idempotent, we assume there is no harm
    # in allowing TSCH_NEW messages to replay and replace prior rows.
    %Trip{
      service_date: service_date(message.timestamp),
      uid: message.trip_uid,
      prev_uid: message.prev_trip_uid,
      next_uid: message.next_trip_uid,
      route: message.ocs_route_id,
      rail_line: RailLine.from_ocs_transitline(message.transitline),
      trip_type: message.trip_type,
      scheduled_departure: message.sched_dep && Util.Time.to_ecto_utc(message.sched_dep),
      scheduled_arrival: message.sched_arr && Util.Time.to_ecto_utc(message.sched_arr),
      origin_station: message.origin_sta,
      destination_station: message.dest_sta
    }
    |> Trip.changeset()
    |> Repo.insert(
      on_conflict: :replace_all,
      conflict_target: [:service_date, :uid, :rail_line]
    )
    |> List.wrap()
  end

  def apply_changes(%TschConMessage{} = message) do
    service_date = service_date(message.timestamp)
    rail_line = RailLine.from_ocs_transitline(message.transitline)
    # Apply consist to train
    train_result =
      %Train{
        service_date: service_date,
        uid: message.train_uid,
        rail_line: rail_line,
        cars: message.consist
      }
      |> Train.changeset()
      |> Repo.insert(
        on_conflict: {:replace, [:cars, :updated_at]},
        conflict_target: [:service_date, :uid, :rail_line]
      )

    trip_result =
      assign_train_to_trip(service_date, rail_line, message.trip_uid, message.train_uid)

    [train_result, trip_result]
  end

  def apply_changes(%TschAsnMessage{} = message) do
    assign_train_to_trip(
      service_date(message.timestamp),
      RailLine.from_ocs_transitline(message.transitline),
      message.trip_uid,
      message.train_uid
    )
    |> List.wrap()
  end

  def apply_changes(%TschRldMessage{}) do
    [{:ok, :noop}]
  end

  # TODO: RTR has a lot of logic around this particular message.
  # Confirm that we understand how OCS works here.
  def apply_changes(%TschDstMessage{} = message) do
    %Trip{
      service_date: service_date(message.timestamp),
      uid: message.trip_uid,
      rail_line: RailLine.from_ocs_transitline(message.transitline),
      destination_station: message.dest_sta,
      # TODO: Should we update these if they are nil, or leave the old values?
      route: message.ocs_route_id,
      scheduled_arrival: message.sched_arr
    }
    |> Trip.changeset()
    |> Repo.insert(
      on_conflict:
        {:replace,
         [
           :destination_station,
           :route,
           :scheduled_arrival,
           :updated_at
         ]},
      conflict_target: [:service_date, :rail_line, :uid]
    )
    |> List.wrap()
  end

  def apply_changes(%TschDelMessage{} = message) do
    %Trip{
      service_date: service_date(message.timestamp),
      uid: message.trip_uid,
      rail_line: RailLine.from_ocs_transitline(message.transitline),
      deleted: message.delete_status == :deleted
    }
    |> Trip.changeset()
    |> Repo.insert(
      on_conflict: {:replace, [:deleted, :updated_at]},
      conflict_target: [:service_date, :rail_line, :uid]
    )
    |> List.wrap()
  end

  def apply_changes(%TschLnkMessage{} = message) do
    %Trip{
      service_date: service_date(message.timestamp),
      uid: message.trip_uid,
      rail_line: RailLine.from_ocs_transitline(message.transitline),
      # TODO: Should we update these if they are nil, or leave the old values?
      prev_uid: message.prev_trip_uid,
      next_uid: message.next_trip_uid
    }
    |> Trip.changeset()
    |> Repo.insert(
      on_conflict: {:replace, [:prev_uid, :next_uid, :updated_at]},
      conflict_target: [:service_date, :rail_line, :uid]
    )
    |> List.wrap()
  end

  def apply_changes(%TschOffMessage{} = message) do
    %Trip{
      service_date: service_date(message.timestamp),
      uid: message.trip_uid,
      rail_line: RailLine.from_ocs_transitline(message.transitline),
      offset: message.offset
    }
    |> Trip.changeset()
    |> Repo.insert(
      on_conflict: {:replace, [:offset, :updated_at]},
      conflict_target: [:service_date, :rail_line, :uid]
    )
    |> List.wrap()
  end

  def apply_changes(%TschTagMessage{} = message) do
    service_date = service_date(message.timestamp)
    rail_line = RailLine.from_ocs_transitline(message.transitline)

    # We assume that a TSCH_TAG message contains the canonical ordering of car numbers,
    # ie we can safely overwrite any existing consist
    cars = Enum.map(message.car_tags, fn %{car_number: car_number} -> car_number end)
    car_tags = Enum.map(message.car_tags, fn %{tag: tag} -> tag || "" end)

    # Apply tags to train
    train_result =
      %Train{
        service_date: service_date,
        uid: message.train_uid,
        rail_line: rail_line,
        cars: cars,
        car_tags: car_tags,
        tags: message.consist_tags
      }
      |> Train.changeset()
      |> Repo.insert(
        on_conflict: {:replace, [:cars, :car_tags, :tags, :updated_at]},
        conflict_target: [:service_date, :uid, :rail_line]
      )

    trip_result =
      assign_train_to_trip(service_date, rail_line, message.trip_uid, message.train_uid)

    [train_result, trip_result]
  end

  @spec assign_train_to_trip(Date.t(), RailLine.t(), String.t(), String.t()) ::
          {:ok, any} | {:error, any()}
  defp assign_train_to_trip(service_date, rail_line, trip_uid, train_uid) do
    # Do we need to unassign other trips?
    %Trip{
      service_date: service_date,
      uid: trip_uid,
      rail_line: rail_line,
      train_uid: train_uid
    }
    |> Trip.changeset()
    |> Repo.insert(
      on_conflict: {:replace, [:train_uid, :updated_at]},
      conflict_target: [:service_date, :uid, :rail_line]
    )
  end

  @spec service_date(DateTime.t()) :: Date.t()
  defp service_date(date_time) do
    DateTime.to_date(date_time)
  end
end

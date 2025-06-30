# The work of translating OCS events into Repo change sets will be handled by this module.
# Keeping it separated will be easier later if we decide we want this step to be handled by
# a separate process than the kinesis pipeline.
defmodule Orbit.Ocs.ChangeSet do
  require Logger

  alias Orbit.RailLine
  alias Orbit.Repo
  alias Orbit.Ocs.Train
  alias Orbit.Ocs.Trip

  @spec apply_changes(Orbit.Ocs.Message.t()) :: [{:ok, any} | {:error, any()}]
  def apply_changes(%Orbit.Ocs.Message.TschNewMessage{} = message) do
    %Trip{
      service_date: service_date(message.timestamp),
      uid: message.trip_uid,
      prev_uid: message.prev_trip_uid,
      next_uid: message.next_trip_uid,
      route: message.ocs_route_id,
      rail_line: RailLine.from_ocs_transitline(message.transitline),
      trip_type: message.trip_type,
      scheduled_departure: message.sched_dep,
      scheduled_arrival: message.sched_arr,
      origin_station: message.origin_sta,
      destination_station: message.dest_sta
    }
    |> Trip.changeset()
    |> Repo.insert()
    |> List.wrap()
  end

  def apply_changes(%Orbit.Ocs.Message.TschConMessage{} = message) do
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
        on_conflict: :replace_all,
        conflict_target: [:service_date, :uid, :rail_line]
      )

    trip_result =
      assign_train_to_trip(service_date, rail_line, message.trip_uid, message.train_uid)

    [train_result, trip_result]
  end

  def apply_changes(%Orbit.Ocs.Message.TschAsnMessage{} = message) do
    assign_train_to_trip(
      service_date(message.timestamp),
      RailLine.from_ocs_transitline(message.transitline),
      message.trip_uid,
      message.train_uid
    )
    |> List.wrap()
  end

  def apply_changes(%Orbit.Ocs.Message.TschRldMessage{}) do
    [{:ok, :noop}]
  end

  # TODO: RTR has a lot of logic around this particular message.
  # Confirm that we understand how OCS works here.
  def apply_changes(%Orbit.Ocs.Message.TschDstMessage{} = message) do
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
    |> Repo.insert(on_conflict: :replace_all, conflict_target: [:service_date, :rail_line, :uid])
    |> List.wrap()
  end

  def apply_changes(%Orbit.Ocs.Message.TschDelMessage{} = message) do
    %Trip{
      service_date: service_date(message.timestamp),
      uid: message.trip_uid,
      rail_line: RailLine.from_ocs_transitline(message.transitline),
      deleted: message.delete_status == :deleted
    }
    |> Trip.changeset()
    |> Repo.insert(on_conflict: :replace_all, conflict_target: [:service_date, :rail_line, :uid])
    |> List.wrap()
  end

  def apply_changes(%Orbit.Ocs.Message.TschLnkMessage{} = message) do
    %Trip{
      service_date: service_date(message.timestamp),
      uid: message.trip_uid,
      rail_line: RailLine.from_ocs_transitline(message.transitline),
      # TODO: Should we update these if they are nil, or leave the old values?
      prev_uid: message.prev_trip_uid,
      next_uid: message.next_trip_uid
    }
    |> Trip.changeset()
    |> Repo.insert(on_conflict: :replace_all, conflict_target: [:service_date, :rail_line, :uid])
    |> List.wrap()
  end

  def apply_changes(%Orbit.Ocs.Message.TschOffMessage{} = message) do
    %Trip{
      service_date: service_date(message.timestamp),
      uid: message.trip_uid,
      rail_line: RailLine.from_ocs_transitline(message.transitline),
      offset: message.offset
    }
    |> Trip.changeset()
    |> Repo.insert(on_conflict: :replace_all, conflict_target: [:service_date, :rail_line, :uid])
    |> List.wrap()
  end

  def apply_changes(%Orbit.Ocs.Message.TschTagMessage{} = message) do
    service_date = service_date(message.timestamp)
    rail_line = RailLine.from_ocs_transitline(message.transitline)

    cars =
      if consist =
           query_consist(
             service_date: service_date,
             uid: message.train_uid,
             rail_line: rail_line
           ) do
        consist
      else
        Logger.warning(
          "TSCH TAG received for train #{message.train_uid} with no prior stored consist"
        )

        # Just assume the consist that came with the tags is correct
        Enum.map(message.car_tags, & &1.car_number)
      end

    # Get list of tags sorted in order of car number, using empty strings for cases
    # where cars do not have tags
    ordered_tags =
      Enum.map(cars, fn car_number ->
        case Enum.find(message.car_tags, fn car_tag ->
               car_tag.car_number == car_number
             end) do
          %{tag: tag} -> tag
          _ -> ""
        end
      end)

    # Apply tags to train
    train_result =
      %Train{
        service_date: service_date,
        uid: message.train_uid,
        rail_line: rail_line,
        car_tags: ordered_tags,
        tags: message.consist_tags
      }
      |> Train.changeset()
      |> Repo.insert(
        on_conflict: :replace_all,
        conflict_target: [:service_date, :uid, :rail_line]
      )

    trip_result =
      assign_train_to_trip(service_date, rail_line, message.trip_uid, message.train_uid)

    [train_result, trip_result]
  end

  @spec assign_train_to_trip(Date.t(), RailLine.t(), String.t(), String.t()) ::
          {:ok, any} | {:error, any()}
  defp assign_train_to_trip(service_date, rail_line, trip_uid, train_uid) do
    %Trip{
      service_date: service_date,
      uid: trip_uid,
      rail_line: rail_line,
      train_uid: train_uid
    }
    |> Trip.changeset()
    |> Repo.insert(
      on_conflict: :replace_all,
      conflict_target: [:service_date, :uid, :rail_line]
    )
  end

  @spec service_date(DateTime.t()) :: Date.t()
  defp service_date(date_time) do
    DateTime.to_date(date_time)
  end

  @spec query_consist(Keyword.t()) :: [String.t()] | nil
  defp query_consist(train_query_params) do
    with train <- Repo.get_by(Train, train_query_params),
         false <- is_nil(train) do
      train.cars
    else
      _ ->
        nil
    end
  end
end

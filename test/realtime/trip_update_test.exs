defmodule Realtime.TripUpdateTest do
  alias Realtime.Data.TripUpdate
  use ExUnit.Case, async: true

  import Orbit.Factory

  describe "last_arrival_time" do
    test "gets the data arrival time from stop time updates" do
      assert ~U[2029-01-01 12:00:00Z] =
               TripUpdate.last_arrival_time(
                 build(:trip_update,
                   stop_time_updates: [
                     build(:stop_time_update),
                     build(:stop_time_update, predicted_arrival_time: ~U[2029-01-01 12:00:00Z])
                   ]
                 )
               )
    end
  end
end

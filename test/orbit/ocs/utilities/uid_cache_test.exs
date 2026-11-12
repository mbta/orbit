defmodule Orbit.Ocs.UidCacheTest do
  use Orbit.DataCase
  import Orbit.Factory

  @today Date.new!(2025, 7, 2)
  @yesterday Date.new!(2025, 7, 1)
  @three_days_ago Date.new!(2025, 6, 29)

  describe "initialize" do
    test "gets trip UIDs from current day" do
      insert(:trip, service_date: @today)
      assert %{"11111" => @today} = Orbit.Ocs.UidCache.initialize(@today)
    end

    test "gets trip UIDs from previous day" do
      insert(:trip, service_date: @yesterday)
      assert %{"11111" => @yesterday} = Orbit.Ocs.UidCache.initialize(@today)
    end

    test "doesn't include three days ago" do
      insert(:trip, service_date: @three_days_ago)
      assert %{} == Orbit.Ocs.UidCache.initialize(@today)
    end
  end

  describe "prune" do
    test "removes old trip UIDs from cache" do
      assert %{"CURRENT" => @today} ==
               Orbit.Ocs.UidCache.prune(
                 %{
                   "CURRENT" => @today,
                   "OLD1" => ~D[2024-11-02],
                   "OLD2" => @three_days_ago
                 },
                 @today
               )
    end
  end
end

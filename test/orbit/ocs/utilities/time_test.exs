defmodule Orbit.Ocs.Utilities.TimeTests do
  use ExUnit.Case, async: true

  alias Orbit.Ocs.Utilities.Time, as: OcsTime

  @timezone Application.compile_env(:orbit, :timezone)

  # Local eastern timezone on this date is EDT (-04:00 UTC)
  @test_date ~D[2025-04-08]
  @test_date_before ~D[2025-04-07]

  # Example dates for springing ahead to EDT (-04:00 UTC)
  @spring_ahead_date_before ~D[2025-03-08]
  @spring_ahead_date ~D[2025-03-09]
  @spring_ahead_date_after ~D[2025-03-10]

  # Example dates for falling back to EST (-05:00 UTC)
  @fall_back_date_before ~D[2024-11-02]
  @fall_back_date ~D[2024-11-03]
  @fall_back_date_after ~D[2024-11-04]

  describe "interpret_ocs_message_timestamp : general cases" do
    test "it interprets recent timestamps as the current date" do
      dt_6_00_00 = DateTime.new!(@test_date, ~T[06:00:00], @timezone)
      dt_5_00_00 = DateTime.new!(@test_date, ~T[05:00:00], @timezone)
      {:ok, emitted} = dt_6_00_00 |> DateTime.shift_zone("Etc/UTC")
      result = OcsTime.interpret_ocs_message_timestamp("05:00:00", emitted)
      assert result == dt_5_00_00
    end

    test "it correctly interprets emitted_date based on local timezone" do
      # Times chosen as an example where the date differs between local and UTC timeszones.
      dt_22_00_00 = DateTime.new!(@test_date, ~T[22:00:00], @timezone)
      dt_21_00_00 = DateTime.new!(@test_date, ~T[21:00:00], @timezone)
      {:ok, emitted} = dt_22_00_00 |> DateTime.shift_zone("Etc/UTC")
      result = OcsTime.interpret_ocs_message_timestamp("21:00:00", emitted)
      assert result == dt_21_00_00
    end

    test "it interprets \"future\" timestamps within the next hour as the current date" do
      dt_6_00_00 = DateTime.new!(@test_date, ~T[06:00:00], @timezone)
      dt_6_59_59 = DateTime.new!(@test_date, ~T[06:59:59], @timezone)
      {:ok, emitted} = dt_6_00_00 |> DateTime.shift_zone("Etc/UTC")
      result = OcsTime.interpret_ocs_message_timestamp("06:59:59", emitted)
      assert result == dt_6_59_59
    end

    test "it interprets \"future\" timestamps at/beyond the next hour as stale, ie belonging to the prior day" do
      # Times chosen as an example where the date differs between local and UTC timeszones.
      dt_22_00_00 = DateTime.new!(@test_date, ~T[22:00:00], @timezone)
      dt_23_00_00_day_before = DateTime.new!(@test_date_before, ~T[23:00:00], @timezone)
      {:ok, emitted} = dt_22_00_00 |> DateTime.shift_zone("Etc/UTC")
      result = OcsTime.interpret_ocs_message_timestamp("23:00:00", emitted)
      assert result == dt_23_00_00_day_before
    end
  end

  describe "interpret_ocs_message_timestamp : on spring ahead from EST to EDT" do
    # OCS Message Timestamps jump from 1:59 to 3:00

    test "it interprets upcoming timestamps (1:59 -> 3:00)" do
      dt_1_59_59 = DateTime.new!(@spring_ahead_date, ~T[01:59:59], @timezone)
      dt_3_00_00 = DateTime.new!(@spring_ahead_date, ~T[03:00:00], @timezone)

      # We spring ahead at 2am to 3am, so these times are only 1 second apart
      assert 1 == DateTime.diff(dt_3_00_00, dt_1_59_59, :second)

      # Based on OCS_Saver logs, OCS starts the new timezone by emitting messages
      # that are correctly stamped as 03:00:00. By convention from RTR, we
      # consider message timestamps up to on hour in the future as belonging to
      # current day.
      # So at 1:59 AM, a 3:00 AM message is well within the 1-hour cutoff and
      # should be interpreted as the same day.
      {:ok, emitted} = dt_1_59_59 |> DateTime.shift_zone("Etc/UTC")
      result = OcsTime.interpret_ocs_message_timestamp("03:00:00", emitted)
      assert result == dt_3_00_00
    end

    test "it interprets old timestamps from the prior day" do
      dt_1_59_59 = DateTime.new!(@spring_ahead_date, ~T[01:59:59], @timezone)
      dt_3_59_59_day_before = DateTime.new!(@spring_ahead_date_before, ~T[03:59:59], @timezone)

      # We spring ahead at 2am to 3am, so these times are 22 hours apart
      assert 22 == DateTime.diff(dt_1_59_59, dt_3_59_59_day_before, :hour)

      # Based on OCS_Saver logs, OCS starts the new timezone by emitting messages
      # that are correctly stamped as 03:00:00. By convention from RTR, we
      # consider message timestamps up to on hour in the future as belonging to
      # current day.
      # So at 1:59 AM, a 3:59 message reaches the 1-hour cutoff and should be
      # interpreted as the previous day.
      {:ok, emitted} = dt_1_59_59 |> DateTime.shift_zone("Etc/UTC")
      result = OcsTime.interpret_ocs_message_timestamp("03:59:59", emitted)
      assert result == dt_3_59_59_day_before
    end

    test "it interprets (unexpected) gap timestamps as belonging to the prior day" do
      dt_1_59_59 = DateTime.new!(@spring_ahead_date, ~T[01:59:59], @timezone)
      dt_2_00_00_day_before = DateTime.new!(@spring_ahead_date_before, ~T[02:00:00], @timezone)

      # We spring ahead at 2am to 3am, so these times are 24 hours - 1 second apart
      assert 86_399 == DateTime.diff(dt_1_59_59, dt_2_00_00_day_before, :second)

      {:ok, emitted} = dt_1_59_59 |> DateTime.shift_zone("Etc/UTC")

      # If we interpret "02:00:00" as "2am" local time of the current day, that corresponds
      # to a time that does not exist, ie falls in the 1:59:59 -> 3:00:00 gap. Since OCS is
      # not expected to produce gap timestamps, we should interpret it as falling on the
      # prior day.
      result = OcsTime.interpret_ocs_message_timestamp("02:00:00", emitted)
      assert result == dt_2_00_00_day_before
    end

    test "on day after spring-ahead, safely interprets stale timestamps" do
      dt_midnight_day_after = DateTime.new!(@spring_ahead_date_after, ~T[00:00:00], @timezone)
      dt_3_00_00 = DateTime.new!(@spring_ahead_date, ~T[03:00:00], @timezone)

      {:ok, emitted} = dt_midnight_day_after |> DateTime.shift_zone("Etc/UTC")

      # 2:30 am is beyond 1 hour in the future, so should be interpreted as the day prior.
      # But that makes it a gap timestamp. Should safely parse and (arbitrarily)
      # assume the first legal timestamp after the gap (ie, 3am)
      result = OcsTime.interpret_ocs_message_timestamp("02:30:00", emitted)
      assert result == dt_3_00_00
    end
  end

  describe "interpret_ocs_message_timestamp : on fall back from EDT to EST" do
    # OCS Message Timestamps go from 1:59 back to 1:00

    test "it chooses the earlier of ambiguous timestamps when closer to the earlier time" do
      {:ambiguous, dt_1_29_59_earlier, _later} =
        DateTime.new(@fall_back_date, ~T[01:29:59], @timezone)

      {:ambiguous, dt_1_00_00_earlier, _later} =
        DateTime.new(@fall_back_date, ~T[01:00:00], @timezone)

      {:ok, emitted} = dt_1_29_59_earlier |> DateTime.shift_zone("Etc/UTC")
      result = OcsTime.interpret_ocs_message_timestamp("01:00:00", emitted)
      assert result == dt_1_00_00_earlier
    end

    test "it chooses the later of ambiguous timestamps when closer to the later time" do
      {:ambiguous, dt_1_30_00_earlier, _later} =
        DateTime.new(@fall_back_date, ~T[01:30:00], @timezone)

      {:ambiguous, _earlier, dt_1_00_00_later} =
        DateTime.new(@fall_back_date, ~T[01:00:00], @timezone)

      {:ok, emitted} = dt_1_30_00_earlier |> DateTime.shift_zone("Etc/UTC")
      result = OcsTime.interpret_ocs_message_timestamp("01:00:00", emitted)
      assert result == dt_1_00_00_later
    end

    test "it still interprets stale timestamps from the prior day" do
      dt_midnight = DateTime.new!(@fall_back_date, ~T[00:00:00], @timezone)
      dt_1_00_00_day_before = DateTime.new!(@fall_back_date_before, ~T[01:00:00], @timezone)

      {:ok, emitted} = dt_midnight |> DateTime.shift_zone("Etc/UTC")
      result = OcsTime.interpret_ocs_message_timestamp("01:00:00", emitted)
      assert result == dt_1_00_00_day_before
    end

    test "on day after fallback, safely interprets stale timestamps" do
      dt_midnight_day_after = DateTime.new!(@fall_back_date_after, ~T[00:00:00], @timezone)

      {:ambiguous, _earlier, dt_1_30_00_later} =
        DateTime.new(@fall_back_date, ~T[01:30:00], @timezone)

      {:ok, emitted} = dt_midnight_day_after |> DateTime.shift_zone("Etc/UTC")

      # 1:30 am is beyond 1 hour in the future, so should be interpreted as the day prior.
      # But that makes it an ambiguous timestamp. Should safely parse and (arbitrarily)
      # assume the later timestamp.
      result = OcsTime.interpret_ocs_message_timestamp("01:30:00", emitted)
      assert result == dt_1_30_00_later
    end
  end
end

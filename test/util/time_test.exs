defmodule Util.TimeTest do
  use ExUnit.Case, async: true

  @timezone Application.compile_env!(:orbit, :timezone)

  describe "service_date_for_timestamp" do
    test "3:00am" do
      assert ~D[2024-07-23] =
               Util.Time.service_date_for_timestamp(
                 DateTime.new!(~D[2024-07-23], ~T[03:00:00], @timezone)
                 |> DateTime.to_unix()
               )
    end

    test "midday" do
      assert ~D[2024-07-22] =
               Util.Time.service_date_for_timestamp(
                 DateTime.new!(~D[2024-07-22], ~T[12:20:40], @timezone)
                 |> DateTime.to_unix()
               )
    end

    test "12:01am" do
      assert ~D[2024-07-22] =
               Util.Time.service_date_for_timestamp(
                 DateTime.new!(~D[2024-07-23], ~T[00:01:00], @timezone)
                 |> DateTime.to_unix()
               )
    end

    test "2:59am" do
      assert ~D[2024-07-22] =
               Util.Time.service_date_for_timestamp(
                 DateTime.new!(~D[2024-07-23], ~T[02:59:00], @timezone)
                 |> DateTime.to_unix()
               )
    end
  end

  describe "service_date_boundaries" do
    test "works on a normal day" do
      assert {
               DateTime.new!(~D[2024-07-22], ~T[03:00:00], @timezone),
               DateTime.new!(~D[2024-07-23], ~T[03:00:00], @timezone)
             } == Util.Time.service_date_boundaries(~D[2024-07-22])
    end

    test "works on a spring forward day" do
      assert {
               DateTime.new!(~D[2024-03-10], ~T[03:00:00], @timezone),
               DateTime.new!(~D[2024-03-11], ~T[03:00:00], @timezone)
             } == Util.Time.service_date_boundaries(~D[2024-03-10])
    end

    test "works the day before a spring forward day" do
      assert {
               DateTime.new!(~D[2024-03-09], ~T[03:00:00], @timezone),
               DateTime.new!(~D[2024-03-10], ~T[03:00:00], @timezone)
             } == Util.Time.service_date_boundaries(~D[2024-03-09])
    end

    test "works the day after a spring forward day" do
      assert {
               DateTime.new!(~D[2024-03-11], ~T[03:00:00], @timezone),
               DateTime.new!(~D[2024-03-12], ~T[03:00:00], @timezone)
             } == Util.Time.service_date_boundaries(~D[2024-03-11])
    end

    test "works on a fall back day" do
      assert {
               DateTime.new!(~D[2024-11-03], ~T[03:00:00], @timezone),
               DateTime.new!(~D[2024-11-04], ~T[03:00:00], @timezone)
             } == Util.Time.service_date_boundaries(~D[2024-11-03])
    end

    test "works the day before a fall back day" do
      assert {
               DateTime.new!(~D[2024-11-02], ~T[03:00:00], @timezone),
               DateTime.new!(~D[2024-11-03], ~T[03:00:00], @timezone)
             } == Util.Time.service_date_boundaries(~D[2024-11-02])
    end

    test "works the day after a fall back day" do
      assert {
               DateTime.new!(~D[2024-11-04], ~T[03:00:00], @timezone),
               DateTime.new!(~D[2024-11-05], ~T[03:00:00], @timezone)
             } == Util.Time.service_date_boundaries(~D[2024-11-04])
    end
  end
end

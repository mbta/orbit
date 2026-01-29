defmodule Realtime.PollingServerTest do
  use ExUnit.Case

  import Orbit.Factory
  import Test.Support.Helpers
  alias Realtime.PollingServer

  def offer_timestamp(timestamp) do
    Application.app_dir(:orbit, "priv/s3/polling-server-test/VehiclePositions_enhanced.json")
    |> File.write!("#{timestamp}")
  end

  setup do
    s3_dir = Application.app_dir(:orbit, "priv/s3/polling-server-test")
    File.mkdir_p!(s3_dir)
    File.write("#{s3_dir}/VehiclePositions_enhanced.json", "0")
    on_exit(fn -> File.rm!("#{s3_dir}/VehiclePositions_enhanced.json") end)

    {:ok, _} =
      start_supervised(
        {PollingServer,
         %PollingServer.Opts{
           server_name: :vehicle_positions_test,
           entity_type: :vehicle_positions,
           s3_ref: :rtr_public,
           s3_path: "VehiclePositions_enhanced.json",
           poll_delay: 10_000,
           decode_fn: fn
             "" ->
               nil

             timestamp ->
               %{
                 timestamp: String.to_integer(timestamp),
                 entities: [build(:vehicle_position)]
               }
           end
         }},
        id: :vehicle_positions_test
      )

    :ok
  end

  defp reject_expected_logs(logs) do
    logs
    |> Enum.reject(fn s -> String.starts_with?(s, "[info] s3 method=read") end)
    |> Enum.reject(fn s -> String.starts_with?(s, "[info] Tzdata") end)
  end

  test "logs when there's new data" do
    log =
      capture_log do
        offer_timestamp(1)
        send(:vehicle_positions_test, :poll)
        Process.sleep(50)
      end
      |> reject_expected_logs()

    assert log == ["[info] poll_new_data source=vehicle_positions_test timestamp=1 count=1"]

    log =
      capture_log do
        send(:vehicle_positions_test, :poll)
        Process.sleep(50)
      end
      |> reject_expected_logs()

    assert log == []

    log =
      capture_log do
        offer_timestamp(2)
        send(:vehicle_positions_test, :poll)
        Process.sleep(50)
      end
      |> reject_expected_logs()

    assert log == ["[info] poll_new_data source=vehicle_positions_test timestamp=2 count=1"]
  end

  test "subscribed clients get data pushed to them" do
    PollingServer.subscribe(self(), :vehicle_positions_test)
    offer_timestamp(1)
    send(:vehicle_positions_test, :poll)

    assert_receive(
      {:new_data, :vehicle_positions, %{entities: [_]}},
      200,
      "Client didn't receive vehicle positions"
    )
  end

  test "closed clients don't get message" do
    PollingServer.subscribe(self(), :vehicle_positions_test)

    send(
      :vehicle_positions_test,
      {:DOWN, :_monitor_ref, :process, self(), "closed for testing"}
    )

    offer_timestamp(1)
    send(:vehicle_positions_test, :poll)

    refute_receive(
      {:new_data, :vehicle_positions, _new_data},
      200,
      "Closed client shouldn't have gotten vehicle positions"
    )
  end
end

defmodule OrbitWeb.TrainLocationsChannelTest do
  use OrbitWeb.ChannelCase

  import Orbit.Factory
  import Mock
  alias Orbit.Authentication.User
  alias OrbitWeb.TrainLocationsChannel
  alias Realtime.PollingServer
  alias Realtime.TripMatcherServer

  setup do
    s3_dir = Application.app_dir(:orbit, "priv/s3/polling-server-test")
    File.mkdir_p!(s3_dir)
    File.write("#{s3_dir}/VehiclePositions_enhanced.json", "0")
    on_exit(fn -> File.rm!("#{s3_dir}/VehiclePositions_enhanced.json") end)

    {:ok, _} =
      start_supervised(
        {PollingServer,
         %PollingServer.Opts{
           server_name: :vehicle_positions,
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
                 entities: [
                   build(:vehicle_position)
                 ]
               }
           end
         }},
        id: :vehicle_positions
      )

    {:ok, _} =
      start_supervised(
        {PollingServer,
         %PollingServer.Opts{
           server_name: :trip_updates,
           entity_type: :trip_updates,
           s3_ref: :rtr_public,
           s3_path: "TripUpdates_enhanced.json",
           poll_delay: 10_000,
           decode_fn: fn
             "" ->
               nil

             timestamp ->
               %{
                 timestamp: String.to_integer(timestamp),
                 entities: [
                   build(:trip_updates)
                 ]
               }
           end
         }},
        id: :trip_updates
      )

    {:ok, _} = start_supervised(TripMatcherServer)

    :ok
  end

  describe "TrainLocationsChannel" do
    for {line, route_id} <- [{"Red", :Red}, {"Blue", :Blue}, {"Orange", :Orange}] do
      @tag :authenticated
      test "joins #{line} and filters initial data and later pushes", %{socket: socket} do
        line = unquote(line)
        route_id = unquote(route_id)
        send_vehicle_positions()

        {:ok, data, _socket} =
          subscribe_and_join(socket, TrainLocationsChannel, "vehicles", %{"line" => line})

        assert %{data: %{timestamp: 123, entities: [%{position: %{route_id: ^route_id}}]}} =
                 data

        send_vehicle_positions(456)

        assert_push("vehicles", %{
          data: %{timestamp: 456, entities: [%{position: %{route_id: ^route_id}}]}
        })
      end
    end

    test_with_mocks "rejects missing and invalid line filters without subscribing",
                    %{socket: socket},
                    [{TripMatcherServer, [:passthrough], []}] do
      assert {:error, %{reason: "missing_line"}} =
               TrainLocationsChannel.join("vehicles", nil, socket)

      for {payload, reason} <- [
            {%{}, "missing_line"},
            {%{"line" => nil}, "invalid_line"},
            {%{"line" => 123}, "invalid_line"},
            {%{"line" => "Green"}, "invalid_line"}
          ] do
        assert {:error, %{reason: ^reason}} =
                 subscribe_and_join(socket, TrainLocationsChannel, "vehicles", payload)
      end

      assert_not_called(TripMatcherServer.subscribe(:_, :_))
    end

    test "channel sends auth_expired after token expires" do
      {:ok, token, _} =
        OrbitWeb.Auth.Guardian.encode_and_sign(%User{email: "user@example.com"}, %{groups: []},
          ttl: {0, :second}
        )

      {:ok, socket} = connect(OrbitWeb.UserSocket, %{"token" => token})

      {:ok, _, socket} =
        subscribe_and_join(socket, TrainLocationsChannel, "vehicles", %{"line" => "Red"})

      # wait for token to expire
      # (must ensure token has been expired for an entire second since Guardian's timestamps are in seconds)
      Process.sleep(1000)

      vehicles = %{data: [build(:vehicle)]}
      send(socket.channel_pid, {:new_data, :vehicles, vehicles})
      assert_push("auth_expired", %{})
    end
  end

  defp send_vehicle_positions(timestamp \\ 123) do
    positions =
      Enum.map([:Red, :Blue, :Orange], fn route_id ->
        build(:vehicle_position, route_id: route_id)
      end)

    send(
      TripMatcherServer,
      {:new_data, :vehicle_positions, %{timestamp: timestamp, entities: positions}}
    )

    :sys.get_state(TripMatcherServer)
  end
end

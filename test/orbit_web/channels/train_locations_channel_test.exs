defmodule OrbitWeb.TrainLocationsChannelTest do
  use OrbitWeb.ChannelCase

  import Orbit.Factory
  alias Orbit.Authentication.User
  alias OrbitWeb.TrainLocationsChannel
  alias Realtime.PollingServer

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

    :ok
  end

  describe "TrainLocationsChannel" do
    @tag :authenticated
    test "channel forwards train locations to client", %{socket: socket} do
      {:ok, _, socket} = subscribe_and_join(socket, TrainLocationsChannel, "train_locations")

      vehicle_positions = %{
        timestamp: 0,
        entities: [build(:vehicle_position)]
      }

      send(socket.channel_pid, {:new_data, :vehicle_positions, vehicle_positions})
      assert_push("vehicle_positions", %{data: ^vehicle_positions})
    end

    test "channel sends auth_expired after token expires" do
      {:ok, token, _} =
        OrbitWeb.Auth.Guardian.encode_and_sign(%User{email: "user@example.com"}, %{groups: []},
          ttl: {0, :second}
        )

      {:ok, socket} = connect(OrbitWeb.UserSocket, %{"token" => token})
      {:ok, _, socket} = subscribe_and_join(socket, TrainLocationsChannel, "train_locations")

      # wait for token to expire
      # (must ensure token has been expired for an entire second since Guardian's timestamps are in seconds)
      Process.sleep(1000)

      vehicle_positions = %{timestamp: 0, entities: [build(:vehicle_position)]}
      send(socket.channel_pid, {:new_data, :vehicle_positions, vehicle_positions})
      assert_push("auth_expired", %{})
    end
  end
end

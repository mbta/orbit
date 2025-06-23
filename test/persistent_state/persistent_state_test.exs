defmodule PersistentStateTest do
  use ExUnit.Case
  import Orbit.PersistentState
  import Test.Support.Helpers

  @state_filename "persistent_state_filename"

  defmodule FakePersistentStateModule do
    use GenServer
    require Logger

    use Orbit.PersistentState,
      state_filename: "fake_persistent_state",
      new_state: %{},
      restore_fn: &PersistentStateTest.FakePersistentStateModule.restore_fake_state/3,
      current_version: 1

    def restore_fake_state(_binary, _old_version, _new_version), do: %{}

    def start_link(opts \\ []) do
      GenServer.start_link(__MODULE__, opts, opts)
    end

    def init(opts) do
      init_persistent_state(opts)
    end
  end

  setup_all do
    Application.put_env(:orbit, :get_state_from_s3?, true)
    on_exit(&cleanup_all/0)
  end

  defp cleanup_all do
    Application.put_env(:orbit, :get_state_from_s3?, false)
  end

  setup do
    :orbit
    |> Application.get_env(:persistent_state_dir)
    |> File.mkdir_p()

    on_exit(fn ->
      :orbit
      |> Application.get_env(:persistent_state_dir)
      |> Path.join(@state_filename)
      |> File.rm()
    end)
  end

  describe "init_persistent_state/5" do
    test "returns parsed state if it is valid (with version)" do
      restore_fn = fn x, _, _ -> {:ok, x} end
      binary = Jason.encode!(%{version: 1, state: "parsed state"})

      :orbit
      |> Application.get_env(:persistent_state_dir)
      |> Path.join(@state_filename)
      |> File.write(binary)

      assert init_persistent_state(
               @state_filename,
               "new_state",
               restore_fn,
               1,
               __MODULE__
             ) == {:ok, "parsed state"}
    end

    test "when s3 fails for some reason, logs it" do
      restore_fn = fn x, _, _ -> {:ok, Jason.decode!(x)} end
      binary = Jason.encode!(%{version: 1, state: "parsed state"})

      :orbit
      |> Application.get_env(:persistent_state_dir)
      |> Path.join("bad_filename")
      |> File.write(binary)

      logs =
        capture_log(:warning) do
          init_persistent_state(
            "bad_filename",
            "new state",
            restore_fn,
            1,
            __MODULE__
          )
        end

      assert logs
             |> Enum.any?(fn log ->
               log =~ "[warning] event=persistent_state_issue Failed to download"
             end)
    end

    test "returns new state when parser returns error" do
      restore_fn = fn _x, _, _ -> raise "Exception" end
      binary = Jason.encode!("bad state format")

      :orbit
      |> Application.get_env(:persistent_state_dir)
      |> Path.join(@state_filename)
      |> File.write(binary)

      logs =
        capture_log(:warning) do
          assert init_persistent_state(
                   @state_filename,
                   "new state",
                   restore_fn,
                   1,
                   __MODULE__
                 ) == {:ok, "new state"}
        end

      assert logs
             |> Enum.any?(fn log ->
               log =~ "[error] event=persistent_state_parse_error"
             end)
    end

    test "safely handles exception from restore function" do
      restore_fn = fn _x, _, _ -> raise "Exception" end
      binary = Jason.encode!(%{version: 1, state: "parsed state"})

      :orbit
      |> Application.get_env(:persistent_state_dir)
      |> Path.join(@state_filename)
      |> File.write(binary)

      logs =
        capture_log(:warning) do
          assert init_persistent_state(
                   @state_filename,
                   "new state",
                   restore_fn,
                   1,
                   __MODULE__
                 ) == {:ok, "new state"}
        end

      assert logs
             |> Enum.any?(fn log ->
               log =~ "[error] event=persistent_state_parse_error Exception"
             end)
    end

    test "Returns new state when state should not be loaded" do
      reassign_env(:orbit, :load_state?, "false")
      restore_fn = fn x, _, _ -> {:ok, Jason.decode!(x)} end
      binary = Jason.encode!("parsed state")

      :orbit
      |> Application.get_env(:persistent_state_dir)
      |> Path.join(@state_filename)
      |> File.write(binary)

      logs =
        capture_log(:info) do
          assert init_persistent_state(
                   @state_filename,
                   "new state",
                   restore_fn,
                   1,
                   __MODULE__
                 ) == {:ok, "new state"}
        end

      assert logs |> Enum.any?(fn log -> log =~ "[info] Not loading" end)
    end
  end

  describe "write_to_disk/3" do
    test "Returns :ok when write is successful" do
      assert write_to_disk(@state_filename, "initial_state", 1) == :ok

      assert :orbit
             |> Application.get_env(:persistent_state_dir)
             |> Path.join(@state_filename)
             |> File.read!()
             |> Jason.decode!(keys: :atoms) == %{version: 1, state: "initial_state"}
    end

    test "Returns :error and logs warning when file cannot be read" do
      false_dir = "/nonexistent/testing/directory"
      reassign_env(:orbit, :persistent_state_dir, false_dir)

      logs =
        capture_log(:warning) do
          assert write_to_disk(@state_filename, "initial_state", 1) == :error
        end

      assert logs
             |> Enum.any?(fn log ->
               log =~
                 "event=persistent_state_disk_write_error Could not save state to #{false_dir}"
             end)
    end
  end

  describe "write_to_s3/2" do
    test "Returns :ok when write is successful" do
      assert write_to_s3(@state_filename, "initial_state", 1) == :ok

      assert_received :s3_request
    end

    test "Returns :error and logs warning when file cannot be read" do
      filename = "bad_filename"

      logs =
        capture_log(:warning) do
          assert write_to_s3(filename, "initial_state", 1) == :error
        end

      assert logs
             |> Enum.any?(fn log ->
               log =~
                 "[warning] event=persistent_state_s3_write_issues state_filename=#{filename} bucket=fake-bucket"
             end)

      assert_received :s3_request_bad_file
    end
  end

  describe "terminate/2" do
    test "writes state when process shuts down" do
      {:ok, pid} =
        PersistentStateTest.FakePersistentStateModule.start_link(
          name: :persistent_state_shutdown_test,
          save_state_time: 60_000
        )

      logs =
        capture_log(:info) do
          Process.exit(pid, :normal)
          Process.sleep(50)
        end

      assert logs
             |> Enum.any?(fn log ->
               log =~ "[info] Exiting for reason: :normal. Writing persistent state."
             end)
    end
  end
end

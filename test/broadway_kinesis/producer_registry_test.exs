defmodule BroadwayKinesis.ProducerRegistryTest do
  use ExUnit.Case, async: true
  alias BroadwayKinesis.ProducerRegistry
  require Logger

  setup do
    {:ok, pid} =
      start_supervised({ProducerRegistry, [name: __MODULE__, registry_name: :test_registry]},
        restart: :temporary
      )

    {:ok, pid: pid}
  end

  describe "register" do
    test "responds :ok if successful", %{pid: pid} do
      assert :ok = ProducerRegistry.register(%{stream_name: "my-test-stream"}, pid)
    end

    test "does not create duplicate entries", %{pid: pid} do
      assert :ok = ProducerRegistry.register(%{stream_name: "my-test-stream"}, pid)
      assert :ok = ProducerRegistry.register(%{stream_name: "my-test-stream"}, pid)
      assert :ok = ProducerRegistry.register(%{stream_name: "my-other-test-stream"}, pid)
    end
  end

  describe "unregister" do
    test "responds :ok if successful", %{pid: pid} do
      assert :ok = ProducerRegistry.register(%{stream_name: "my-test-stream"}, pid)

      assert :ok = ProducerRegistry.unregister(%{stream_name: "my-test-stream"}, pid)
    end

    test "returns :ok if trying to unregister stream that was not previously registered", %{
      pid: pid
    } do
      assert :ok = ProducerRegistry.register(%{stream_name: "my-test-stream"}, pid)

      assert :ok = ProducerRegistry.unregister(%{stream_name: "my-invalid-test-stream"}, pid)
    end
  end

  describe "update_value" do
    test "responds :ok if successful", %{pid: pid} do
      :ok = ProducerRegistry.register(%{stream_name: "my-test-stream"}, pid)
      assert :ok = ProducerRegistry.update_value(%{stream_name: "my-test-stream"}, true, pid)

      assert :ok = ProducerRegistry.update_value(%{stream_name: "my-test-stream"}, false, pid)
    end

    test "still returns :ok for an unregistered stream", %{pid: pid} do
      assert :ok = ProducerRegistry.update_value(%{stream_name: "my-test-stream"}, true, pid)

      assert :ok = ProducerRegistry.update_value(%{stream_name: "my-test-stream"}, false, pid)
    end

    test "returns :error if trying to update value to anything but boolean", %{pid: pid} do
      assert :error = ProducerRegistry.update_value(%{stream_name: "my-test-stream"}, "test", pid)

      assert :error = ProducerRegistry.update_value(%{stream_name: "my-test-stream"}, 123, pid)
    end
  end

  describe "producers_ready?" do
    test "returns true if all streams are set to true", %{pid: pid} do
      assert :ok = ProducerRegistry.register(%{stream_name: "my-first-test-stream"}, pid)
      assert :ok = ProducerRegistry.register(%{stream_name: "my-second-test-stream"}, pid)
      assert :ok = ProducerRegistry.register(%{stream_name: "my-third-test-stream"}, pid)

      assert :ok =
               ProducerRegistry.update_value(%{stream_name: "my-first-test-stream"}, true, pid)

      assert :ok =
               ProducerRegistry.update_value(%{stream_name: "my-second-test-stream"}, true, pid)

      assert :ok =
               ProducerRegistry.update_value(%{stream_name: "my-third-test-stream"}, true, pid)

      assert ProducerRegistry.producers_ready?(pid)
    end

    test "returns false if any of the streams are set to false", %{pid: pid} do
      assert :ok = ProducerRegistry.register(%{stream_name: "my-first-test-stream"}, pid)
      assert :ok = ProducerRegistry.register(%{stream_name: "my-second-test-stream"}, pid)
      assert :ok = ProducerRegistry.register(%{stream_name: "my-third-test-stream"}, pid)

      assert :ok =
               ProducerRegistry.update_value(%{stream_name: "my-first-test-stream"}, true, pid)

      assert :ok =
               ProducerRegistry.update_value(%{stream_name: "my-second-test-stream"}, true, pid)

      refute ProducerRegistry.producers_ready?(pid)
    end

    test "returns true if underlying registry is not running", %{pid: pid} do
      assert :ok = ProducerRegistry.register(%{stream_name: "my-first-test-stream"}, pid)
      assert :ok = ProducerRegistry.register(%{stream_name: "my-second-test-stream"}, pid)
      assert :ok = ProducerRegistry.register(%{stream_name: "my-third-test-stream"}, pid)

      assert :ok =
               ProducerRegistry.update_value(%{stream_name: "my-first-test-stream"}, true, pid)

      assert :ok =
               ProducerRegistry.update_value(%{stream_name: "my-second-test-stream"}, true, pid)

      assert :ok =
               ProducerRegistry.update_value(%{stream_name: "my-third-test-stream"}, true, pid)

      assert ProducerRegistry.producers_ready?(pid)
    end
  end

  describe "set_ready_override" do
    test "producers_ready? returns the value set by override regardless of stream values", %{
      pid: pid
    } do
      assert :ok = ProducerRegistry.register(%{stream_name: "my-first-test-stream"}, pid)
      assert :ok = ProducerRegistry.register(%{stream_name: "my-second-test-stream"}, pid)

      assert :ok =
               ProducerRegistry.update_value(%{stream_name: "my-first-test-stream"}, true, pid)

      assert :ok =
               ProducerRegistry.update_value(%{stream_name: "my-second-test-stream"}, true, pid)

      assert ProducerRegistry.producers_ready?(pid)

      assert :ok = ProducerRegistry.set_ready_override(false, pid)

      refute ProducerRegistry.producers_ready?(pid)

      assert :ok = ProducerRegistry.set_ready_override(nil, pid)

      assert :ok =
               ProducerRegistry.update_value(%{stream_name: "my-first-test-stream"}, true, pid)

      assert :ok =
               ProducerRegistry.update_value(%{stream_name: "my-second-test-stream"}, false, pid)

      refute ProducerRegistry.producers_ready?(pid)

      assert :ok = ProducerRegistry.set_ready_override(true, pid)

      assert ProducerRegistry.producers_ready?(pid)
    end
  end
end

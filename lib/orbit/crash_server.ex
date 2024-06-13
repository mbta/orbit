defmodule Orbit.CrashServer do
  @moduledoc """
  Process that crashes, then stops, for testing Sentry
  """
  use GenServer

  def start_link(_opts) do
    GenServer.start_link(__MODULE__, nil)
  end

  @impl true
  def init(_args) do
    Process.send_after(self(), :crash, 1000)
    {:ok, nil}
  end

  @impl true
  def handle_info(:crash, _state) do
    raise "Test Exception"
  end
end

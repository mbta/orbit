defmodule Orbit.TelemetryTest do
  use ExUnit.Case
  import Test.Support.Helpers

  describe "log/4" do
    test "logs Oban job exceptions" do
      log =
        capture_log do
          Orbit.Telemetry.log(
            [:oban, :job, :exception],
            %{duration: 100},
            %{
              job: %{worker: "TestWorker"},
              reason: "some reason",
              stacktrace: [],
              state: "failure"
            },
            %{}
          )
        end

      assert ["[error] oban_job_exception" <> _ | _] = log
    end
  end
end

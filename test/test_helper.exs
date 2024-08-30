# capture_log hides all logs for passing tests (but not failing tests)
ExUnit.start(capture_log: true)
Ecto.Adapters.SQL.Sandbox.mode(Orbit.Repo, :manual)

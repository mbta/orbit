defmodule Test.Support.Helpers do
  @moduledoc "Test helpers"

  defmacro reassign_env(app, var, value) do
    quote do
      old_value = Application.get_env(unquote(app), unquote(var))
      Application.put_env(unquote(app), unquote(var), unquote(value))

      on_exit(fn ->
        if old_value == nil do
          Application.delete_env(unquote(app), unquote(var))
        else
          Application.put_env(unquote(app), unquote(var), old_value)
        end
      end)
    end
  end

  @doc """
  returns a list of strings with newline at the end trimmed
  """
  defmacro capture_log(level \\ :info, do: expression) do
    quote do
      require Logger
      original_level = Logger.level()
      on_exit(fn -> Logger.configure(level: original_level) end)
      Logger.configure(level: unquote(level))

      {"", lines} =
        ExUnit.CaptureLog.capture_log([colors: [enabled: false]], fn ->
          unquote(expression)
        end)
        |> String.split("\n")
        |> List.pop_at(-1)

      # Reset the log level for the rest of the test.
      # The on_exit above is needed for cleanup in case of a crash,
      # but it runs when the test is done, not when this macro is done
      Logger.configure(level: original_level)

      lines
    end
  end
end

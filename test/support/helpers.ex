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
      {"", lines} =
        ExUnit.CaptureLog.capture_log([level: unquote(level), colors: [enabled: false]], fn ->
          unquote(expression)
        end)
        |> String.split("\n")
        |> List.pop_at(-1)

      lines
    end
  end
end

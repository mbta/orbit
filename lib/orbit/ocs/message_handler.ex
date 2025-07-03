defmodule Orbit.Ocs.MessageHandler do
  @spec receive(String.t(), DateTime.t()) :: {:ok | :error, any}
  def receive(line, current_time) do
    # TODO: Parse OCS messages and dispatch to appropriate state module
    {:ok, {line, current_time}}
  end
end

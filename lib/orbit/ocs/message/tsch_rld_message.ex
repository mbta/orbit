defmodule Orbit.Ocs.Message.TschRldMessage do
  @moduledoc """
  TSCH RLD message type from OCS system
  """
  defstruct [:counter, :timestamp, :transitline]

  @type t :: %__MODULE__{
          counter: integer(),
          timestamp: DateTime.t(),
          transitline: String.t()
        }
end

defmodule Orbit.Ocs.Message.TschOffMessage do
  @moduledoc """
  TSCH OFF message type from OCS system
  """
  defstruct [:counter, :timestamp, :transitline, :trip_uid, :offset]

  @type t :: %__MODULE__{
          counter: integer,
          timestamp: DateTime.t(),
          transitline: String.t(),
          trip_uid: String.t(),
          offset: String.t()
        }
end

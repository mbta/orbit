defmodule OCS.Message.TschConMessage do
  @moduledoc """
  TSCH CON message type from OCS system
  """
  defstruct [
    :counter,
    :timestamp,
    :transitline,
    :trip_uid,
    :consist,
    :consist_internal,
    :train_uid
  ]

  @type t :: %__MODULE__{
          counter: integer,
          timestamp: DateTime.t(),
          transitline: String.t(),
          trip_uid: String.t(),
          consist: [String.t()],
          consist_internal: [String.t()],
          train_uid: String.t()
        }
end

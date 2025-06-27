defmodule Orbit.Ocs.Message.TschTagMessage do
  @moduledoc """
  TSCH TAG message type from OCS system
  """
  alias Orbit.Ocs.Message.TschTagMessage.CarTag
  defstruct [:counter, :timestamp, :transitline, :trip_uid, :train_uid, :consist_tags, :car_tags]

  @type t :: %__MODULE__{
          counter: integer,
          timestamp: DateTime.t(),
          transitline: String.t(),
          trip_uid: String.t(),
          train_uid: String.t(),
          consist_tags: list(String.t()),
          car_tags: list(CarTag.t())
        }
end

defmodule Orbit.Ocs.Message.TschTagMessage.CarTag do
  defstruct [:car_number, :tag]

  @type t :: %__MODULE__{
          car_number: String.t(),
          tag: String.t()
        }
end

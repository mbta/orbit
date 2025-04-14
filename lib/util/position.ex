defmodule Util.Position do
  @type t :: %__MODULE__{
          latitude: float,
          longitude: float
        }
  @derive Jason.Encoder
  @enforce_keys [
    :latitude,
    :longitude
  ]
  defstruct [
    :latitude,
    :longitude
  ]
end

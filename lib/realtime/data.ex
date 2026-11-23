defmodule Realtime.Data do
  # starting with Red line first -- don't create unnecessary structs for other lines
  # @type route_id :: :Blue | :Orange | :Red
  @type route_id :: :Red

  @spec route_id_from_string(String.t() | nil) :: Realtime.Data.route_id() | nil
  def route_id_from_string(nil), do: nil
  # def route_id_from_string("Blue"), do: :Blue
  # def route_id_from_string("Orange"), do: :Orange
  def route_id_from_string("Red"), do: :Red
  def route_id_from_string(_), do: nil

  @spec unprefixed_vehicle_id(String.t()) :: String.t()
  def unprefixed_vehicle_id(vehicle_id) do
    case vehicle_id do
      "O-" <> vehicle_id -> vehicle_id
      "R-" <> vehicle_id -> vehicle_id
      "B-" <> vehicle_id -> vehicle_id
    end
  end
end

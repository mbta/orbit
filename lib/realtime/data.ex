defmodule Realtime.Data do
  @type route_id :: :Blue | :Orange | :Red

  @spec route_id_from_string(String.t() | nil) :: Realtime.Data.route_id() | nil
  def route_id_from_string(nil), do: nil
  def route_id_from_string("Blue"), do: :Blue
  def route_id_from_string("Orange"), do: :Orange
  def route_id_from_string("Red"), do: :Red
  def route_id_from_string(_), do: nil
end

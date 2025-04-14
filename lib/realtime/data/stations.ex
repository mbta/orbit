defmodule Realtime.Data.Stations do
  @spec platforms_to_stations :: %{required(String.t()) => String.t()}
  def platforms_to_stations do
    %{
      "70061" => "place-alfcl",
      "70042" => "place-state",
      "70067" => "place-harsq"
    }
  end
end

defmodule Util.Map do
  @spec has_exactly?(map(), MapSet.t()) :: boolean()
  def has_exactly?(map, keys) do
    map
    |> Map.keys()
    |> MapSet.new()
    |> MapSet.equal?(keys)
  end
end

defmodule Util.Map do
  @spec has_only(map(), MapSet.t()) :: boolean()
  def has_only(map, keys) do
    map
    |> Map.keys()
    |> MapSet.new()
    |> MapSet.equal?(keys)
  end
end

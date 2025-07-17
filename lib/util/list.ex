defmodule Util.List do
  @doc """
  Like Enum.group_by, but returns a list of tuples instead of a map to preserve the order
  Similar to Enum.uniq_by, the order is based on the first appearance

      iex> Util.List.group_by_ordered(~w{ant buffalo cat dingo}, &String.length/1)
      [{3, ["ant", "cat"]}, {7, ["buffalo"]}, {5, ["dingo"]}]
  """
  @spec group_by_ordered([elem], (elem -> key)) :: [{key, elem}] when elem: term(), key: term()
  def group_by_ordered(list, key_fun) do
    list
    |> Enum.with_index()
    |> Enum.group_by(fn {elem, _index} -> key_fun.(elem) end)
    |> Enum.map(fn {key, values} ->
      [{_, index} | _] = values
      values = Enum.map(values, fn {value, _index} -> value end)
      {index, key, values}
    end)
    |> Enum.sort_by(fn {index, _, _} -> index end)
    |> Enum.map(fn {_index, key, values} -> {key, values} end)
  end

  @doc """
  Assumes each key only appears once per input, or else duplicate elements will be dropped.
  Output is unordered.

  Used for diffing.

      iex> Util.List.zip_by([{:a, 1}, {:b, 2}], [{:b, 20}, {:c, 30}], fn {k, _} -> k end) |> Enum.sort()
      [{nil, {:c, 30}}, {{:a, 1}, nil}, {{:b, 2}, {:b, 20}}]
  """
  @spec zip_by([elem], [elem], (elem -> key)) :: [{{elem | nil}, {elem | nil}}]
        when elem: term(), key: term()
  def zip_by(list_a, list_b, key_fun) do
    a_map = Map.new(list_a, fn elem -> {key_fun.(elem), {elem, nil}} end)
    b_map = Map.new(list_b, fn elem -> {key_fun.(elem), {nil, elem}} end)

    merged_map =
      Map.merge(a_map, b_map, fn _k, {a_elem, nil}, {nil, b_elem} -> {a_elem, b_elem} end)

    Map.values(merged_map)
  end
end

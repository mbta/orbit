defmodule Orbit.Ocs.SplunkFormatter do
  @moduledoc """
  This module contains converts parsed OCS messages into key-value
  strings that Splunk recognizes automatically.
  """

  @doc """
  format/1 takes an Orbit.Ocs.Message.t() and returns an IO data
  representation of the format "key1=value1, key2=value2, ..." as
  specified in the [Splunk docs](https://dev.splunk.com/enterprise/docs/developapps/addsupport/logging/loggingbestpractices/)
  """
  @spec format(map()) :: iodata()
  def format(message)

  def format(%struct_name{} = message) do
    message_type = struct_name |> Module.split() |> List.last()

    formatted_type =
      case message_type do
        "Tsch" <> suffix -> "TSCH_" <> String.upcase(suffix)
        _ -> message_type |> String.upcase()
      end

    message |> Map.from_struct() |> Map.put(:type, formatted_type) |> format
  end

  def format(message) do
    ["parsed_ocs_message ", to_key_value_string(message)]
  end

  @spec to_key_value_string(map()) :: iodata()
  defp to_key_value_string(%_{} = map), do: map |> Map.from_struct() |> to_key_value_string

  defp to_key_value_string(map) when is_map(map) do
    map
    |> Enum.sort()
    |> Enum.map(&format_field/1)
    |> Enum.intersperse(", ")
  end

  @spec format_field({atom(), any()}) :: iodata()
  defp format_field({key, %DateTime{} = value}) do
    format_field({key, DateTime.to_iso8601(value)})
  end

  defp format_field({_, value}) when is_map(value), do: to_key_value_string(value)

  defp format_field({key, value}), do: [Atom.to_string(key), ?=, inspect(value)]
end

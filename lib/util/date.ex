defmodule Util.Date do
  @spec valid_iso8601?(String.t()) :: boolean()
  def valid_iso8601?(string) do
    case Date.from_iso8601(string) do
      {:ok, _} -> true
      _ -> false
    end
  end
end

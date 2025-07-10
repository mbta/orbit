defmodule Orbit.Ocs.TransitLine do
  @type t :: :red | :orange | :blue | :green

  defmodule ParseError do
    defexception [:message]
  end

  @spec from_ocs_raw(String.t()) :: t()
  def from_ocs_raw(raw_string) do
    case raw_string do
      "R" ->
        :red

      "O" ->
        :orange

      "B" ->
        :blue

      "G" ->
        :green

      _ ->
        raise ParseError, message: "ocs_unexpected_transitline raw_string=#{inspect(raw_string)}"
    end
  end
end

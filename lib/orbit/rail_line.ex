defmodule Orbit.RailLine do
  use Ecto.Type

  @type t :: :red | :orange | :blue

  @impl true
  def type, do: :string

  @impl true
  def cast(line) when line in [:red, :orange, :blue], do: {:ok, line}
  def cast(_), do: :error

  @impl true
  def load(line) when line in ["red", "orange", "blue"], do: {:ok, String.to_existing_atom(line)}
  def load(_), do: :error

  @impl true
  def dump(line) when line in [:red, :orange, :blue], do: {:ok, Atom.to_string(line)}
  def dump(_), do: :error
end

defmodule Util.AtomType do
  @moduledoc """
  Atom type for Ecto
  """
  use Ecto.Type
  def type, do: :string
  def cast(value) when is_atom(value), do: {:ok, value}
  def cast(_), do: :error
  def load(value), do: {:ok, String.to_existing_atom(value)}
  def dump(value), do: {:ok, Atom.to_string(value)}
end

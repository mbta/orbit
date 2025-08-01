defmodule Orbit.RailLine do
  use Ecto.Type

  # NB preston: we use 'none' instead of db NULL here so upserts continue to work
  # TODO PostgreSQL 15.x: Switch to db NULL
  @type t :: :red | :orange | :blue | :none

  @impl true
  def type, do: :string

  @impl true
  def cast(line) when line in [:red, :orange, :blue, :none], do: {:ok, line}
  def cast(_), do: :error

  @impl true
  def load(line) when line in ["red", "orange", "blue", "none"],
    do: {:ok, String.to_existing_atom(line)}

  def load(_), do: :error

  @impl true
  def dump(line) when line in [:red, :orange, :blue, :none], do: {:ok, Atom.to_string(line)}
  def dump(_), do: :error

  @spec from_ocs_transitline(Orbit.Ocs.TransitLine.t()) :: t()
  def from_ocs_transitline(transitline) do
    case transitline do
      :red -> :red
      :orange -> :orange
      :blue -> :blue
      _ -> :none
    end
  end

  @spec from_route_id(Realtime.Data.route_id()) :: t()
  def from_route_id(:Red), do: :red
end

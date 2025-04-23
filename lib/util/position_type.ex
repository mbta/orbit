defmodule Util.PositionType do
  use Ecto.Type
  def type, do: :map

  def cast(%{latitude: latitude, longitude: longitude}) do
    {:ok, %Util.Position{latitude: latitude, longitude: longitude}}
  end

  def cast(%Util.Position{} = position) do
    {:ok, position}
  end

  def cast(_), do: :error

  def load(%{latitude: latitude, longitude: longitude}) do
    {:ok, %Util.Position{latitude: latitude, longitude: longitude}}
  end

  def load(%{"latitude" => latitude, "longitude" => longitude}) do
    {:ok, %Util.Position{latitude: latitude, longitude: longitude}}
  end

  def dump(%Util.Position{latitude: latitude, longitude: longitude}) do
    {:ok, %{latitude: latitude, longitude: longitude}}
  end

  def dump(_), do: :error
end

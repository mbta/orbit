defmodule Orbit.SignInMethod do
  use Ecto.Type

  @type t :: :manual | :nfc

  @impl true
  def type, do: :string

  @impl true
  def cast(:manual), do: {:ok, :manual}
  def cast(:nfc), do: {:ok, :nfc}
  def cast(_), do: :error

  @impl true
  def load("manual"), do: {:ok, :manual}
  def load("nfc"), do: {:ok, :nfc}
  def load(_), do: :error

  @impl true
  def dump(:manual), do: {:ok, "manual"}
  def dump(:nfc), do: {:ok, "nfc"}
  def dump(_), do: :error
end

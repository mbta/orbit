defmodule Orbit.Authentication.UserPermission do
  use Ecto.Type

  @type t :: :operator_sign_in

  @impl true
  def type, do: :string

  @impl true
  def cast(:operator_sign_in), do: {:ok, :operator_sign_in}
  def cast(_), do: :error

  @impl true
  def load("operator_sign_in"), do: {:ok, :operator_sign_in}
  def load(_), do: :error

  @impl true
  def dump(:operator_sign_in), do: {:ok, "operator_sign_in"}
  def dump(_), do: :error
end

defmodule Realtime.Data.TripDescriptor do
  @moduledoc """
  A subset of the TripDescriptor type, which contains fields used to specify a unique
  trip, which may include a trip_id.

  See https://github.com/google/transit/blob/master/gtfs-realtime/spec/en/reference.md#message-tripdescriptor.

  The spec explains that a trip_id is not always provided, and in that case there are
  other required criteria for identifying a trip. But for now we will only concern
  ourselves with trip_id.
  """
  @type t :: %__MODULE__{
          trip_id: String
        }
  @derive {Jason.Encoder,
           only: [
             :trip_id
           ]}

  defstruct [
    :trip_id
  ]
end

defmodule Realtime.Data.TripDescriptorType do
  alias Realtime.Data.TripDescriptor

  use Ecto.Type
  def type, do: :map

  def cast(%{trip_id: trip_id}) do
    {:ok, %TripDescriptor{trip_id: trip_id}}
  end

  def cast(%TripDescriptor{} = position) do
    {:ok, position}
  end

  def cast(_), do: :error

  def load(%{trip_id: trip_id}) do
    {:ok, %TripDescriptor{trip_id: trip_id}}
  end

  def load(%{"trip_id" => trip_id}) do
    {:ok, %TripDescriptor{trip_id: trip_id}}
  end

  def dump(%TripDescriptor{trip_id: trip_id}) do
    {:ok, %{trip_id: trip_id}}
  end

  def dump(_), do: :error
end

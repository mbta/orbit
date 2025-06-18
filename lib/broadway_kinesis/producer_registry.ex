defmodule BroadwayKinesis.ProducerRegistry do
  use GenServer
  require Logger

  @enforce_keys [:registry, :ready_override]

  defstruct registry: nil, ready_override: nil

  @type t :: %__MODULE__{
          registry: map(),
          ready_override: boolean() | nil
        }

  def start_link(opts \\ []) do
    name = Keyword.get(opts, :name, __MODULE__)
    registry = Keyword.get(opts, :registry, %{})

    GenServer.start_link(__MODULE__, registry, name: name)
  end

  def init(registry) do
    {:ok, %__MODULE__{registry: registry, ready_override: nil}}
  end

  def register(%{stream_name: stream_name}, pid \\ __MODULE__) do
    GenServer.call(pid, {:register, stream_name})
  end

  def unregister(%{stream_name: stream_name}, pid \\ __MODULE__) do
    GenServer.call(pid, {:unregister, stream_name})
  end

  def update_value(arg, value, pid \\ __MODULE__)

  def update_value(%{stream_name: stream_name}, value, pid) when is_boolean(value) do
    GenServer.call(pid, {:update_value, stream_name, value})
  end

  def update_value(_, _, _), do: :error

  def producers_ready?(pid \\ __MODULE__) do
    GenServer.call(pid, :producers_ready)
  end

  def set_ready_override(value, pid \\ __MODULE__) do
    GenServer.call(pid, {:set_override, value})
  end

  def handle_call({:register, stream_name}, _, %__MODULE__{registry: registry} = state) do
    new_registry = Map.put_new(registry, stream_name, false)

    {:reply, :ok, %{state | registry: new_registry}}
  end

  def handle_call(
        {:unregister, stream_name},
        _,
        %__MODULE__{registry: registry} = state
      ) do
    new_registry = Map.drop(registry, [stream_name])

    {:reply, :ok, %{state | registry: new_registry}}
  end

  def handle_call(
        {:update_value, stream_name, value},
        _,
        %__MODULE__{registry: registry} = state
      ) do
    with true <- Map.has_key?(registry, stream_name),
         new_registry <- Map.put(registry, stream_name, value) do
      {:reply, :ok, %{state | registry: new_registry}}
    else
      _ -> {:reply, :ok, state}
    end
  end

  def handle_call({:set_override, value}, _, %__MODULE__{registry: registry}) do
    {:reply, :ok, %__MODULE__{registry: registry, ready_override: value}}
  end

  def handle_call(
        :producers_ready,
        _,
        %__MODULE__{registry: registry, ready_override: nil} = state
      ) do
    ready =
      registry
      |> Map.values()
      |> Enum.all?(fn val -> val end)

    {:reply, ready, state}
  end

  def handle_call(:producers_ready, _, %__MODULE__{ready_override: override_value} = state) do
    {:reply, override_value, state}
  end
end

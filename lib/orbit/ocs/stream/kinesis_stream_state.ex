defmodule Orbit.KinesisStreamState do
  use Ecto.Schema

  import Ecto.Changeset

  @type t :: %__MODULE__{
          stream_name: String.t(),
          resume_position: String.t(),
          last_message_timestamp: DateTime.t()
        }
  schema "kinesis_stream_states" do
    field(:stream_name, :string)
    field(:resume_position, :string)
    field(:last_message_timestamp, :utc_datetime)

    timestamps(type: :utc_datetime)
  end

  def changeset(struct, attrs \\ %{}) do
    struct
    |> cast(
      attrs,
      [
        :stream_name,
        :resume_position,
        :last_message_timestamp
      ]
    )
    |> unique_constraint(:stream_name)
    |> validate_required([
      :stream_name,
      :resume_position,
      :last_message_timestamp
    ])
  end
end

defmodule Orbit.Ocs.KinesisStreamState do
  use Ecto.Schema

  import Ecto.Changeset

  @type t :: %__MODULE__{
          stream_name: String.t(),
          resume_position: String.t()
        }
  schema "kinesis_stream_states" do
    field(:stream_name, :string)
    field(:resume_position, :string)

    timestamps()
  end

  def changeset(struct, attrs \\ %{}) do
    struct
    |> cast(
      attrs,
      [
        :stream_name,
        :resume_position
      ]
    )
    |> unique_constraint(:stream_name)
    |> validate_required([
      :stream_name,
      :resume_position
    ])
  end
end

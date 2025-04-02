defmodule Realtime.RTR do
  @moduledoc """
  for parsing data out of RTR's json feeds
  """

  # TODO: create structs and alias them as necessary

  def parse_data(filedata) do
    json = Jason.decode!(filedata)

    %{
      timestamp: json["header"]["timestamp"],
      entities: json["entity"]
    }
  end
end

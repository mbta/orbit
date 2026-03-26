defmodule Orbit.Oban do
  @spec leader? :: boolean()
  def leader? do
    Oban.Peer.leader?() or Application.get_env(:orbit, :leader?, false)
  end
end

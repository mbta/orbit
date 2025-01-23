defmodule OrbitWeb.MetadataChannelTest do
  use OrbitWeb.ChannelCase

  # also tests user_socket.ex connect/3 logic.
  describe "join" do
    @tag :authenticated
    test "replies to healthy authenticated channel", %{socket: socket} do
      {:ok, reply, _socket} = subscribe_and_join(socket, OrbitWeb.MetadataChannel, "metadata")

      assert reply == %{
               authenticated: true,
               server_release: Application.fetch_env!(:orbit, :release)
             }
    end

    test "replies to join with invalid token" do
      {:ok, socket} =
        Phoenix.ChannelTest.connect(OrbitWeb.UserSocket, %{
          token: "bad token",
          release: Application.fetch_env!(:orbit, :release)
        })

      {:ok, reply, _socket} = subscribe_and_join(socket, OrbitWeb.MetadataChannel, "metadata")
      assert %{authenticated: false} = reply
    end

    # @tag: authenticated makes a socket for us, but this test makes its own socket so we can pass custom params
    # but we still need the authenticated tag so we get a user and token set up for us
    @tag :authenticated
    test "replies to out of date release", %{token: token} do
      server_release = Application.fetch_env!(:orbit, :release)
      client_release = server_release <> "outdated release"

      {:ok, socket} =
        Phoenix.ChannelTest.connect(OrbitWeb.UserSocket, %{
          token: token,
          release: client_release
        })

      {:ok, reply, _socket} = subscribe_and_join(socket, OrbitWeb.MetadataChannel, "metadata")
      assert %{server_release: ^server_release} = reply
    end
  end
end

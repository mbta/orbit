defmodule OrbitWeb.ChannelCase do
  @moduledoc """
  This module defines the test case to be used by
  channel tests.

  Such tests rely on `Phoenix.ChannelTest` and also
  import other functionality to make it easier
  to build common data structures and query the data layer.

  Finally, if the test case interacts with the database,
  we enable the SQL sandbox, so changes done to the database
  are reverted at the end of every test. If you are using
  PostgreSQL, you can even run database tests asynchronously
  by setting `use OrbitWeb.ChannelCase, async: true`, although
  this option is not recommended for other databases.
  """

  @endpoint OrbitWeb.Endpoint

  use ExUnit.CaseTemplate
  require Phoenix.ChannelTest

  using do
    quote do
      import Phoenix.ChannelTest
      import OrbitWeb.ChannelCase

      # The default endpoint for testing
      @endpoint OrbitWeb.Endpoint
    end
  end

  setup tags do
    Orbit.DataCase.setup_sandbox(tags)

    {token, user_id, email} =
      if tags[:authenticated] do
        conn =
          Phoenix.ConnTest.build_conn()
          |> Plug.Test.init_test_session(%{})
          |> OrbitWeb.Auth.Auth.login(
            "user@example.com",
            30,
            tags[:groups] || [],
            "https://localhost/fake/logout"
          )

        token = Guardian.Plug.current_token(conn)
        user = OrbitWeb.Auth.Auth.logged_in_user(conn)

        {token, user.id, user.email}
      else
        {nil, nil, nil}
      end

    {:ok, socket} =
      Phoenix.ChannelTest.connect(OrbitWeb.UserSocket, %{
        token: token,
        release: Application.fetch_env!(:orbit, :release)
      })

    {:ok, socket: socket, token: token, user_id: user_id, email: email}
  end
end

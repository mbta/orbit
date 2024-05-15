defmodule Orbit.RepoTest do
  use ExUnit.Case, async: true

  describe "add_prod_credentials/2" do
    test "adds RDS password to config" do
      mock_auth_token_fn = fn "db_server_hostname", "my_username", 5432, %{} ->
        "temporary_password"
      end

      input_config = [
        hostname: "db_server_hostname",
        username: "my_username",
        password: nil
      ]

      expected_output = [
        hostname: "db_server_hostname",
        username: "my_username",
        password: "temporary_password"
      ]

      assert input_config
             |> Orbit.Repo.add_prod_credentials(mock_auth_token_fn)
             |> Enum.sort() ==
               Enum.sort(expected_output)
    end
  end
end

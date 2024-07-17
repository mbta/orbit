defmodule OrbitWeb.SignInControllerTest do
  use OrbitWeb.ConnCase
  import Orbit.Factory
  alias Orbit.Employee
  alias Orbit.OperatorSignIn
  alias Orbit.Repo

  import Ecto.Query

  describe "submit" do
    @tag :authenticated
    test "records a sign-in in the database", %{conn: conn} do
      insert(:employee, badge_number: "123")

      conn =
        post(conn, ~p"/api/signin", %{
          "signed_in_employee_badge" => "123",
          "signed_in_at" => 1_721_164_459,
          "line" => "blue",
          "method" => "manual"
        })

      assert "OK" = response(conn, 200)

      assert %OperatorSignIn{
               signed_in_employee: %Employee{badge_number: "123"},
               signed_in_at: ~U[2024-07-16 21:14:19Z],
               rail_line: :blue,
               sign_in_method: :manual
             } =
               Repo.one!(
                 from(si in OperatorSignIn,
                   left_join: e in assoc(si, :signed_in_employee),
                   where: e.badge_number == "123",
                   preload: [:signed_in_employee]
                 )
               )
    end

    @tag :authenticated
    test "replies 404 when the employee does not exist", %{conn: conn} do
      assert_error_sent 404, fn ->
        post(conn, ~p"/api/signin", %{
          "signed_in_employee_badge" => "DOES_NOT_EXIST",
          "signed_in_at" => 1_721_164_459,
          "line" => "blue",
          "method" => "manual"
        })
      end
    end
  end
end

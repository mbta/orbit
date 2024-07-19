defmodule OrbitWeb.SignInControllerTest do
  use OrbitWeb.ConnCase
  import Orbit.Factory
  alias Orbit.Employee
  alias Orbit.OperatorSignIn
  alias Orbit.Repo

  import Ecto.Query

  describe "index" do
    @tag :authenticated
    test "responds with sign-ins from today's service date", %{conn: conn} do
      date = DateTime.now!("America/New_York")
      insert(:operator_sign_in, signed_in_at: date)

      conn = get(conn, ~p"/api/signin", %{"line" => "blue"})

      assert %{
               "data" => [
                 %{
                   "rail_line" => "blue",
                   "signed_in_at" => date,
                   "signed_in_by_user" => _user,
                   "signed_in_employee" => _badge
                 }
               ]
             } = json_response(conn, 200)
    end

    @tag :authenticated
    test "includes only today's signins if no date param", %{conn: conn} do
      date = DateTime.add(DateTime.now!("America/New_York"), -1, :day)
      insert(:operator_sign_in, signed_in_at: date)

      conn = get(conn, ~p"/api/signin", %{"line" => "blue"})

      assert %{
               "data" => []
             } = json_response(conn, 200)
    end

    @tag :authenticated
    test "sorted by signed_in_at descending (recent first)", %{conn: conn} do
      insert(:operator_sign_in,
        signed_in_at: DateTime.new!(~D[2024-07-21], ~T[12:00:00], "America/New_York")
      )

      insert(:operator_sign_in,
        signed_in_at: DateTime.new!(~D[2024-07-21], ~T[12:30:00], "America/New_York")
      )

      conn = get(conn, ~p"/api/signin", %{"line" => "blue", "service_date" => "2024-07-21"})

      assert %{
               "data" => [
                 %{
                   "signed_in_at" => "2024-07-21T16:30:00Z"
                 },
                 %{
                   "signed_in_at" => "2024-07-21T16:00:00Z"
                 }
               ]
             } = json_response(conn, 200)
    end

    @tag :authenticated
    test "filters by line param", %{conn: conn} do
      insert(:operator_sign_in, signed_in_at: DateTime.now!("America/New_York"))

      conn = get(conn, ~p"/api/signin", %{"line" => "orange"})

      assert %{
               "data" => []
             } = json_response(conn, 200)
    end
  end

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

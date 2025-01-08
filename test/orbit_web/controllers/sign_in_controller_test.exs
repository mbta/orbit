defmodule OrbitWeb.SignInControllerTest do
  use OrbitWeb.ConnCase
  import Orbit.Factory
  alias Orbit.Employee
  alias Orbit.OperatorSignIn
  alias Orbit.Repo

  import Ecto.Query
  @timezone Application.compile_env!(:orbit, :timezone)

  describe "index" do
    test "unauthenticated requests get a 401", %{conn: conn} do
      conn = get(conn, ~p"/api/signin", %{"line" => "blue"})

      assert "Unauthorized" = text_response(conn, 401)
    end

    @tag :authenticated
    test "responds with sign-ins from today's service date", %{conn: conn} do
      now = DateTime.now!(@timezone)
      insert(:operator_sign_in, signed_in_at: now, radio_number: "22")

      conn = get(conn, ~p"/api/signin", %{"line" => "blue"})

      assert %{
               "data" => [
                 %{
                   "rail_line" => "blue",
                   "radio_number" => "22",
                   "signed_in_at" => _date,
                   "signed_in_by" => _user,
                   "signed_in_employee" => _badge
                 }
               ]
             } = json_response(conn, 200)
    end

    @tag :authenticated
    test "includes a signin from 3:00:00 on the dot", %{conn: conn} do
      insert(:operator_sign_in,
        signed_in_at: DateTime.new!(~D[2024-07-21], ~T[03:00:00], @timezone)
      )

      conn = get(conn, ~p"/api/signin", %{"line" => "blue", "service_date" => "2024-07-21"})

      assert %{
               "data" => [
                 %{
                   "signed_in_at" => "2024-07-21T07:00:00Z"
                 }
               ]
             } = json_response(conn, 200)
    end

    @tag :authenticated
    test "includes only today's signins if no date param", %{conn: conn} do
      insert(:operator_sign_in,
        signed_in_at: DateTime.add(DateTime.now!(@timezone), -1, :day)
      )

      conn = get(conn, ~p"/api/signin", %{"line" => "blue"})

      assert %{
               "data" => []
             } = json_response(conn, 200)
    end

    @tag :authenticated
    test "shows officials' names if available", %{conn: conn} do
      insert(:employee, email: "test@example.com")

      insert(:operator_sign_in,
        signed_in_at: DateTime.new!(~D[2024-07-21], ~T[12:00:00], @timezone),
        signed_in_by_user: build(:user, email: "test@example.com")
      )

      conn = get(conn, ~p"/api/signin", %{"line" => "blue", "service_date" => "2024-07-21"})

      assert %{
               "data" => [
                 %{
                   "signed_in_by" => "Preferredy Person"
                 }
               ]
             } = json_response(conn, 200)
    end

    @tag :authenticated
    test "shows official's email address if name is unavailable", %{conn: conn} do
      insert(:operator_sign_in,
        signed_in_at: DateTime.new!(~D[2024-07-21], ~T[12:00:00], @timezone),
        signed_in_by_user:
          build(:user, %{
            email: "does_not_exist_im_fairly_certain@example.com"
          })
      )

      conn = get(conn, ~p"/api/signin", %{"line" => "blue", "service_date" => "2024-07-21"})

      assert %{
               "data" => [
                 %{
                   "signed_in_by" => "does_not_exist_im_fairly_certain@example.com"
                 }
               ]
             } = json_response(conn, 200)
    end

    @tag :authenticated
    test "sorted by signed_in_at descending (recent first)", %{conn: conn} do
      insert(:operator_sign_in,
        signed_in_at: DateTime.new!(~D[2024-07-21], ~T[12:00:00], @timezone)
      )

      insert(:operator_sign_in,
        signed_in_at: DateTime.new!(~D[2024-07-21], ~T[12:30:00], @timezone)
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
      insert(:operator_sign_in, signed_in_at: DateTime.now!(@timezone))

      conn = get(conn, ~p"/api/signin", %{"line" => "orange"})

      assert %{
               "data" => []
             } = json_response(conn, 200)
    end
  end

  describe "submit" do
    test "unauthenticated requests get a 401", %{conn: conn} do
      conn =
        post(conn, ~p"/api/signin", %{
          "signed_in_employee_badge" => "123",
          "signed_in_at" => 1_721_164_459,
          "line" => "blue",
          "method" => "manual",
          "radio_number" => "22"
        })

      assert "Unauthorized" = text_response(conn, 401)
    end

    @tag :authenticated
    test "records a sign-in in the database", %{conn: conn} do
      insert(:employee, badge_number: "123")

      conn =
        post(conn, ~p"/api/signin", %{
          "signed_in_employee_badge" => "123",
          "signed_in_at" => 1_721_164_459,
          "line" => "blue",
          "method" => "manual",
          "radio_number" => "22",
          "override" => [
            %{
              "expires" => "2024-06-08T00:00:00.000-04:00",
              "rail_line" => "blue",
              "type" => "rail"
            }
          ]
        })

      assert "OK" = response(conn, 200)

      assert %OperatorSignIn{
               signed_in_employee: %Employee{badge_number: "123"},
               signed_in_at: ~U[2024-07-16 21:14:19Z],
               rail_line: :blue,
               sign_in_method: :manual,
               radio_number: "22",
               override: [
                 %{
                   "expires" => "2024-06-08T00:00:00.000-04:00",
                   "rail_line" => "blue",
                   "type" => "rail"
                 }
               ]
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
      conn =
        post(conn, ~p"/api/signin", %{
          "signed_in_employee_badge" => "DOES_NOT_EXIST",
          "signed_in_at" => 1_721_164_459,
          "line" => "blue",
          "method" => "manual",
          "radio_number" => "22"
        })

      assert "Employee not found" = response(conn, 404)
    end

    @tag :authenticated
    test "replies 400 when invalid override (invalid type)", %{conn: conn} do
      conn =
        post(conn, ~p"/api/signin", %{
          "signed_in_employee_badge" => "123",
          "signed_in_at" => 1_721_164_459,
          "line" => "blue",
          "method" => "manual",
          "radio_number" => "22",
          "override" => [
            %{
              "expires" => "2024-06-08T00:00:00.000-04:00",
              "rail_line" => "blue",
              "type" => "NOT_A_REAL_TYPE"
            }
          ]
        })

      assert "Invalid override\n" = response(conn, 400)
    end

    @tag :authenticated
    test "replies 400 when invalid override (extraneous key)", %{conn: conn} do
      conn =
        post(conn, ~p"/api/signin", %{
          "signed_in_employee_badge" => "123",
          "signed_in_at" => 1_721_164_459,
          "line" => "blue",
          "method" => "manual",
          "radio_number" => "22",
          "override" => [
            %{
              "expires" => "2024-06-08T00:00:00.000-04:00",
              "rail_line" => "blue",
              "type" => "rail",
              "SOME_OTHER_KEY" => "SHOULD_NOT_BE_HERE"
            }
          ]
        })

      assert "Invalid override\n" = response(conn, 400)
    end
  end
end

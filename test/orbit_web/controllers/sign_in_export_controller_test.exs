defmodule OrbitWeb.SignInExportControllerTest do
  use OrbitWeb.ConnCase

  import Orbit.Factory

  describe "get/2" do
    test "unauthenticated requests get redirected to login", %{conn: conn} do
      conn = get(conn, ~p"/sign-in-export", %{"date" => "2024-08-28"})

      assert redirected_to(conn) == ~p"/login"
    end

    @tag :authenticated
    test "returns CSV export", %{conn: conn} do
      {:ok, signed_in_at1, _offset} = DateTime.from_iso8601("2024-08-28T17:00:00-04:00")
      {:ok, signed_in_at2, _offset} = DateTime.from_iso8601("2024-08-28T17:10:00-04:00")

      insert(:operator_sign_in, %{signed_in_at: signed_in_at1, sign_in_method: :manual})
      insert(:operator_sign_in, %{signed_in_at: signed_in_at2, sign_in_method: :nfc})

      conn =
        get(conn, ~p"/sign-in-export", %{
          "date" => signed_in_at1 |> DateTime.to_date() |> Date.to_string()
        })

      csv = response(conn, :ok)

      result =
        csv
        |> String.splitter("\n", trim: true)
        |> Stream.map(&"#{&1}\n")
        |> CSV.decode!(headers: true)
        |> Enum.to_list()

      assert [
               %{
                 "Location" => "Orient Heights",
                 "Method" => "manual",
                 "Signer Badge #" => "employee_badge0",
                 "Signer Name" => "Preferredy Person",
                 "Text Version" => "1",
                 "Time" => "2024-08-28T17:00:00-04:00"
               },
               %{
                 "Location" => "Orient Heights",
                 "Method" => "nfc",
                 "Signer Badge #" => "employee_badge1",
                 "Signer Name" => "Preferredy Person",
                 "Text Version" => "1",
                 "Time" => "2024-08-28T17:10:00-04:00"
               }
             ] = result
    end

    @tag :authenticated
    test "returns a bad request response for a malformed date", %{conn: conn} do
      conn = get(conn, ~p"/sign-in-export", %{"date" => "invalid"})

      assert text_response(conn, :bad_request)
    end
  end
end

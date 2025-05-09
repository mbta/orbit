defmodule OrbitWeb.SignInExportControllerTest do
  alias OrbitWeb.SignInExportController
  use OrbitWeb.ConnCase

  import Orbit.Factory

  describe "get_redirect/2" do
    test "unauthenticated requests get redirected to login", %{conn: conn} do
      conn = get(conn, ~p"/sign-in-export", %{"date" => "2024-08-28"})

      assert redirected_to(conn) == ~p"/login"
    end

    @tag :authenticated
    test "redirects to CSV filename path", %{conn: conn} do
      conn = get(conn, ~p"/sign-in-export", %{"date" => "2024-08-28"})

      assert redirected_to(conn) == ~p"/sign-in-export/sign-ins-2024-08-28.csv"
    end
  end

  describe "override_expiration_date/2" do
    test "works" do
      assert "2025-01-08" =
               SignInExportController.override_expiration_date(
                 [
                   %{
                     "type" => "rail",
                     "expires" => "2025-01-08",
                     "rail_line" => "blue"
                   }
                 ],
                 "rail"
               )
    end

    test "works when a type of override is missing" do
      assert "" =
               SignInExportController.override_expiration_date(
                 [
                   %{
                     "type" => "rail",
                     "expires" => "2025-01-08",
                     "rail_line" => "blue"
                   }
                 ],
                 "right_of_way"
               )
    end

    test "works when multiple overrides are present" do
      assert "2025-01-06" =
               SignInExportController.override_expiration_date(
                 [
                   %{
                     "type" => "right_of_way",
                     "expires" => "2025-01-06",
                     "rail_line" => "blue"
                   },
                   %{
                     "type" => "rail",
                     "expires" => "2025-01-08",
                     "rail_line" => "blue"
                   }
                 ],
                 "right_of_way"
               )
    end

    test "missing certification override gets 'missing' in CSV" do
      assert "missing" =
               SignInExportController.override_expiration_date(
                 [
                   %{
                     "type" => "right_of_way",
                     "rail_line" => "blue"
                   },
                   %{
                     "type" => "rail",
                     "expires" => "2025-01-08",
                     "rail_line" => "blue"
                   }
                 ],
                 "right_of_way"
               )
    end
  end

  describe "get/2" do
    test "unauthenticated requests get redirected to login", %{conn: conn} do
      conn = get(conn, ~p"/sign-in-export/sign-ins-2024-08-20.csv")

      assert redirected_to(conn) == ~p"/login"
    end

    @tag :authenticated
    test "returns CSV export", %{conn: conn} do
      {:ok, signed_in_at1, _offset} = DateTime.from_iso8601("2024-08-28T17:00:00-04:00")
      {:ok, signed_in_at2, _offset} = DateTime.from_iso8601("2024-08-28T17:10:00-04:00")

      official_user1 = insert(:user, %{email: "official1@mbta.com"})
      official_user2 = insert(:user, %{email: "official2@mbta.com"})

      insert(:employee, %{
        first_name: "Fake",
        preferred_first: nil,
        last_name: "Official",
        badge_number: "9898",
        email: "official1@mbta.com"
      })

      insert(:operator_sign_in, %{
        signed_in_at: signed_in_at1,
        sign_in_method: :manual,
        signed_in_employee: build(:employee, %{badge_number: "1234"}),
        signed_in_by_user: official_user1,
        override: [
          %{
            "type" => "right_of_way",
            "expires" => "2025-01-08",
            "rail_line" => "none"
          },
          %{"type" => "rail", "expires" => "2025-01-08", "rail_line" => "blue"}
        ]
      })

      insert(:operator_sign_in, %{
        signed_in_at: signed_in_at2,
        sign_in_method: :nfc,
        signed_in_employee: build(:employee, %{badge_number: "5678"}),
        signed_in_by_user: official_user2
      })

      filename =
        "sign-ins-" <> (signed_in_at1 |> DateTime.to_date() |> Date.to_string()) <> ".csv"

      conn =
        get(conn, ~p"/sign-in-export/#{filename}")

      csv = response(conn, :ok)

      result =
        csv
        |> String.splitter("\n", trim: true)
        |> Stream.map(&"#{&1}\n")
        |> CSV.decode!(headers: true)
        |> Enum.to_list()

      assert [
               %{
                 "Time" => "2024-08-28 17:00:00",
                 "Signer Badge #" => "1234",
                 "Signer Name" => "Preferredy Person",
                 "Radio" => "22",
                 "Official Badge #" => "9898",
                 "Official Name" => "Fake Official",
                 "Location" => "Orient Heights",
                 "Method" => "type",
                 "LMS Expiration Overridden" => "yes",
                 "LMS Recertification Expiration Date" => "2025-01-08",
                 "LMS ROW Expiration Date" => "2025-01-08",
                 "Text Version" => "1"
               },
               %{
                 "Time" => "2024-08-28 17:10:00",
                 "Signer Badge #" => "5678",
                 "Signer Name" => "Preferredy Person",
                 "Radio" => "22",
                 "Official Badge #" => "",
                 "Official Name" => "official2@mbta.com",
                 "Location" => "Orient Heights",
                 "Method" => "tap",
                 "LMS Expiration Overridden" => "",
                 "LMS Recertification Expiration Date" => "",
                 "LMS ROW Expiration Date" => "",
                 "Text Version" => "1"
               }
             ] = result
    end

    @tag :authenticated
    test "returns a bad request response for a malformed overall filename", %{conn: conn} do
      filename = "foo.pdf"
      conn = get(conn, ~p"/sign-in-export/#{filename}")

      assert text_response(conn, :bad_request)
    end

    @tag :authenticated
    test "returns a bad request response for a malformed date", %{conn: conn} do
      filename = "sign-ins-bad-date.csv"
      conn = get(conn, ~p"/sign-in-export/#{filename}")

      assert text_response(conn, :bad_request)
    end
  end
end

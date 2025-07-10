defmodule OrbitWeb.OcsControllerTest do
  use OrbitWeb.ConnCase

  import Orbit.Factory

  @moduletag :authenticated
  @moduletag groups: ["orbit-tid-staff"]

  setup do
    insert(:ocs_trip,
      service_date: Util.Time.current_service_date()
    )

    insert(:ocs_trip,
      uid: "yesterday-trip",
      service_date: Date.add(Util.Time.current_service_date(), -1)
    )

    insert(:ocs_train,
      service_date: Util.Time.current_service_date()
    )

    insert(:ocs_train,
      uid: "yesterday-train",
      service_date: Date.add(Util.Time.current_service_date(), -1)
    )

    insert(:ocs_train,
      service_date: Util.Time.current_service_date(),
      uid: "no-cars-uid"
    )

    :ok
  end

  describe "/ocs/trips" do
    test "displays trips from today", %{conn: conn} do
      conn = get(conn, ~p"/ocs/trips")
      assert response = html_response(conn, 200)
      assert response =~ "12345678"
    end

    test "doesn't display trip from yesterday", %{conn: conn} do
      conn = get(conn, ~p"/ocs/trips")
      assert response = html_response(conn, 200)
      assert !(response =~ "yesterday-trip")
    end
  end

  describe "/ocs/trains" do
    test "displays trains from today", %{conn: conn} do
      conn = get(conn, ~p"/ocs/trains")
      assert response = html_response(conn, 200)
      assert response =~ "5484208E"
    end

    test "doesn't display train from yesterday", %{conn: conn} do
      conn = get(conn, ~p"/ocs/trains")
      assert response = html_response(conn, 200)
      assert !(response =~ "yesterday-train")
    end
  end
end

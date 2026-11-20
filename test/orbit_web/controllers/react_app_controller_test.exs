defmodule OrbitWeb.ReactAppControllerTest do
  use OrbitWeb.ConnCase
  import Test.Support.Helpers

  alias Orbit.Employee
  alias Orbit.Repo

  setup do
    Repo.insert!(%Employee{
      first_name: "Arthur",
      preferred_first: "Art",
      last_name: "Read",
      email: "user@example.com",
      badge_number: "123456789"
    })

    reassign_env(:sentry, :dsn, "https://example.com")
    reassign_env(:orbit, :appcues_enabled?, true)
    reassign_env(:orbit, :appcues_id, "APPKEWES")
    reassign_env(:orbit, :full_story_org_id, "RAWR")
  end

  @tag :authenticated
  test "GET /", %{conn: conn} do
    conn = get(conn, ~p"/")
    response = html_response(conn, 200)
    assert response =~ "Orbit"

    # sets metadata
    assert response =~ "<meta name=\"release\" content=\"test\">"
    assert response =~ "<meta name=\"userEmail\" content=\"user@example.com\">"
    assert response =~ "<meta name=\"userName\" content=\"Art Read\">"
    assert response =~ "<script src=\"//fast.appcues.com/APPKEWES.js\">"
    assert response =~ "<meta name=\"sentryDsn\" content=\"https://example.com\">"
    assert response =~ "<meta name=\"environment\" content=\"test\">"
    assert response =~ "<meta name=\"fullStoryOrgId\" content=\"RAWR\">"
  end

  @tag :authenticated
  test "new ladder URLs serve the React app", %{conn: conn} do
    for path <- ["/ladder/blue", "/ladder/orange", "/ladder/red"] do
      assert conn |> get(path) |> html_response(200) =~ "Orbit"
    end
  end
end

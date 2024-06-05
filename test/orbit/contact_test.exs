defmodule Orbit.ContactTest do
  use Orbit.DataCase
  alias Orbit.Contact
  alias Orbit.Repo

  test "can insert a contact into the database" do
    Repo.insert!(%Contact{
      first_name: "Arthur",
      last_name: "Read",
      badge_number: "123456789"
    })
  end
end

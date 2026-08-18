defmodule Mix.Tasks.SeedE2e do
  use Mix.Task
  @requirements ["app.start"]
  @preferred_cli_env :dev

  import Ecto.Query

  alias Orbit.Employee
  alias Orbit.Repo

  @shortdoc "Seed database for end-to-end tests"
  def run(_opts) do
    Logger.configure(level: :notice)

    employee_query =
      from(employee in Employee, where: employee.email == "teste2eemployee@example.com")

    if !Repo.exists?(employee_query) do
      %Employee{
        first_name: "Test",
        preferred_first: "Test",
        middle_initial: "A",
        last_name: "Employee",
        email: "teste2eemployee@example.com",
        badge_number: "TEST_BADGE",
        area: 321
      }
      |> Repo.insert!()
    end
  end
end

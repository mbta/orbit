import { List } from "../../../components/operatorSignIn/list";
import { displayName } from "../../../models/employee";
import { employeeFactory } from "../../helpers/factory";
import { render } from "@testing-library/react";
import { DateTime } from "luxon";
import { MemoryRouter } from "react-router-dom";

const EMPLOYEES = [employeeFactory.build()];
jest.mock("../../../hooks/useEmployees", () => ({
  useEmployees: jest.fn().mockImplementation(() => ({
    status: "ok",
    result: EMPLOYEES,
  })),
  findEmployeeByBadge: jest.fn(() => EMPLOYEES[0]),
  lookupDisplayName: jest.fn(() => displayName(EMPLOYEES[0])),
}));

jest.mock("../../../hooks/useSignIns", () => ({
  useSignins: jest.fn().mockImplementation(() => ({
    status: "ok",
    result: [
      {
        rail_line: "blue",
        signed_in_at: DateTime.fromISO("2024-07-22T12:45:52.000-04:00", {
          zone: "America/New_York",
        }),
        signed_in_by_user: "user@example.com",
        signed_in_employee: EMPLOYEES[0].badge,
      },
    ],
  })),
}));

describe("List", () => {
  test("shows a sign-in", () => {
    const view = render(
      <MemoryRouter>
        <List line="blue" />
      </MemoryRouter>,
    );
    expect(view.getByText("12:45PM")).toBeInTheDocument();
    expect(
      view.getByText(`${EMPLOYEES[0].first_name} ${EMPLOYEES[0].last_name}`),
    ).toBeInTheDocument();
    // NB: the email below contains a soft hyphen character
    expect(view.getByText("user­@example.com")).toBeInTheDocument();
  });
});

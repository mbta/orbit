import { Operators } from "../../components/operators";
import { RequireGroup } from "../../components/requireGroups";
import { MetaDataKey } from "../../util/metadata";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router";

jest.mock("../../util/metadata", () => ({
  getMetaContent: jest
    .fn()
    .mockImplementation((field: MetaDataKey): string | null => {
      if (field === "userGroups") {
        return "orbit-bl-ffd";
      }
      return null;
    }),
}));

describe("RequireGroup", () => {
  test("displays child (Operators) if user has required permission group", () => {
    const view = render(
      <MemoryRouter>
        <RequireGroup group="orbit-bl-ffd">
          <Operators />
        </RequireGroup>
      </MemoryRouter>,
    );

    expect(view.getByText("Search and sign in operators")).toBeInTheDocument();
    expect(view.getByText("Sign In Operator")).toBeInTheDocument();
    expect(view.getByText("Export sign in records")).toBeInTheDocument();
    expect(view.getByText("Today's sign ins")).toBeInTheDocument();
  });

  test("displays NoPermissions if user doesn't have required permission group", () => {
    const view = render(
      <MemoryRouter>
        <RequireGroup group="">
          <Operators />
        </RequireGroup>
      </MemoryRouter>,
    );

    expect(
      view.getByText(
        "Email your supervisor if you think you should have permission to use this page.",
      ),
    ).toBeInTheDocument();
    expect(view.getByText("Retry")).toBeInTheDocument();
  });
});

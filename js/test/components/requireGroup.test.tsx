import { Operators } from "../../components/operators";
import { RequireGroup } from "../../components/requireGroup";
import { ORBIT_BL_FFD, ORBIT_RL_TRAINSTARTERS } from "../../groups";
import { MetaDataKey } from "../../util/metadata";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router";

jest.mock("../../util/metadata", () => ({
  getMetaContent: jest
    .fn()
    .mockImplementation((field: MetaDataKey): string | null => {
      if (field === "userGroups") {
        return ORBIT_BL_FFD;
      }
      return null;
    }),
}));

describe("RequireGroup", () => {
  test("displays child (Operators) if user has required permission group", () => {
    const view = render(
      <MemoryRouter>
        <RequireGroup oneOf={[ORBIT_BL_FFD]}>
          <Operators />
        </RequireGroup>
      </MemoryRouter>,
    );

    expect(view.getByText("Search and sign in operators")).toBeInTheDocument();
  });

  test("displays child (Operators) with multiple possible groups", () => {
    const view = render(
      <MemoryRouter>
        <RequireGroup oneOf={[ORBIT_BL_FFD, ORBIT_RL_TRAINSTARTERS]}>
          <Operators />
        </RequireGroup>
      </MemoryRouter>,
    );

    expect(view.getByText("Search and sign in operators")).toBeInTheDocument();
  });

  test("displays NoPermissions if user doesn't have required permission group", () => {
    const view = render(
      <MemoryRouter>
        <RequireGroup oneOf={["nonexistent-group"]}>
          <Operators />
        </RequireGroup>
      </MemoryRouter>,
    );

    expect(
      view.getByText(
        "Email your supervisor if you think you should have permission to use this page.",
      ),
    ).toBeInTheDocument();
    expect(view.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });
});

import { HelpMenu, Menu } from "../../components/menus";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

describe("menu", () => {
  test("has links", () => {
    const view = render(
      <MemoryRouter>
        <Menu />
      </MemoryRouter>,
    );
    expect(view.getAllByRole("button")).toHaveLength(4);
    expect(view.getByRole("button", { name: "Help" })).toBeInTheDocument();
    expect(
      view.getByRole("button", { name: "Send Feedback" }),
    ).toBeInTheDocument();
    expect(
      view.getByRole("button", { name: "Manage User Roles" }),
    ).toBeInTheDocument();
    expect(view.getByRole("button", { name: "Logout" })).toBeInTheDocument();
  });
});

describe("help menu", () => {
  test("has links", () => {
    const view = render(
      <MemoryRouter>
        <HelpMenu />
      </MemoryRouter>,
    );
    expect(view.getAllByRole("button")).toHaveLength(2);
    expect(
      view.getByRole("button", { name: "User Guide" }),
    ).toBeInTheDocument();
    expect(
      view.getByRole("button", { name: "Training Materials" }),
    ).toBeInTheDocument();
  });
});

import { Home } from "../../components/home";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

describe("home", () => {
  test("can open modal", async () => {
    const view = render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );
    expect(view.queryByText(/fit for duty/i)).not.toBeInTheDocument();
    await userEvent.click(
      view.getByRole("button", { name: "Sign In Operator" }),
    );
    expect(view.getByText(/fit for duty/i)).toBeInTheDocument();
  });
});

import { Home } from "../../components/home";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

describe("home", () => {
  test("loads orbit placeholder", () => {
    const view = render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );
    expect(view.getAllByText(/sign.?in/i)).not.toBeEmpty();
  });
});

import { Home } from "../../components/home";
import { render } from "@testing-library/react";

describe("home", () => {
  test("loads orbit placeholder", () => {
    const view = render(<Home />);
    expect(view.getByText(/🪐/)).toBeInTheDocument();
  });
});

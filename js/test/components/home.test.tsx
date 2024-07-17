import { Home } from "../../components/home";
import { render } from "@testing-library/react";

jest.mock("../../hooks/useEmployees", () => ({
  useEmployees: jest.fn().mockReturnValue({ status: "loading" }),
}));

describe("home", () => {
  test("loads orbit placeholder", () => {
    const view = render(<Home />);
    expect(view.getByText(/🪐/)).toBeInTheDocument();
  });
});

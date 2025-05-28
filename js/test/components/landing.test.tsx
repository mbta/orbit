import { LandingPage } from "../../components/landingPage";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router";

describe("Landing Page", () => {
  test("renders", () => {
    const view = render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );
    expect(
      view.getByText("Which line would you like to view?"),
    ).toBeInTheDocument();
    expect(view.getByText("Red Line Train Locations")).toBeInTheDocument();
    expect(
      view.getByText("Blue Line Fit-For-Duty Sign In"),
    ).toBeInTheDocument();
  });
});

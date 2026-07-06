import { Banner } from "../../components/banner";
import { useDataWarnings } from "../../contexts/dataWarningsContext";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router";

jest.mock("../../contexts/dataWarningsContext", () => ({
  __esModule: true,
  useDataWarnings: jest.fn(),
}));

describe("Landing Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders when warning is present", () => {
    (useDataWarnings as jest.Mock).mockImplementation(
      jest.fn(() => [new Set(["vehicle_positions_stale"]), () => {}, () => {}]),
    );

    const view = render(
      <MemoryRouter>
        <Banner />
      </MemoryRouter>,
    );
    expect(view.getByText("Data Issue")).toBeInTheDocument();
    expect(view.getByText("Train positions out of date")).toBeInTheDocument();
  });

  test("is hidden when no warning is present", () => {
    (useDataWarnings as jest.Mock).mockImplementation(
      jest.fn(() => [new Set(), () => {}, () => {}]),
    );

    const view = render(
      <MemoryRouter>
        <Banner />
      </MemoryRouter>,
    );
    expect(view.queryByText("Data Issue")).not.toBeInTheDocument();
    expect(
      view.queryByText("Train positions out of date"),
    ).not.toBeInTheDocument();
  });
});

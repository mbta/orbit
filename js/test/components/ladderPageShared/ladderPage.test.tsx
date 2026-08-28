import { Ladders } from "../../../components/ladderPageShared/ladder";
import { LadderPage } from "../../../components/ladderPageShared/ladderPage";
import { ORBIT_RL_TRAINSTARTERS } from "../../../groups";
import { useVehicles } from "../../../hooks/useVehicles";
import { StopStatus } from "../../../models/vehiclePosition";
import { trackSideBarOpened } from "../../../telemetry/trackingEvents";
import { getMetaContent, MetaDataKey } from "../../../util/metadata";
import {
  tripUpdateFactory,
  vehicleFactory,
  vehiclePositionFactory,
} from "../../helpers/factory";
import { act, render, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("../../../hooks/useVehicles", () => ({
  __esModule: true,
  useVehicles: jest.fn(),
}));
const mockUseVehicles = useVehicles as jest.MockedFunction<typeof useVehicles>;

jest.mock("../../../util/metadata", () => ({
  getMetaContent: jest.fn(),
}));
const mockGetMetaContent = getMetaContent as jest.MockedFunction<
  typeof getMetaContent
>;

jest.mock("../../../telemetry/trackingEvents", () => ({
  trackSideBarOpened: jest.fn(),
}));
const mockTrackSideBarOpened = trackSideBarOpened as jest.MockedFunction<
  typeof trackSideBarOpened
>;

describe("LadderPage SideBar", () => {
  beforeEach(() => {
    mockUseVehicles.mockReturnValue([
      vehicleFactory.build(),
      vehicleFactory.build({
        vehiclePosition: vehiclePositionFactory.build({
          cars: ["1514", "1500", "1716", "1717", "1757", "1758"],
          directionId: 1,
          heading: 330,
          label: "1514",
          position: {
            latitude: 42.37468909487066,
            longitude: -71.11860365011671,
          },
          routeId: "Red",
          revenue: true,
          stationId: "place-harsq",
          stopId: "70068",
          stopStatus: StopStatus.InTransitTo,
          vehicleId: "R-BBBBBB",
          tripId: "68077972",
        }),
      }),
    ]);
    mockTrackSideBarOpened.mockClear();
  });

  describe("with red line sidebar permissions", () => {
    beforeAll(() => {
      mockGetMetaContent.mockImplementation((field: MetaDataKey) => {
        if (field == "userGroups") {
          return ORBIT_RL_TRAINSTARTERS;
        }
        return null;
      });
    });

    test("clicking on train pill opens sidebar", async () => {
      const user = userEvent.setup();
      const view = render(<LadderPage routeId="Red" />);
      await user.click(view.getByText("1877"));
      expect(view.getByRole("button", { name: "Close" })).toBeInTheDocument();
      expect(mockTrackSideBarOpened).toHaveBeenCalledWith({
        vehicle: vehicleFactory.build(),
      });
    });

    test("15xx RL train labels are remapped", () => {
      const view = render(<LadderPage routeId="Red" />);
      expect(view.getByText("2514")).toBeInTheDocument();
    });

    test("can close SideBar with close button", async () => {
      const user = userEvent.setup();
      const view = render(<LadderPage routeId="Red" />);
      await user.click(view.getByText("1877"));
      await user.click(view.getByRole("button", { name: "Close" }));
      expect(
        view.queryByRole("button", { name: "Close" }),
      ).not.toBeInTheDocument();
    });

    test("can close SideBar with escape key", async () => {
      const user = userEvent.setup();
      const view = render(<LadderPage routeId="Red" />);
      await user.click(view.getByText("1877"));
      await userEvent.keyboard("{Escape}");
      expect(
        view.queryByRole("button", { name: "Close" }),
      ).not.toBeInTheDocument();
    });

    test("searches by 3-digit car number and blurs the search input", async () => {
      const user = userEvent.setup();
      const view = render(<LadderPage routeId="Red" />);

      const input = view.getByPlaceholderText("Car #");
      await user.click(input);
      await user.type(input, "876{Enter}");

      expect(view.getByRole("button", { name: "Close" })).toBeInTheDocument();
      expect(input).not.toHaveFocus();
    });

    test("searches with icon click and clear button closes sidebar", async () => {
      const user = userEvent.setup();
      const view = render(<LadderPage routeId="Red" />);

      const input = view.getByPlaceholderText("Car #");
      await user.type(input, "1876");
      await user.click(view.getByRole("button", { name: "Search for car" }));

      expect(view.getByRole("button", { name: "Close" })).toBeInTheDocument();
      expect(view.getByText("1876")).toHaveClass(
        "light:bg-slate-700 light:text-glides-gray-200 dark:bg-slate-200 dark:text-slate-700",
      );

      await user.click(view.getByRole("button", { name: "×" }));
      expect(input).toHaveValue("");
      expect(
        view.queryByRole("button", { name: "Close" }),
      ).not.toBeInTheDocument();
    });

    test("clicking a different train clears the search query", async () => {
      mockUseVehicles.mockReturnValue([
        vehicleFactory.build({
          vehiclePosition: vehiclePositionFactory.build({
            label: "1877",
            cars: ["1877", "1876", "1807", "1806", "1815", "1814"],
            vehicleId: "R-5482CAAA",
          }),
        }),
        vehicleFactory.build({
          vehiclePosition: vehiclePositionFactory.build({
            label: "1888",
            cars: ["1888", "1889", "1890", "1891"],
            vehicleId: "R-5482CAAB",
          }),
        }),
      ]);

      const user = userEvent.setup();
      const view = render(<LadderPage routeId="Red" />);

      const input = view.getByPlaceholderText("Car #");
      await user.type(input, "1877{Enter}");
      expect(input).toHaveValue("1877");

      await user.click(view.getByRole("button", { name: "A 1888" }));
      expect(input).toHaveValue("");
    });

    test("clicking the same train keeps query and searched-car highlight", async () => {
      const user = userEvent.setup();
      const view = render(<LadderPage routeId="Red" />);

      const input = view.getByPlaceholderText("Car #");
      await user.type(input, "1876{Enter}");
      expect(input).toHaveValue("1876");
      expect(view.getByText("1876")).toHaveClass(
        "light:bg-slate-700 light:text-glides-gray-200 dark:bg-slate-200 dark:text-slate-700",
      );

      await user.click(view.getByRole("button", { name: "A 1877" }));
      expect(input).toHaveValue("1876");
      expect(view.getByText("1876")).toHaveClass(
        "light:bg-slate-700 light:text-glides-gray-200 dark:bg-slate-200 dark:text-slate-700",
      );
    });

    test("backspacing from a successful search to unsuccessful closes sidebar", async () => {
      const user = userEvent.setup();
      const view = render(<LadderPage routeId="Red" />);

      const input = view.getByPlaceholderText("Car #");
      await user.type(input, "1876{Enter}");
      expect(view.getByRole("button", { name: "Close" })).toBeInTheDocument();

      await user.click(input);
      await user.type(input, "{backspace}");

      expect(
        view.queryByRole("button", { name: "Close" }),
      ).not.toBeInTheDocument();
    });

    test("removing a leading 1 from a successful search resets to unsubmitted state", async () => {
      const user = userEvent.setup();
      const view = render(<LadderPage routeId="Red" />);

      const input = view.getByPlaceholderText("Car #") as HTMLInputElement;
      await user.type(input, "1876{Enter}");
      expect(view.getByRole("button", { name: "Close" })).toBeInTheDocument();

      await user.click(input);
      input.setSelectionRange(0, 1);
      await user.keyboard("{Delete}");

      expect(input).toHaveValue("876");
      expect(
        view.queryByRole("button", { name: "Close" }),
      ).not.toBeInTheDocument();
      expect(
        view.queryByText('⚠️ No search results for "876"'),
      ).not.toBeInTheDocument();
    });

    test("no-result search clears searched-car highlight", async () => {
      const user = userEvent.setup();
      const view = render(<LadderPage routeId="Red" />);

      const input = view.getByPlaceholderText("Car #");
      await user.type(input, "1876{Enter}");
      expect(view.getByText("1876")).toHaveClass(
        "light:bg-slate-700 light:text-glides-gray-200 dark:bg-slate-200 dark:text-slate-700",
      );

      await user.clear(input);
      await user.type(input, "9999{Enter}");

      expect(
        view.getByText('⚠️ No search results for "9999"'),
      ).toBeInTheDocument();
      expect(
        view.queryByRole("button", { name: "Close" }),
      ).not.toBeInTheDocument();
    });

    test("searches 1520 and 2520 as the same car", async () => {
      mockUseVehicles.mockReturnValue([
        vehicleFactory.build({
          vehiclePosition: vehiclePositionFactory.build({
            label: "1520",
            cars: ["1520", "1521", "1522", "1523"],
            directionId: 0,
          }),
        }),
      ]);

      const user = userEvent.setup();
      const view = render(<LadderPage routeId="Red" />);

      const input = view.getByPlaceholderText("Car #");
      await user.type(input, "2520{Enter}");
      expect(view.getByRole("button", { name: "Close" })).toBeInTheDocument();
      const firstHighlighted2520 = view
        .getAllByText("2520")
        .find((element) =>
          element.className.includes(
            "light:bg-slate-700 light:text-glides-gray-200 dark:bg-slate-200 dark:text-slate-700",
          ),
        );
      expect(firstHighlighted2520).toBeDefined();

      await user.click(view.getByRole("button", { name: "Close" }));
      expect(input).toHaveValue("");

      await user.type(input, "1520{Enter}");
      expect(view.getByRole("button", { name: "Close" })).toBeInTheDocument();
      const secondHighlighted2520 = view
        .getAllByText("2520")
        .find((element) =>
          element.className.includes(
            "light:bg-slate-700 light:text-glides-gray-200 dark:bg-slate-200 dark:text-slate-700",
          ),
        );
      expect(secondHighlighted2520).toBeDefined();
    });

    test("shows and clears no-results search error", async () => {
      const user = userEvent.setup();
      const view = render(<LadderPage routeId="Red" />);

      const input = view.getByPlaceholderText("Car #");
      await user.type(input, "ab{Enter}");

      expect(
        view.getByText('⚠️ No search results for "ab"'),
      ).toBeInTheDocument();

      await user.type(input, "1");
      expect(
        view.queryByText('⚠️ No search results for "ab"'),
      ).not.toBeInTheDocument();

      await user.click(view.getByText("Davis"));
      await user.click(input);
      expect(
        view.queryByText('⚠️ No search results for "ab"'),
      ).not.toBeInTheDocument();

      await user.type(input, "12{Enter}");
      expect(
        view.getByText('⚠️ No search results for "12"'),
      ).toBeInTheDocument();

      await user.click(view.getByRole("button", { name: "×" }));
      expect(input).toHaveValue("");
      expect(
        view.queryByText('⚠️ No search results for "12"'),
      ).not.toBeInTheDocument();
    });

    test("closing sidebar by background click resets the search bar", async () => {
      const user = userEvent.setup();
      const view = render(<LadderPage routeId="Red" />);

      const input = view.getByPlaceholderText("Car #");
      await user.type(input, "1877{Enter}");
      expect(view.getByRole("button", { name: "Close" })).toBeInTheDocument();
      expect(input).toHaveValue("1877");

      await user.click(view.getByText("Davis"));
      expect(
        view.queryByRole("button", { name: "Close" }),
      ).not.toBeInTheDocument();
      expect(input).toHaveValue("");
    });
  });

  describe("without red line sidebar permissions", () => {
    test("clicking on train pill does not open sidebar", async () => {
      mockGetMetaContent.mockReturnValue("");
      const user = userEvent.setup();
      const view = render(<LadderPage routeId="Red" />);
      await user.click(view.getByText("1877"));
      expect(
        view.queryByRole("button", { name: "Close" }),
      ).not.toBeInTheDocument();
    });
  });
});

describe("LadderPage BranchPicker visibility", () => {
  beforeEach(() => {
    mockUseVehicles.mockReturnValue([vehicleFactory.build()]);
    mockGetMetaContent.mockReturnValue(null);
  });

  test("BranchPicker is hidden by default (no overflow in jsdom)", () => {
    const view = render(<LadderPage routeId="Red" />);
    // Station names are buttons rendered by rail-tech-ui, so scope to the
    // BranchPicker container rather than matching by branch name alone
    expect(view.queryByTestId("branch-picker")).not.toBeInTheDocument();
  });

  test("BranchPicker is shown when scroll container overflows horizontally", () => {
    const { getByTestId } = render(<LadderPage routeId="Red" />);

    const scrollContainer = getByTestId("scroll-container");

    // eslint-disable-next-line better-mutation/no-mutating-functions
    Object.defineProperty(scrollContainer, "scrollWidth", {
      get: () => 1000,
      configurable: true,
    });

    act(() => {
      window.dispatchEvent(new Event("resize"));
    });

    const branchPicker = getByTestId("branch-picker");
    expect(
      within(branchPicker).getByRole("button", { name: "Alewife" }),
    ).toBeInTheDocument();
    expect(
      within(branchPicker).getByRole("button", { name: "Ashmont" }),
    ).toBeInTheDocument();
    expect(
      within(branchPicker).getByRole("button", { name: "Braintree" }),
    ).toBeInTheDocument();
  });

  test("BranchPicker is hidden again when overflow is resolved", () => {
    const { getByTestId, queryByTestId } = render(<LadderPage routeId="Red" />);

    const scrollContainer = getByTestId("scroll-container");

    // first simulate overflow
    // eslint-disable-next-line better-mutation/no-mutating-functions
    Object.defineProperty(scrollContainer, "scrollWidth", {
      get: () => 1000,
      configurable: true,
    });
    act(() => {
      window.dispatchEvent(new Event("resize"));
    });

    // then resolve overflow
    // eslint-disable-next-line better-mutation/no-mutating-functions
    Object.defineProperty(scrollContainer, "scrollWidth", {
      get: () => 0,
      configurable: true,
    });
    act(() => {
      window.dispatchEvent(new Event("resize"));
    });

    expect(queryByTestId("branch-picker")).not.toBeInTheDocument();
  });
});

// The following Ladder suite moved here from the deleted
// js/test/components/ladderPageShared/ladder.test.tsx (removed by main). The
// LadderPage is now backed by rail-tech-ui's Ladder, so these render the
// `Ladders` component directly to keep covering which trains render, pill
// colors, and clicking a train to select its branch.
// Vehicle IDs are used as React keys, so make sure each mock vehicle has a
// unique id or render will warn
const nextVehicleId = (() => {
  let mockVehicleId = 0;
  return () => `mock-id-${mockVehicleId++}`;
})();

const pillForLabel = (
  view: ReturnType<typeof render>,
  label: string,
): HTMLElement => {
  // closest() is used to reach the pill container (a plain div with no
  // semantic role) from the rendered car id inside it
  // eslint-disable-next-line testing-library/no-node-access
  const pill = view.getByText(label).closest(".rounded-4xl");
  expect(pill).not.toBeNull();
  return pill as HTMLElement;
};

describe("Ladder", () => {
  test("shows station names", () => {
    mockUseVehicles.mockReturnValue([]);

    const view = render(
      <Ladders
        routeId="Red"
        setSideBarSelection={jest.fn()}
        setBranchPickerSelection={jest.fn()}
        sideBarSelection={null}
        vehicles={useVehicles() ?? []}
      />,
    );

    expect(view.getByText("Alewife")).toBeInTheDocument();
    expect(view.getByText("Ashmont")).toBeInTheDocument();
    expect(view.getByText("Braintree")).toBeInTheDocument();
  });

  test("shows valid vehicles on the ladder", () => {
    mockUseVehicles.mockReturnValue([
      vehicleFactory.build({
        vehiclePosition: vehiclePositionFactory.build(),
      }),
      vehicleFactory.build({
        vehiclePosition: vehiclePositionFactory.build({
          vehicleId: nextVehicleId(),
          directionId: 0,
          label: "1888",
          cars: ["1888", "1876", "1807", "1806", "1815", "1814"],
          position: { latitude: 42.32272, longitude: -71.052925 },
          stopId: "70085",
          stopStatus: StopStatus.StoppedAt,
        }),
      }),
      vehicleFactory.build({
        vehiclePosition: vehiclePositionFactory.build({
          vehicleId: nextVehicleId(),
          label: "1889",
          cars: ["1889", "1876", "1807", "1806", "1815", "1814"],
          stationId: "place-davis",
          stopId: "70064",
          position: { latitude: 42.39674, longitude: -71.121815 },
          stopStatus: StopStatus.StoppedAt,
        }),
      }),
      vehicleFactory.build({
        vehiclePosition: vehiclePositionFactory.build({
          vehicleId: nextVehicleId(),
          label: "1999",
          cars: ["1999", "1876", "1807", "1806", "1815", "1814"],
          position: null,
          stationId: null,
          stopId: null,
        }),
      }),
    ]);

    const view = render(
      <Ladders
        routeId="Red"
        setSideBarSelection={jest.fn()}
        setBranchPickerSelection={jest.fn()}
        sideBarSelection={null}
        vehicles={useVehicles() ?? []}
      />,
    );

    expect(view.getByText("1877")).toBeInTheDocument();
    expect(view.getByText("1888")).toBeInTheDocument();
    expect(view.getByText("1889")).toBeInTheDocument();
    expect(view.queryByText("1999")).not.toBeInTheDocument();
  });

  describe("pill colors", () => {
    test("renders gray pills for non-revenue trains", () => {
      mockUseVehicles.mockReturnValue([
        vehicleFactory.build({
          vehiclePosition: vehiclePositionFactory.build({
            vehicleId: nextVehicleId(),
            label: "1888",
            cars: ["1888", "1876", "1807", "1806", "1815", "1814"],
            stationId: "place-davis",
            stopId: "70064",
            tripId: "11111",
            revenue: false,
          }),
          tripUpdate: tripUpdateFactory.build({
            routePatternId: "Red-1-0",
          }),
        }),
        vehicleFactory.build({
          vehiclePosition: vehiclePositionFactory.build({
            vehicleId: nextVehicleId(),
            label: "1889",
            cars: ["1889", "1876", "1807", "1806", "1815", "1814"],
            stationId: "place-davis",
            stopId: "70064",
            tripId: "22222",
            revenue: false,
          }),
          tripUpdate: tripUpdateFactory.build({
            routePatternId: "Red-3-0",
          }),
        }),
      ]);

      const view = render(
        <Ladders
          routeId="Red"
          setSideBarSelection={jest.fn()}
          setBranchPickerSelection={jest.fn()}
          sideBarSelection={null}
          vehicles={useVehicles() ?? []}
        />,
      );

      for (const label of ["1888", "1889"]) {
        expect(pillForLabel(view, label)).toHaveClass(
          "dark:border-glides-gray-400",
        );
        const pill = pillForLabel(view, label);
        expect(
          within(pill).getByRole("img", { name: "Non-revenue" }),
        ).toBeInTheDocument();
      }
    });

    test("renders revenue trains with pill color based on route pattern", () => {
      mockUseVehicles.mockReturnValue([
        vehicleFactory.build({
          vehiclePosition: vehiclePositionFactory.build({
            vehicleId: nextVehicleId(),
            label: "1888",
            cars: ["1888", "1876", "1807", "1806", "1815", "1814"],
            stationId: "place-davis",
            stopId: "70064",
            tripId: "11111",
          }),
          tripUpdate: tripUpdateFactory.build({
            routePatternId: "Red-1-0",
          }),
        }),
        vehicleFactory.build({
          vehiclePosition: vehiclePositionFactory.build({
            vehicleId: nextVehicleId(),
            label: "1889",
            cars: ["1889", "1876", "1807", "1806", "1815", "1814"],
            stationId: "place-davis",
            stopId: "70064",
            tripId: "22222",
          }),
          tripUpdate: tripUpdateFactory.build({
            routePatternId: "Red-3-0",
          }),
        }),
      ]);

      const view = render(
        <Ladders
          routeId="Red"
          setSideBarSelection={jest.fn()}
          setBranchPickerSelection={jest.fn()}
          sideBarSelection={null}
          vehicles={useVehicles() ?? []}
        />,
      );

      expect(pillForLabel(view, "1888")).toHaveClass(
        "branch-color-heavy-rail-ashmont",
      );
      expect(pillForLabel(view, "1889")).toHaveClass(
        "branch-color-heavy-rail-braintree",
      );
    });

    test("renders default pill color when route pattern is not provided", () => {
      mockUseVehicles.mockReturnValue([
        // Ashmont portion of ladder
        vehicleFactory.build({
          vehiclePosition: vehiclePositionFactory.build({
            vehicleId: nextVehicleId(),
            label: "1888",
            cars: ["1888", "1876", "1807", "1806", "1815", "1814"],
            stationId: "place-jfk",
            stopId: "70085",
            tripId: null,
          }),
          tripUpdate: undefined,
        }),
        vehicleFactory.build({
          vehiclePosition: vehiclePositionFactory.build({
            vehicleId: nextVehicleId(),
            label: "1889",
            cars: ["1889", "1876", "1807", "1806", "1815", "1814"],
            stationId: "place-jfk",
            stopId: "70086",
            tripId: null,
          }),
          tripUpdate: undefined,
        }),
        // Braintree portion of ladder
        vehicleFactory.build({
          vehiclePosition: vehiclePositionFactory.build({
            vehicleId: nextVehicleId(),
            label: "1890",
            cars: ["1890", "1876", "1807", "1806", "1815", "1814"],
            stationId: "place-jfk",
            stopId: "70095",
            tripId: null,
          }),
          tripUpdate: undefined,
        }),
        vehicleFactory.build({
          vehiclePosition: vehiclePositionFactory.build({
            vehicleId: nextVehicleId(),
            label: "1891",
            cars: ["1891", "1876", "1807", "1806", "1815", "1814"],
            stationId: "place-jfk",
            stopId: "70096",
            tripId: null,
          }),
          tripUpdate: undefined,
        }),
        // Alewife trunk portion of ladder
        vehicleFactory.build({
          vehiclePosition: vehiclePositionFactory.build({
            vehicleId: nextVehicleId(),
            label: "1892",
            cars: ["1892", "1876", "1807", "1806", "1815", "1814"],
            stationId: "place-davis",
            stopId: "70063",
            tripId: null,
          }),
          tripUpdate: undefined,
        }),
        vehicleFactory.build({
          vehiclePosition: vehiclePositionFactory.build({
            vehicleId: nextVehicleId(),
            label: "1893",
            cars: ["1893", "1876", "1807", "1806", "1815", "1814"],
            stationId: "place-davis",
            stopId: "70064",
            tripId: null,
          }),
          tripUpdate: undefined,
        }),
      ]);

      const view = render(
        <Ladders
          routeId="Red"
          setSideBarSelection={jest.fn()}
          setBranchPickerSelection={jest.fn()}
          sideBarSelection={null}
          vehicles={useVehicles() ?? []}
        />,
      );

      for (const label of ["1888", "1889", "1890", "1891", "1892", "1893"]) {
        expect(pillForLabel(view, label)).toHaveClass(
          "branch-color-heavy-rail-braintree",
        );
      }
    });
  });

  describe("pill highlight", () => {
    test("when the sidebar is open from a search, the searched train is highlighted", () => {
      mockUseVehicles.mockReturnValue([
        vehicleFactory.build({
          vehiclePosition: vehiclePositionFactory.build({
            vehicleId: nextVehicleId(),
            label: "1888",
            cars: ["1888", "1889", "1890", "1891"],
            stationId: "place-davis",
            stopId: "70064",
            tripId: "11111",
          }),
        }),
      ]);

      const view = render(
        <Ladders
          routeId="Red"
          setSideBarSelection={jest.fn()}
          setBranchPickerSelection={jest.fn()}
          sideBarSelection={{
            vehicle: vehicleFactory.build({
              vehiclePosition: vehiclePositionFactory.build({
                label: "1888",
                cars: ["1888", "1889", "1890", "1891"],
              }),
            }),
            searchedCar: "1888",
          }}
          vehicles={useVehicles() ?? []}
        />,
      );

      expect(pillForLabel(view, "1888")).toHaveClass("ring-8");
    });

    test("when the sidebar is not open, trains are not highlighted", () => {
      mockUseVehicles.mockReturnValue([
        vehicleFactory.build({
          vehiclePosition: vehiclePositionFactory.build({
            vehicleId: nextVehicleId(),
            label: "1888",
            cars: ["1888", "1889", "1890", "1891"],
            stationId: "place-davis",
            stopId: "70064",
            tripId: "11111",
          }),
        }),
      ]);

      const view = render(
        <Ladders
          routeId="Red"
          setSideBarSelection={jest.fn()}
          setBranchPickerSelection={jest.fn()}
          sideBarSelection={null}
          vehicles={useVehicles() ?? []}
        />,
      );

      expect(pillForLabel(view, "1888")).not.toHaveClass("ring-8");
    });
  });

  describe("branch selection on train click", () => {
    beforeAll(() => {
      mockGetMetaContent.mockImplementation((field: MetaDataKey) => {
        if (field === "userGroups") return ORBIT_RL_TRAINSTARTERS;
        return null;
      });
    });

    test("clicking a train on the Ashmont ladder calls setBranchPickerSelection with Ashmont", async () => {
      const mockSetBranch = jest.fn();
      mockUseVehicles.mockReturnValue([
        vehicleFactory.build({
          vehiclePosition: vehiclePositionFactory.build({
            vehicleId: nextVehicleId(),
            label: "1999",
            cars: ["1999", "1876", "1807", "1806", "1815", "1814"],
            stationId: "place-asmnl",
            stopId: "70094",
            stopStatus: StopStatus.StoppedAt,
            position: null,
          }),
        }),
      ]);

      const user = userEvent.setup();
      const view = render(
        <Ladders
          routeId="Red"
          setSideBarSelection={jest.fn()}
          setBranchPickerSelection={mockSetBranch}
          sideBarSelection={null}
          vehicles={useVehicles() ?? []}
        />,
      );

      await user.click(view.getByRole("button", { name: /1999/ }));
      expect(mockSetBranch).toHaveBeenCalledWith("Ashmont");
    });

    test("clicking a train on the Braintree ladder calls setBranchPickerSelection with Braintree", async () => {
      const mockSetBranch = jest.fn();
      mockUseVehicles.mockReturnValue([
        vehicleFactory.build({
          vehiclePosition: vehiclePositionFactory.build({
            vehicleId: nextVehicleId(),
            label: "2001",
            cars: ["2001", "1876", "1807", "1806", "1815", "1814"],
            stationId: "place-brntn",
            stopId: "70105",
            stopStatus: StopStatus.StoppedAt,
            position: null,
          }),
        }),
      ]);

      const user = userEvent.setup();
      const view = render(
        <Ladders
          routeId="Red"
          setSideBarSelection={jest.fn()}
          setBranchPickerSelection={mockSetBranch}
          sideBarSelection={null}
          vehicles={useVehicles() ?? []}
        />,
      );

      await user.click(view.getByRole("button", { name: /2001/ }));
      expect(mockSetBranch).toHaveBeenCalledWith("Braintree");
    });

    test("clicking a train on the Alewife trunk ladder calls setBranchPickerSelection with Alewife", async () => {
      const mockSetBranch = jest.fn();
      mockUseVehicles.mockReturnValue([
        vehicleFactory.build({
          vehiclePosition: vehiclePositionFactory.build({
            vehicleId: nextVehicleId(),
            label: "1888",
            cars: ["1888", "1876", "1807", "1806", "1815", "1814"],
            stationId: "place-davis",
            stopId: "70064",
            stopStatus: StopStatus.StoppedAt,
            position: null,
          }),
        }),
      ]);

      const user = userEvent.setup();
      const view = render(
        <Ladders
          routeId="Red"
          setSideBarSelection={jest.fn()}
          setBranchPickerSelection={mockSetBranch}
          sideBarSelection={null}
          vehicles={useVehicles() ?? []}
        />,
      );

      await user.click(view.getByRole("button", { name: /1888/ }));
      expect(mockSetBranch).toHaveBeenCalledWith("Alewife");
    });
  });
});

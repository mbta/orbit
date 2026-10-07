import { Ladders } from "../../../components/ladderPageShared/ladder";
import { LadderPage } from "../../../components/ladderPageShared/ladderPage";
import { ORBIT_RL_TRAINSTARTERS } from "../../../groups";
import { useVehicles } from "../../../hooks/useVehicles";
import { Vehicle } from "../../../models/vehicle";
import { StopStatus } from "../../../models/vehiclePosition";
import { trackSideBarOpened } from "../../../telemetry/trackingEvents";
import { getMetaContent, MetaDataKey } from "../../../util/metadata";
import { vehicleFactory, vehiclePositionFactory } from "../../helpers/factory";
import { act, fireEvent, render, within } from "@testing-library/react";
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

    test("sidebar current location updates live when the vehicles feed updates, without closing/reopening", async () => {
      const vehicleId = "R-5482CAAA"; // default vehicleFactory vehicleId
      mockUseVehicles.mockReturnValue([
        vehicleFactory.build({
          vehiclePosition: vehiclePositionFactory.build({
            vehicleId,
            stationId: "place-davis",
            stopId: "70064",
            stopStatus: StopStatus.StoppedAt,
          }),
        }),
      ]);

      const user = userEvent.setup();
      const view = render(<LadderPage routeId="Red" />);

      await user.click(view.getByText("1877"));

      let currentLocationSection = view.getByTestId("current-location-section");
      expect(
        within(currentLocationSection).getByText(/Boarding at/i),
      ).toBeInTheDocument();
      expect(
        within(currentLocationSection).getByText(/Davis Square/i),
      ).toBeInTheDocument();

      // Simulate the live vehicles feed (`useVehicles`) pushing an update for
      // the still-selected vehicle, without the sidebar being closed/reopened.
      mockUseVehicles.mockReturnValue([
        vehicleFactory.build({
          vehiclePosition: vehiclePositionFactory.build({
            vehicleId,
            stationId: "place-portr",
            stopId: "70066",
            stopStatus: StopStatus.InTransitTo,
          }),
        }),
      ]);
      view.rerender(<LadderPage routeId="Red" />);

      currentLocationSection = view.getByTestId("current-location-section");
      expect(
        within(currentLocationSection).getByText(/Next stop/i),
      ).toBeInTheDocument();
      expect(
        within(currentLocationSection).getByText(/Porter Square/i),
      ).toBeInTheDocument();
      expect(
        within(currentLocationSection).queryByText(/Boarding at/i),
      ).not.toBeInTheDocument();
      expect(
        within(currentLocationSection).queryByText(/Davis Square/i),
      ).not.toBeInTheDocument();
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

    test("clicking a train highlights it", async () => {
      const user = userEvent.setup();
      const view = render(<LadderPage routeId="Red" />);
      await user.click(view.getByRole("button", { name: "A 1877" }));
      expect(view.getByRole("button", { name: "A 1877" })).toHaveClass(
        "z-object",
      );
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
    jest.useFakeTimers();
    mockUseVehicles.mockReturnValue([vehicleFactory.build()]);
    mockGetMetaContent.mockReturnValue(null);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("BranchPicker is hidden by default (no overflow in jsdom)", () => {
    const view = render(<LadderPage routeId="Red" />);
    expect(view.queryByTestId("branch-picker")).not.toBeInTheDocument();
  });

  test("BranchPicker is shown when scroll container overflows horizontally", () => {
    const { getByTestId } = render(<LadderPage routeId="Red" />);

    const laddersScrollContainer = getByTestId("ladders-scroll-container");

    // eslint-disable-next-line better-mutation/no-mutating-functions
    Object.defineProperty(laddersScrollContainer, "scrollWidth", {
      get: () => 1000,
      configurable: true,
    });

    act(() => {
      window.dispatchEvent(new Event("resize"));
    });
    act(() => {
      jest.advanceTimersByTime(150);
    });

    const branchPicker = getByTestId("branch-picker");
    expect(getByTestId("branch-picker-container")).toHaveClass("shrink-0");
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

    const laddersScrollContainer = getByTestId("ladders-scroll-container");

    // first simulate overflow
    // eslint-disable-next-line better-mutation/no-mutating-functions
    Object.defineProperty(laddersScrollContainer, "scrollWidth", {
      get: () => 1000,
      configurable: true,
    });
    act(() => {
      window.dispatchEvent(new Event("resize"));
    });
    act(() => {
      jest.advanceTimersByTime(150);
    });

    // then resolve overflow
    // eslint-disable-next-line better-mutation/no-mutating-functions
    Object.defineProperty(laddersScrollContainer, "scrollWidth", {
      get: () => 0,
      configurable: true,
    });
    act(() => {
      window.dispatchEvent(new Event("resize"));
    });
    act(() => {
      jest.advanceTimersByTime(150);
    });

    expect(queryByTestId("branch-picker")).not.toBeInTheDocument();
  });
});

const nextVehicleId = (() => {
  let mockVehicleId = 0;
  return () => `mock-id-${mockVehicleId++}`;
})();

describe("LadderPage branch centering", () => {
  const CONTAINER_WIDTH = 600;
  const SCROLL_WIDTH = 3000;

  const defineMetric = (
    element: HTMLElement,
    key: string,
    value: number,
  ): void => {
    // eslint-disable-next-line better-mutation/no-mutating-functions
    Object.defineProperty(element, key, {
      get: () => value,
      configurable: true,
    });
  };

  // jsdom performs no layout, so fake horizontal overflow to show the picker.
  const fakeLayout = (
    view: ReturnType<typeof render>,
    containerWidth: number = CONTAINER_WIDTH,
  ) => {
    const container = view.getByTestId("ladders-scroll-container");
    defineMetric(container, "clientWidth", containerWidth);
    defineMetric(container, "scrollWidth", SCROLL_WIDTH);

    return container;
  };

  const watchBranchScroll = (
    view: ReturnType<typeof render>,
    branch: number,
  ): jest.Mock => {
    const scrollTo = jest.fn();
    // eslint-disable-next-line better-mutation/no-mutating-functions
    Object.defineProperty(
      view.getByTestId(`ladder-branch-${branch}`),
      "scrollIntoView",
      {
        value: scrollTo,
        configurable: true,
      },
    );
    return scrollTo;
  };

  const showBranchPicker = () => {
    act(() => {
      window.dispatchEvent(new Event("resize"));
    });
    act(() => {
      jest.advanceTimersByTime(150);
    });
  };

  beforeEach(() => {
    jest.useFakeTimers();
    mockGetMetaContent.mockImplementation((field: MetaDataKey) => {
      if (field === "userGroups") return ORBIT_RL_TRAINSTARTERS;
      return null;
    });
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
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("clicking the Braintree branch button centers the Braintree ladder", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const view = render(<LadderPage routeId="Red" />);
    fakeLayout(view);
    showBranchPicker();

    const scrollTo = watchBranchScroll(view, 2);
    await user.click(
      within(view.getByTestId("branch-picker")).getByRole("button", {
        name: "Braintree",
      }),
    );

    expect(scrollTo).toHaveBeenCalledWith({
      inline: "center",
      block: "start",
      behavior: "auto",
    });
    expect(scrollTo).toHaveBeenCalledTimes(1);
  });

  test("changing branches scrolls the page to the top", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const view = render(<LadderPage routeId="Red" />);
    const container = fakeLayout(view);
    showBranchPicker();

    container.scrollTop = 400;
    const pageScroller = view.getByRole("main");
    pageScroller.scrollTop = 400;
    const intermediateScroller = view.getByTestId("scroll-container");
    intermediateScroller.scrollTop = 400;
    const scrollTo = watchBranchScroll(view, 2);
    scrollTo.mockImplementation(() => {
      pageScroller.scrollTop = 200;
      intermediateScroller.scrollTop = 200;
      container.scrollTop = 200;
    });

    await user.click(
      within(view.getByTestId("branch-picker")).getByRole("button", {
        name: "Braintree",
      }),
    );

    expect(scrollTo).toHaveBeenCalledWith({
      inline: "center",
      block: "start",
      behavior: "auto",
    });
    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect(container.scrollTop).toBe(0);
    expect(pageScroller.scrollTop).toBe(0);
    expect(intermediateScroller.scrollTop).toBe(0);
  });

  test("clicking the Alewife branch button centers the Alewife ladder", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const view = render(<LadderPage routeId="Red" />);
    fakeLayout(view);
    showBranchPicker();

    const scrollTo = watchBranchScroll(view, 0);
    await user.click(
      within(view.getByTestId("branch-picker")).getByRole("button", {
        name: "Alewife",
      }),
    );

    expect(scrollTo).toHaveBeenCalledWith({
      inline: "center",
      block: "start",
      behavior: "auto",
    });
    expect(scrollTo).toHaveBeenCalledTimes(1);
  });

  test("centers the selected ladder after closing the sidebar", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const view = render(<LadderPage routeId="Red" />);
    fakeLayout(view);
    showBranchPicker();

    // open the sidebar, which shrinks the ladders scroll area
    await user.click(view.getByRole("button", { name: /2001/ }));
    expect(view.getByRole("button", { name: "Close" })).toBeInTheDocument();

    const scrollTo = watchBranchScroll(view, 1);

    await user.click(
      within(view.getByTestId("branch-picker")).getByRole("button", {
        name: "Ashmont",
      }),
    );

    expect(scrollTo).toHaveBeenCalledWith({
      inline: "center",
      block: "start",
      behavior: "auto",
    });
    expect(
      view.queryByRole("button", { name: "Close" }),
    ).not.toBeInTheDocument();
  });

  test("clicking a train centers the Braintree ladder without resetting vertical scroll", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const view = render(<LadderPage routeId="Red" />);
    const container = fakeLayout(view);
    showBranchPicker();

    container.scrollTop = 400;
    const pageScroller = view.getByRole("main");
    pageScroller.scrollTop = 300;
    const scrollTo = watchBranchScroll(view, 2);
    await user.click(view.getByRole("button", { name: /2001/ }));

    expect(scrollTo).toHaveBeenCalledWith({
      inline: "center",
      block: "nearest",
      behavior: "auto",
    });
    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect(container.scrollTop).toBe(400);
    expect(pageScroller.scrollTop).toBe(300);
  });

  test("re-selecting the current branch centers it and resets vertical scroll", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const view = render(<LadderPage routeId="Red" />);
    fakeLayout(view);
    showBranchPicker();

    const scrollTo = watchBranchScroll(view, 1);
    const ashmontButton = within(view.getByTestId("branch-picker")).getByRole(
      "button",
      { name: "Ashmont" },
    );
    await user.click(ashmontButton);
    const intermediateScroller = view.getByTestId("scroll-container");
    intermediateScroller.scrollTop = 400;
    await user.click(ashmontButton);

    expect(scrollTo).toHaveBeenCalledTimes(2);
    expect(scrollTo).toHaveBeenLastCalledWith({
      inline: "center",
      block: "start",
      behavior: "auto",
    });
    expect(intermediateScroller.scrollTop).toBe(0);
  });

  test("does not throw when rendering without faked layout metrics", () => {
    expect(() => render(<LadderPage routeId="Red" />)).not.toThrow();
  });

  test("clicking a branch selection button closes the sidebar", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const view = render(<LadderPage routeId="Red" />);
    fakeLayout(view);
    showBranchPicker();

    await user.click(view.getByRole("button", { name: /2001/ }));
    expect(view.getByRole("button", { name: "Close" })).toBeInTheDocument();

    await user.click(
      within(view.getByTestId("branch-picker")).getByRole("button", {
        name: "Ashmont",
      }),
    );

    expect(
      view.queryByRole("button", { name: "Close" }),
    ).not.toBeInTheDocument();
  });

  test("clicking the empty space beside the branch picker closes the sidebar", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const view = render(<LadderPage routeId="Red" />);
    fakeLayout(view);
    showBranchPicker();

    await user.click(view.getByRole("button", { name: /2001/ }));
    expect(view.getByRole("button", { name: "Close" })).toBeInTheDocument();

    await user.click(view.getByTestId("branch-picker-container"));

    expect(
      view.queryByRole("button", { name: "Close" }),
    ).not.toBeInTheDocument();
  });

  test("scrolling updates the branch picker after scrolling settles", () => {
    const view = render(<LadderPage routeId="Red" />);
    const container = fakeLayout(view);
    showBranchPicker();

    // The container's visible center is x = 300
    jest
      .spyOn(container, "getBoundingClientRect")
      .mockReturnValue(DOMRect.fromRect({ x: 0, width: 600 }));

    // Simulate the Braintree ladder centered in the viewport
    [-800, -300, 200].forEach((left, branch) => {
      jest
        .spyOn(
          view.getByTestId(`ladder-branch-${branch}`),
          "getBoundingClientRect",
        )
        .mockReturnValue(DOMRect.fromRect({ x: left, width: 200 }));
    });

    const picker = view.getByTestId("branch-picker");
    const ashmont = within(picker).getByRole("button", { name: "Ashmont" });
    const braintree = within(picker).getByRole("button", { name: "Braintree" });
    const activeClass = "bg-heavy-rail-ashmont";
    const braintreeActiveClass = "bg-heavy-rail-braintree";

    expect(ashmont).toHaveClass(activeClass);
    expect(braintree).not.toHaveClass(braintreeActiveClass);

    fireEvent.scroll(container);

    act(() => {
      jest.advanceTimersByTime(119);
    });
    expect(ashmont).toHaveClass(activeClass);

    // Ensure another scroll event resets debounce
    fireEvent.scroll(container);

    act(() => {
      jest.advanceTimersByTime(119);
    });
    expect(ashmont).toHaveClass(activeClass);

    // Restarted timer fires at 120 ms
    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(braintree).toHaveClass(braintreeActiveClass);
    expect(ashmont).not.toHaveClass(activeClass);
  });
});

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
      expect(mockSetBranch).toHaveBeenCalledWith(1);
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
      expect(mockSetBranch).toHaveBeenCalledWith(2);
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
      expect(mockSetBranch).toHaveBeenCalledWith(0);
    });
  });

  describe("plots trains on correct side of ladder", () => {
    // Assumes order of ladders by index is Alewife, Ashmont, then Braintree
    // TODO: Find a better way to label the specific ladders for testing
    const ladderToIndex = {
      alewife: 0,
      ashmont: 1,
      braintree: 2,
    } as const;

    const setupDirectionTest = (
      vehicles: Vehicle[],
      ladder: keyof typeof ladderToIndex,
    ) => {
      mockUseVehicles.mockReturnValue(vehicles);

      const view = render(
        <Ladders
          routeId="Red"
          setSideBarSelection={jest.fn()}
          setBranchPickerSelection={jest.fn()}
          sideBarSelection={null}
          vehicles={useVehicles() ?? []}
        />,
      );

      const ladderIndex = ladderToIndex[ladder];
      const northboundContainer =
        view.getAllByLabelText("Trains Eastbound")[ladderIndex];
      expect(northboundContainer).toBeInTheDocument();

      const southboundContainer =
        view.getAllByLabelText("Trains Westbound")[ladderIndex];
      expect(southboundContainer).toBeInTheDocument();

      return {
        view,
        northboundContainer,
        southboundContainer,
      };
    };

    test("plots trains based on vehicle direction", async () => {
      const { northboundContainer, southboundContainer } = setupDirectionTest(
        [
          // Northbound ("Eastbound") train stopped at Davis
          vehicleFactory.build({
            vehiclePosition: vehiclePositionFactory.build({
              vehicleId: "vehicle1",
              directionId: 1,
              label: "1999",
              cars: ["1999", "1998", "1997", "1996", "1995", "1994"],
              stationId: "place-davis",
              stopId: "70063",
              stopStatus: StopStatus.StoppedAt,
              position: { latitude: 42.39674, longitude: -71.121815 },
            }),
          }),
          // Southbound ("Westbound) train stopped at Davis
          vehicleFactory.build({
            vehiclePosition: vehiclePositionFactory.build({
              vehicleId: "vehicle2",
              directionId: 0,
              label: "1898",
              cars: ["1899", "1898", "1897", "1896", "1895", "1894"],
              stationId: "place-davis",
              stopId: "70063",
              stopStatus: StopStatus.StoppedAt,
              position: { latitude: 42.39674, longitude: -71.121815 },
            }),
          }),
        ],
        "alewife",
      );

      expect(within(northboundContainer).getByText("1999")).toBeInTheDocument();
      expect(within(southboundContainer).getByText("1899")).toBeInTheDocument();
    });

    describe("handles direction overrides for Alewife stops", () => {
      const mockTrain = ({
        stopId,
        stopStatus,
        directionId,
      }: {
        stopId: string;
        stopStatus: StopStatus;
        directionId: number;
      }) => {
        return vehicleFactory.build({
          vehiclePosition: vehiclePositionFactory.build({
            vehicleId: "vehicle1",
            directionId,
            label: "1901",
            cars: ["1901"],
            stationId: "place-alfcl",
            stopId,
            stopStatus,
            position: { latitude: 42.39583, longitude: -71.141287 },
          }),
        });
      };

      const setupTest = (vehicles: Vehicle[]) =>
        setupDirectionTest(vehicles, "alewife");

      // Alewife 70061 : No directional overrides
      test("NB train IN_TRANSIT_TO Alewife 70061 shows as NB", async () => {
        const { northboundContainer } = setupTest([
          mockTrain({
            directionId: 1,
            stopId: "70061",
            stopStatus: StopStatus.InTransitTo,
          }),
        ]);

        expect(
          within(northboundContainer).getByText("1901"),
        ).toBeInTheDocument();
      });

      test("NB train STOPPED_AT Alewife 70061 shows as NB", async () => {
        const { northboundContainer } = setupTest([
          mockTrain({
            directionId: 1,
            stopId: "70061",
            stopStatus: StopStatus.StoppedAt,
          }),
        ]);

        expect(
          within(northboundContainer).getByText("1901"),
        ).toBeInTheDocument();
      });

      test("SB train IN_TRANSIT_TO Alewife 70061 shows as SB", async () => {
        const { southboundContainer } = setupTest([
          mockTrain({
            directionId: 0,
            stopId: "70061",
            stopStatus: StopStatus.InTransitTo,
          }),
        ]);

        expect(
          within(southboundContainer).getByText("1901"),
        ).toBeInTheDocument();
      });

      test("SB train STOPPED_AT Alewife 70061 shows as SB", async () => {
        const { southboundContainer } = setupTest([
          mockTrain({
            directionId: 0,
            stopId: "70061",
            stopStatus: StopStatus.StoppedAt,
          }),
        ]);

        expect(
          within(southboundContainer).getByText("1901"),
        ).toBeInTheDocument();
      });

      // Alewife-01 : Overrides to Northbound
      test("NB train IN_TRANSIT_TO Alewife-01 shows as NB", async () => {
        const { northboundContainer } = setupTest([
          mockTrain({
            directionId: 1,
            stopId: "Alewife-01",
            stopStatus: StopStatus.InTransitTo,
          }),
        ]);

        expect(
          within(northboundContainer).getByText("1901"),
        ).toBeInTheDocument();
      });

      test("NB train STOPPED_AT Alewife-01 shows as NB", async () => {
        const { northboundContainer } = setupTest([
          mockTrain({
            directionId: 1,
            stopId: "Alewife-01",
            stopStatus: StopStatus.StoppedAt,
          }),
        ]);

        expect(
          within(northboundContainer).getByText("1901"),
        ).toBeInTheDocument();
      });

      test("SB train IN_TRANSIT_TO Alewife-01 shows as SB", async () => {
        const { southboundContainer } = setupTest([
          mockTrain({
            directionId: 0,
            stopId: "Alewife-01",
            stopStatus: StopStatus.InTransitTo,
          }),
        ]);

        expect(
          within(southboundContainer).getByText("1901"),
        ).toBeInTheDocument();
      });

      test("SB train STOPPED_AT Alewife-01 shows as NB (override)", async () => {
        const { northboundContainer } = setupTest([
          mockTrain({
            directionId: 0,
            stopId: "Alewife-01",
            stopStatus: StopStatus.StoppedAt,
          }),
        ]);

        expect(
          within(northboundContainer).getByText("1901"),
        ).toBeInTheDocument();
      });

      // Alewife-02 : Overrides to Southbound
      test("NB train IN_TRANSIT_TO Alewife-02 shows as NB", async () => {
        const { northboundContainer } = setupTest([
          mockTrain({
            directionId: 1,
            stopId: "Alewife-02",
            stopStatus: StopStatus.InTransitTo,
          }),
        ]);

        expect(
          within(northboundContainer).getByText("1901"),
        ).toBeInTheDocument();
      });

      test("NB train STOPPED_AT Alewife-02 shows as SB (override)", async () => {
        const { southboundContainer } = setupTest([
          mockTrain({
            directionId: 1,
            stopId: "Alewife-02",
            stopStatus: StopStatus.StoppedAt,
          }),
        ]);

        expect(
          within(southboundContainer).getByText("1901"),
        ).toBeInTheDocument();
      });

      test("SB train IN_TRANSIT_TO Alewife-02 shows as SB", async () => {
        const { southboundContainer } = setupTest([
          mockTrain({
            directionId: 0,
            stopId: "Alewife-02",
            stopStatus: StopStatus.InTransitTo,
          }),
        ]);

        expect(
          within(southboundContainer).getByText("1901"),
        ).toBeInTheDocument();
      });

      test("SB train STOPPED_AT Alewife-02 shows as SB", async () => {
        const { southboundContainer } = setupTest([
          mockTrain({
            directionId: 0,
            stopId: "Alewife-02",
            stopStatus: StopStatus.StoppedAt,
          }),
        ]);

        expect(
          within(southboundContainer).getByText("1901"),
        ).toBeInTheDocument();
      });
    });

    describe("handles direction overrides for Braintree stops", () => {
      const mockTrain = ({
        stopId,
        stopStatus,
        directionId,
      }: {
        stopId: string;
        stopStatus: StopStatus;
        directionId: number;
      }) => {
        return vehicleFactory.build({
          vehiclePosition: vehiclePositionFactory.build({
            vehicleId: "vehicle1",
            directionId,
            label: "1901",
            cars: ["1901"],
            stationId: "place-brntn",
            stopId,
            stopStatus,
            position: { latitude: 42.207854, longitude: -71.001138 },
          }),
        });
      };

      const setupTest = (vehicles: Vehicle[]) =>
        setupDirectionTest(vehicles, "braintree");

      // Braintree 70105 : No directional overrides
      test("NB train IN_TRANSIT_TO Braintree 70105 shows as NB", async () => {
        const { northboundContainer } = setupTest([
          mockTrain({
            directionId: 1,
            stopId: "70105",
            stopStatus: StopStatus.InTransitTo,
          }),
        ]);

        expect(
          within(northboundContainer).getByText("1901"),
        ).toBeInTheDocument();
      });

      test("NB train STOPPED_AT Braintree 70105 shows as NB", async () => {
        const { northboundContainer } = setupTest([
          mockTrain({
            directionId: 1,
            stopId: "70105",
            stopStatus: StopStatus.StoppedAt,
          }),
        ]);

        expect(
          within(northboundContainer).getByText("1901"),
        ).toBeInTheDocument();
      });

      test("SB train IN_TRANSIT_TO Braintree 70105 shows as SB", async () => {
        const { southboundContainer } = setupTest([
          mockTrain({
            directionId: 0,
            stopId: "70105",
            stopStatus: StopStatus.InTransitTo,
          }),
        ]);

        expect(
          within(southboundContainer).getByText("1901"),
        ).toBeInTheDocument();
      });

      test("SB train STOPPED_AT Braintree-01 shows as SB", async () => {
        const { southboundContainer } = setupTest([
          mockTrain({
            directionId: 0,
            stopId: "70105",
            stopStatus: StopStatus.StoppedAt,
          }),
        ]);

        expect(
          within(southboundContainer).getByText("1901"),
        ).toBeInTheDocument();
      });

      // Braintree-01 : Overrides to Northbound
      test("NB train IN_TRANSIT_TO Braintree-01 shows as NB", async () => {
        const { northboundContainer } = setupTest([
          mockTrain({
            directionId: 1,
            stopId: "Braintree-01",
            stopStatus: StopStatus.InTransitTo,
          }),
        ]);

        expect(
          within(northboundContainer).getByText("1901"),
        ).toBeInTheDocument();
      });

      test("NB train STOPPED_AT Braintree-01 shows as NB", async () => {
        const { northboundContainer } = setupTest([
          mockTrain({
            directionId: 1,
            stopId: "Braintree-01",
            stopStatus: StopStatus.StoppedAt,
          }),
        ]);

        expect(
          within(northboundContainer).getByText("1901"),
        ).toBeInTheDocument();
      });

      test("SB train IN_TRANSIT_TO Braintree-01 shows as SB", async () => {
        const { southboundContainer } = setupTest([
          mockTrain({
            directionId: 0,
            stopId: "Braintree-01",
            stopStatus: StopStatus.InTransitTo,
          }),
        ]);

        expect(
          within(southboundContainer).getByText("1901"),
        ).toBeInTheDocument();
      });

      test("SB train STOPPED_AT Braintree-01 shows as NB (override)", async () => {
        const { northboundContainer } = setupTest([
          mockTrain({
            directionId: 0,
            stopId: "Braintree-01",
            stopStatus: StopStatus.StoppedAt,
          }),
        ]);

        expect(
          within(northboundContainer).getByText("1901"),
        ).toBeInTheDocument();
      });

      // Braintree-02 : Overrides to Southbound
      test("NB train IN_TRANSIT_TO Braintree-02 shows as NB", async () => {
        const { northboundContainer } = setupTest([
          mockTrain({
            directionId: 1,
            stopId: "Braintree-02",
            stopStatus: StopStatus.InTransitTo,
          }),
        ]);

        expect(
          within(northboundContainer).getByText("1901"),
        ).toBeInTheDocument();
      });

      test("NB train STOPPED_AT Braintree-02 shows as SB (override)", async () => {
        const { southboundContainer } = setupTest([
          mockTrain({
            directionId: 1,
            stopId: "Braintree-02",
            stopStatus: StopStatus.StoppedAt,
          }),
        ]);

        expect(
          within(southboundContainer).getByText("1901"),
        ).toBeInTheDocument();
      });

      test("SB train IN_TRANSIT_TO Braintree-02 shows as SB", async () => {
        const { southboundContainer } = setupTest([
          mockTrain({
            directionId: 0,
            stopId: "Braintree-02",
            stopStatus: StopStatus.InTransitTo,
          }),
        ]);

        expect(
          within(southboundContainer).getByText("1901"),
        ).toBeInTheDocument();
      });

      test("SB train STOPPED_AT Braintree-02 shows as SB", async () => {
        const { southboundContainer } = setupTest([
          mockTrain({
            directionId: 0,
            stopId: "Braintree-02",
            stopStatus: StopStatus.StoppedAt,
          }),
        ]);

        expect(
          within(southboundContainer).getByText("1901"),
        ).toBeInTheDocument();
      });
    });
  });
});

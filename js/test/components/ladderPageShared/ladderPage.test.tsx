import { LadderPage } from "../../../components/ladderPageShared/ladderPage";
import { ORBIT_RL_TRAINSTARTERS } from "../../../groups";
import { useVehicles } from "../../../hooks/useVehicles";
import { StopStatus } from "../../../models/vehiclePosition";
import { trackSideBarOpened } from "../../../telemetry/trackingEvents";
import { getMetaContent, MetaDataKey } from "../../../util/metadata";
import { vehicleFactory, vehiclePositionFactory } from "../../helpers/factory";
import { render } from "@testing-library/react";
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

import { LadderPage } from "../../../components/ladderPage/ladderPage";
import { ORBIT_RL_TRAINSTARTERS } from "../../../groups";
import { useVehicles } from "../../../hooks/useVehicles";
import { trackSideBarOpened } from "../../../telemetry/trackingEvents";
import { getMetaContent } from "../../../util/metadata";
import { vehicleFactory } from "../../helpers/factory";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("../../../hooks/useVehicles", () => ({
  __esModule: true,
  useVehicles: jest.fn(),
}));
const mockUseVehicles = useVehicles as jest.MockedFunction<typeof useVehicles>;
mockUseVehicles.mockReturnValue([vehicleFactory.build()]);

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
  describe("with red line sidebar permissions", () => {
    beforeAll(() => {
      mockGetMetaContent.mockReturnValue(ORBIT_RL_TRAINSTARTERS);
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

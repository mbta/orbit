import { LadderPage } from "../../../components/ladderPage/ladderPage";
import { ORBIT_RL_TRAINSTARTERS } from "../../../groups";
import { useTripUpdates } from "../../../hooks/useTripUpdates";
import { useVehiclePositions } from "../../../hooks/useVehiclePositions";
import { getMetaContent } from "../../../util/metadata";
import {
  tripUpdateFactory,
  vehiclePositionFactory,
} from "../../helpers/factory";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("../../../hooks/useVehiclePositions", () => ({
  __esModule: true,
  useVehiclePositions: jest.fn(),
}));
const mockUseVehiclePositions = useVehiclePositions as jest.MockedFunction<
  typeof useVehiclePositions
>;
mockUseVehiclePositions.mockReturnValue([vehiclePositionFactory.build()]);

jest.mock("../../../hooks/useTripUpdates", () => ({
  __esModule: true,
  useTripUpdates: jest.fn(),
}));
const mockUseTripUpdates = useTripUpdates as jest.MockedFunction<
  typeof useTripUpdates
>;
mockUseTripUpdates.mockReturnValue([tripUpdateFactory.build()]);

jest.mock("../../../util/metadata", () => ({
  getMetaContent: jest.fn(),
}));
const mockGetMetaContent = getMetaContent as jest.MockedFunction<
  typeof getMetaContent
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
      expect(
        view.getByRole("button", { name: "close sidebar" }),
      ).toBeInTheDocument();
    });

    test("can close SideBar with close button", async () => {
      const user = userEvent.setup();
      const view = render(<LadderPage routeId="Red" />);
      await user.click(view.getByText("1877"));
      await user.click(view.getByRole("button", { name: "close sidebar" }));
      expect(
        view.queryByRole("button", { name: "close sidebar" }),
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
        view.queryByRole("button", { name: "close sidebar" }),
      ).not.toBeInTheDocument();
    });
  });
});

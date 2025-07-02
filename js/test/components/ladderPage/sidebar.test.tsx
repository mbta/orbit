import { SideBar } from "../../../components/ladderPage/sidebar";
import { render } from "@testing-library/react";

describe("sidebar", () => {
  describe("Current Trip section", () => {
    test("header present", () => {
      const view = render(<SideBar selection={null} close={() => {}} />);
      expect(view.getByText("Current Trip")).toBeInTheDocument();
    });

    test("shows empty data fields (for now)", () => {
      const view = render(<SideBar selection={null} close={() => {}} />);
      expect(view.getAllByText("---")).toHaveLength(5);
    });

    // TODO: add test for sidebar test with estimated arrival times
  });
});

import { SideBar } from "../../../components/ladderPage/sidebar";
import { dateTimeFromISO } from "../../../dateTime";
import {
  ocsTripFactory,
  tripUpdateFactory,
  vehicleFactory,
} from "../../helpers/factory";
import { render } from "@testing-library/react";

describe("sidebar", () => {
  test("contains consist with bolded lead car", () => {
    const view = render(
      <SideBar
        selection={{ vehicle: vehicleFactory.build() }}
        close={() => {}}
      />,
    );
    expect(view.getByText("1877")).toHaveClass("font-bold text-2xl");
    expect(view.getByText("1814")).toBeInTheDocument();
  });

  describe("Current Trip section", () => {
    test("header present", () => {
      const view = render(
        <SideBar
          selection={{ vehicle: vehicleFactory.build() }}
          close={() => {}}
        />,
      );
      expect(view.getByText("Current Trip")).toBeInTheDocument();
    });

    describe("scheduled", () => {
      test("shows origin and destination stations if present", () => {
        const view = render(
          <SideBar
            selection={{
              vehicle: vehicleFactory.build({
                ocsTrips: {
                  current: ocsTripFactory.build({
                    originStation: "place-alfcl",
                    destinationStation: "place-brntn",
                  }),
                },
              }),
            }}
            close={() => {}}
          />,
        );
        expect(view.getByText("Alewife")).toBeInTheDocument();
        expect(view.getByText("Braintree")).toBeInTheDocument();
      });

      test("shows scheduled departure and arrival times if present", () => {
        const view = render(
          <SideBar
            selection={{
              vehicle: vehicleFactory.build({
                ocsTrips: {
                  current: ocsTripFactory.build({
                    scheduledDeparture: dateTimeFromISO(
                      "2025-07-07T17:05:00.000Z",
                    ),
                    scheduledArrival: dateTimeFromISO(
                      "2025-07-07T18:05:00.000Z",
                    ),
                  }),
                },
              }),
            }}
            close={() => {}}
          />,
        );
        expect(view.getByText(/1:05p/)).toBeInTheDocument();
        expect(view.getByText(/2:05p/)).toBeInTheDocument();
      });
    });

    describe("estimated arrival time", () => {
      test("is displayed if available", () => {
        const view = render(
          <SideBar
            selection={{ vehicle: vehicleFactory.build() }}
            close={() => {}}
          />,
        );
        expect(view.getByText("5:51p")).toBeInTheDocument();
      });

      // NOTE: when other sidebar fields are hooked up, perhaps consolidate testing
      // for "---" placeholders into one test mocking missing data for all fields
      test("displays '---' when unavailable", () => {
        const view = render(
          <SideBar
            selection={{
              vehicle: vehicleFactory.build({
                tripUpdate: tripUpdateFactory.build({ stopTimeUpdates: [] }),
              }),
            }}
            close={() => {}}
          />,
        );
        expect(view.getAllByText("---")).toHaveLength(2);
      });
    });

    describe("Offset", () => {
      test("positive nonzero", () => {
        const view = render(
          <SideBar
            selection={{
              vehicle: vehicleFactory.build({
                ocsTrips: {
                  current: ocsTripFactory.build({
                    offset: 2,
                  }),
                },
              }),
            }}
            close={() => {}}
          />,
        );
        expect(view.getByText(/\(\+2\)/)).toBeInTheDocument();
      });

      test("negative nonzero", () => {
        const view = render(
          <SideBar
            selection={{
              vehicle: vehicleFactory.build({
                ocsTrips: {
                  current: ocsTripFactory.build({
                    offset: -2,
                  }),
                },
              }),
            }}
            close={() => {}}
          />,
        );
        expect(view.getByText(/\(-2\)/)).toBeInTheDocument();
      });

      test("zero", () => {
        const view = render(
          <SideBar
            selection={{
              vehicle: vehicleFactory.build({
                ocsTrips: {
                  current: ocsTripFactory.build({
                    offset: 0,
                  }),
                },
              }),
            }}
            close={() => {}}
          />,
        );
        expect(view.queryByText(/\(0\)/)).not.toBeInTheDocument();
        expect(view.queryByText(/\(-0\)/)).not.toBeInTheDocument();
      });

      test("null", () => {
        const view = render(
          <SideBar
            selection={{
              vehicle: vehicleFactory.build({
                ocsTrips: {
                  current: ocsTripFactory.build({
                    offset: null,
                  }),
                },
              }),
            }}
            close={() => {}}
          />,
        );
        expect(view.queryByText(/\(0\)/)).not.toBeInTheDocument();
        expect(view.queryByText(/\(-0\)/)).not.toBeInTheDocument();
      });
    });
  });
});

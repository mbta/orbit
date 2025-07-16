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

  test("headers present", () => {
    const view = render(
      <SideBar
        selection={{ vehicle: vehicleFactory.build() }}
        close={() => {}}
      />,
    );
    expect(view.getByText("Current Trip")).toBeInTheDocument();
    expect(view.getByText("Next Trip")).toBeInTheDocument();
  });

  describe("Trips", () => {
    describe("scheduled", () => {
      test("shows origin and destination stations if present", () => {
        const view = render(
          <SideBar
            selection={{
              vehicle: vehicleFactory.build({
                ocsTrips: {
                  current: ocsTripFactory.build({
                    originStation: "ALEWIFE",
                    destinationStation: "BRAINTREE",
                  }),
                  next: [
                    // not realistic for a trip, but using known station names we want to reformat for the sidebar
                    ocsTripFactory.build({
                      originStation: "JFK/ UMASS ASH",
                      destinationStation: "KENDALL/MIT",
                    }),
                  ],
                },
              }),
            }}
            close={() => {}}
          />,
        );
        // current trip
        expect(view.getByText("Alewife")).toBeInTheDocument();
        expect(view.getByText("Braintree")).toBeInTheDocument();

        // next trip
        expect(view.getByText("JFK")).toBeInTheDocument();
        expect(view.getByText("Kendall")).toBeInTheDocument();
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
                  next: [
                    ocsTripFactory.build({
                      scheduledDeparture: dateTimeFromISO(
                        "2025-07-07T18:10:00.000Z",
                      ),
                      scheduledArrival: dateTimeFromISO(
                        "2025-07-07T19:10:00.000Z",
                      ),
                    }),
                  ],
                },
              }),
            }}
            close={() => {}}
          />,
        );
        // current trip
        expect(view.getByText(/1:05p/)).toBeInTheDocument();
        expect(view.getByText(/2:05p/)).toBeInTheDocument();

        //next trip
        expect(view.getByText(/2:10p/)).toBeInTheDocument();
        expect(view.getByText(/3:10p/)).toBeInTheDocument();
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
                  next: [ocsTripFactory.build({ offset: 3 })],
                },
              }),
            }}
            close={() => {}}
          />,
        );
        expect(view.getByText(/\(\+2\)/)).toBeInTheDocument();
        expect(view.getByText(/\(\+3\)/)).toBeInTheDocument();
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
                  next: [ocsTripFactory.build({ offset: -3 })],
                },
              }),
            }}
            close={() => {}}
          />,
        );
        expect(view.getByText(/\(-2\)/)).toBeInTheDocument();
        expect(view.getByText(/\(-3\)/)).toBeInTheDocument();
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
                  next: [ocsTripFactory.build({ offset: 0 })],
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
                  next: [ocsTripFactory.build({ offset: null })],
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

  describe("Current Trip section", () => {
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
                ocsTrips: {
                  current: ocsTripFactory.build(),
                  next: [ocsTripFactory.build()],
                },
              }),
            }}
            close={() => {}}
          />,
        );
        expect(view.getAllByText("---")).toHaveLength(2);
      });
    });
  });
});

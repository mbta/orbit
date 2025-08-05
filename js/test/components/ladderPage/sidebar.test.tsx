import { SideBar } from "../../../components/ladderPage/sidebar";
import { dateTimeFromISO } from "../../../dateTime";
import { useVehicleDataDownload } from "../../../hooks/useVehicleDataDownload";
import {
  ocsTripFactory,
  stopTimeUpdateFactory,
  tripUpdateFactory,
  vehicleFactory,
} from "../../helpers/factory";
import { putEnabledFeatures } from "../../helpers/metadata";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router";

jest.mock("../../../hooks/useVehicleDataDownload", () => ({
  useVehicleDataDownload: jest.fn().mockReturnValue({
    linkTarget: "mock-link-target",
    fileName: "mock-file-name",
  }),
}));

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

  test("renders current and next trip headers", () => {
    const view = render(
      <SideBar
        selection={{
          vehicle: vehicleFactory.build({
            ocsTrips: {
              current: ocsTripFactory.build({
                nextUid: "22222222",
              }),
            },
          }),
        }}
        close={() => {}}
      />,
    );
    expect(view.getByText("Current Trip")).toBeInTheDocument();
    expect(view.getByText("Next Trip")).toBeInTheDocument();
  });

  test("renders current and next trip sections event when current trip is missing", () => {
    const view = render(
      <SideBar
        selection={{
          vehicle: vehicleFactory.build({
            ocsTrips: {
              current: null,
            },
          }),
        }}
        close={() => {}}
      />,
    );
    expect(view.getByText("Current Trip")).toBeInTheDocument();
    expect(view.getByText("Next Trip")).toBeInTheDocument();
  });

  test('renders "next trip none" header if next trip is explicitly unset', () => {
    const view = render(
      <SideBar
        selection={{
          vehicle: vehicleFactory.build(),
        }}
        close={() => {}}
      />,
    );
    expect(view.queryByText("Next Trip")).not.toBeInTheDocument();
    expect(view.getByText("NEXT TRIP - none")).toBeInTheDocument();
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
                    nextUid: "22222222",
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
                    nextUid: "22222222",
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

      test('shows "last updated from OCS" timestamp (in local wall time) if present', () => {
        const view = render(
          <SideBar
            selection={{
              vehicle: vehicleFactory.build(),
            }}
            close={() => {}}
          />,
        );
        const lastUpdated = view.getByText(
          "Last updated from OCS trainsheets at 2:00a",
        );
        expect(lastUpdated).toBeInTheDocument();
        expect(lastUpdated).toHaveClass("text-gray-400 text-xs italic");
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
                    nextUid: "22222222",
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
                    nextUid: "22222222",
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

    describe("Late box", () => {
      test("shows if departed 5 minutes early", () => {
        const view = render(
          <SideBar
            selection={{
              vehicle: vehicleFactory.build({
                ocsTrips: {
                  current: ocsTripFactory.build({
                    actualDeparture: dateTimeFromISO(
                      "2025-04-29T21:36:00.000Z",
                    ),
                  }),
                },
              }),
            }}
            close={() => {}}
          />,
        );
        expect(view.getByText(/^5 min early/)).toBeInTheDocument();
      });

      test("shows if departed 5 minutes late", () => {
        const view = render(
          <SideBar
            selection={{
              vehicle: vehicleFactory.build({
                ocsTrips: {
                  current: ocsTripFactory.build({
                    actualDeparture: dateTimeFromISO(
                      "2025-04-29T21:46:00.000Z",
                    ),
                  }),
                },
              }),
            }}
            close={() => {}}
          />,
        );
        expect(view.getByText(/^5 min late/)).toBeInTheDocument();
      });

      test("shows if departed 6 minutes late (but really 5 because of the offset)", () => {
        const view = render(
          <SideBar
            selection={{
              vehicle: vehicleFactory.build({
                ocsTrips: {
                  current: ocsTripFactory.build({
                    offset: 1,
                    actualDeparture: dateTimeFromISO(
                      "2025-04-29T21:47:00.000Z",
                    ),
                  }),
                },
              }),
            }}
            close={() => {}}
          />,
        );
        expect(view.getByText(/^5 min late/)).toBeInTheDocument();
      });

      test("does not show if departed 4 minutes late", () => {
        const view = render(
          <SideBar
            selection={{
              vehicle: vehicleFactory.build({
                ocsTrips: {
                  current: ocsTripFactory.build({
                    actualDeparture: dateTimeFromISO(
                      "2025-04-29T21:45:00.000Z",
                    ),
                  }),
                },
              }),
            }}
            close={() => {}}
          />,
        );
        expect(view.queryByText(/^4 min late/)).not.toBeInTheDocument();
      });

      test("shows if arriving 5 minutes later than scheduled", () => {
        const view = render(
          <SideBar
            selection={{
              vehicle: vehicleFactory.build({
                tripUpdate: tripUpdateFactory.build({
                  stopTimeUpdates: [
                    stopTimeUpdateFactory.build({
                      predictedArrivalTime: dateTimeFromISO(
                        "2025-04-29T22:29:00.000Z",
                      ),
                    }),
                  ],
                }),
              }),
            }}
            close={() => {}}
          />,
        );
        expect(view.getByText(/^5 min later/)).toBeInTheDocument();
      });

      test("shows if arriving 5 minutes earlier than scheduled (but also left late)", () => {
        const view = render(
          <SideBar
            selection={{
              vehicle: vehicleFactory.build({
                ocsTrips: {
                  current: ocsTripFactory.build({
                    offset: 1,
                    actualDeparture: dateTimeFromISO(
                      "2025-04-29T21:47:00.000Z",
                    ),
                  }),
                },
                tripUpdate: tripUpdateFactory.build({
                  stopTimeUpdates: [
                    stopTimeUpdateFactory.build({
                      predictedArrivalTime: dateTimeFromISO(
                        "2025-04-29T22:19:00.000Z",
                      ),
                    }),
                  ],
                }),
              }),
            }}
            close={() => {}}
          />,
        );
        expect(view.getByText(/^5 min earlier/)).toBeInTheDocument();
      });

      test("shows if arriving 5 minutes later than scheduled, but also left 5 min early", () => {
        const view = render(
          <SideBar
            selection={{
              vehicle: vehicleFactory.build({
                ocsTrips: {
                  current: ocsTripFactory.build({
                    actualDeparture: dateTimeFromISO(
                      "2025-04-29T21:36:00.000Z",
                    ),
                  }),
                },
                tripUpdate: tripUpdateFactory.build({
                  stopTimeUpdates: [
                    stopTimeUpdateFactory.build({
                      predictedArrivalTime: dateTimeFromISO(
                        "2025-04-29T22:29:00.000Z",
                      ),
                    }),
                  ],
                }),
              }),
            }}
            close={() => {}}
          />,
        );
        expect(view.getByText(/^5 min later/)).toBeInTheDocument();
        expect(view.getByText(/^5 min early/)).toBeInTheDocument();
      });

      test("does not show if arriving 4 minutes later than scheduled", () => {
        const view = render(
          <SideBar
            selection={{
              vehicle: vehicleFactory.build({
                tripUpdate: tripUpdateFactory.build({
                  stopTimeUpdates: [
                    stopTimeUpdateFactory.build({
                      predictedArrivalTime: dateTimeFromISO(
                        "2025-04-29T22:28:00.000Z",
                      ),
                    }),
                  ],
                }),
              }),
            }}
            close={() => {}}
          />,
        );
        expect(view.queryByText(/^4 min later/)).not.toBeInTheDocument();
      });

      test("shows if arriving 5 minutes later than next trip's scheduled departure", () => {
        const view = render(
          <SideBar
            selection={{
              vehicle: vehicleFactory.build({
                ocsTrips: {
                  current: ocsTripFactory.build({
                    nextUid: "22222222",
                  }),
                  next: [
                    ocsTripFactory.build({
                      scheduledDeparture: dateTimeFromISO(
                        "2025-04-29T22:45:00.000Z",
                      ),
                    }),
                  ],
                },
                tripUpdate: tripUpdateFactory.build({
                  stopTimeUpdates: [
                    stopTimeUpdateFactory.build({
                      predictedArrivalTime: dateTimeFromISO(
                        "2025-04-29T22:50:00.000Z",
                      ),
                    }),
                  ],
                }),
              }),
            }}
            close={() => {}}
          />,
        );
        expect(view.getByText(/^5 min later/)).toBeInTheDocument();
      });

      test("does not show if arriving 4 minutes later than next trip's scheduled departure", () => {
        const view = render(
          <SideBar
            selection={{
              vehicle: vehicleFactory.build({
                ocsTrips: {
                  next: [
                    ocsTripFactory.build({
                      scheduledDeparture: dateTimeFromISO(
                        "2025-04-29T22:45:00.000Z",
                      ),
                    }),
                  ],
                },
                tripUpdate: tripUpdateFactory.build({
                  stopTimeUpdates: [
                    stopTimeUpdateFactory.build({
                      predictedArrivalTime: dateTimeFromISO(
                        "2025-04-29T22:49:00.000Z",
                      ),
                    }),
                  ],
                }),
              }),
            }}
            close={() => {}}
          />,
        );
        expect(view.queryByText(/^4 min later/)).not.toBeInTheDocument();
      });

      test("does not show if arriving 6 minutes earlier than next trip's scheduled departure", () => {
        const view = render(
          <SideBar
            selection={{
              vehicle: vehicleFactory.build({
                ocsTrips: {
                  next: [
                    ocsTripFactory.build({
                      scheduledDeparture: dateTimeFromISO(
                        "2025-04-29T22:45:00.000Z",
                      ),
                    }),
                  ],
                },
                tripUpdate: tripUpdateFactory.build({
                  stopTimeUpdates: [
                    stopTimeUpdateFactory.build({
                      predictedArrivalTime: dateTimeFromISO(
                        "2025-04-29T22:39:00.000Z",
                      ),
                    }),
                  ],
                }),
              }),
            }}
            close={() => {}}
          />,
        );
        expect(view.queryByText(/earlier/)).not.toBeInTheDocument();
      });

      test("everything all at once", () => {
        const view = render(
          <SideBar
            selection={{
              vehicle: vehicleFactory.build({
                ocsTrips: {
                  current: ocsTripFactory.build({
                    nextUid: "22222222",
                    actualDeparture: dateTimeFromISO(
                      "2025-04-29T21:48:00.000Z",
                    ),
                  }),
                  next: [
                    ocsTripFactory.build({
                      scheduledDeparture: dateTimeFromISO(
                        "2025-04-29T22:45:00.000Z",
                      ),
                    }),
                  ],
                },
                tripUpdate: tripUpdateFactory.build({
                  stopTimeUpdates: [
                    stopTimeUpdateFactory.build({
                      predictedArrivalTime: dateTimeFromISO(
                        "2025-04-29T22:50:00.000Z",
                      ),
                    }),
                  ],
                }),
              }),
            }}
            close={() => {}}
          />,
        );
        expect(view.getByText(/^7 min late/)).toBeInTheDocument();
        expect(view.getByText(/^26 min later/)).toBeInTheDocument();
        expect(view.getByText(/^5 min later/)).toBeInTheDocument();
      });
    });
  });

  describe("Export vehicle data button (for debugging)", () => {
    test("by default, does not render export button", () => {
      const view = render(
        <SideBar
          selection={{
            vehicle: vehicleFactory.build(),
          }}
          close={() => {}}
        />,
      );

      expect(
        view.queryByAltText("Download vehicle data (debug)"),
      ).not.toBeInTheDocument();
    });

    test("renders export button if feature flag is enabled", () => {
      putEnabledFeatures(["ladder_side_bar_export"]);

      const vehicle = vehicleFactory.build();
      const view = render(
        // Must wrap sidebar in router to allow Link elements
        <MemoryRouter>
          <SideBar selection={{ vehicle }} close={() => {}} />,
        </MemoryRouter>,
      );

      expect(
        view.getByAltText("Download vehicle data (debug)"),
      ).toBeInTheDocument();

      expect(useVehicleDataDownload).toHaveBeenCalledWith(vehicle);
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
        expect(view.getAllByText("---")).toHaveLength(1);
      });
    });

    describe("actual departure time", () => {
      test("is displayed if available", () => {
        const view = render(
          <SideBar
            selection={{ vehicle: vehicleFactory.build() }}
            close={() => {}}
          />,
        );
        expect(view.getByText("5:43p")).toBeInTheDocument();
      });
    });
  });
});

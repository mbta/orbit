import { SideBar } from "../../../components/ladderPageShared/sidebar";
import { dateTimeFromISO } from "../../../dateTime";
import { StopStatus } from "../../../models/vehiclePosition";
import {
  ocsTripFactory,
  stopTimeUpdateFactory,
  tripUpdateFactory,
  vehicleFactory,
  vehiclePositionFactory,
} from "../../helpers/factory";
import { putEnabledFeatures } from "../../helpers/metadata";
import { render, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";

describe("sidebar", () => {
  test("contains consist with bolded lead car", () => {
    const view = render(
      <SideBar
        selection={{ vehicle: vehicleFactory.build() }}
        close={() => {}}
      />,
    );

    // lead car is now in sidebar header so it appears twice now
    expect(
      view
        .getAllByText("1877")
        .some((car) => car.classList.contains("font-bold")),
    ).toBe(true);
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
                    destinationStation: "JFK/ UMASS ASH",
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
        expect(
          view.getByText(
            (_, element) => element?.textContent === "Departed Alewife",
          ),
        ).toBeInTheDocument();
        expect(
          view.getByText(
            (_, element) => element?.textContent === "Arriving at JFK",
          ),
        ).toBeInTheDocument();

        // next trip
        const nextSection = view.getByTestId("next-trip-section");
        const scoped = within(nextSection);

        expect(scoped.getByText(/Next Trip/i)).toBeInTheDocument();
        expect(
          scoped.getByText(
            (_, element) => element?.textContent === "JFK to Kendall",
          ),
        ).toBeInTheDocument();
      });

      test("shows next scheduled departure if present", () => {
        const view = render(
          <SideBar
            selection={{
              vehicle: vehicleFactory.build({
                ocsTrips: {
                  current: ocsTripFactory.build({
                    nextUid: "22222222",
                    destinationStation: "ASHMONT",
                  }),
                  next: [
                    ocsTripFactory.build({
                      scheduledDeparture: dateTimeFromISO(
                        // next scheduled dep is 2:10pm
                        "2025-07-07T18:10:00.000Z",
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
        // only uses actualDeparture and predictedArrivalTime, no scheduled times.

        //next trip
        expect(
          view.getByText(
            (_, element) => element?.textContent === "Ashmont to Alewife",
          ),
        ).toBeInTheDocument();
        expect(view.getByText(/2:10p Sched/)).toBeInTheDocument();
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
        // only displays offsets for current scheduled dep time in header
        expect(view.getByText(/\(\+2\)/)).toBeInTheDocument();
        expect(view.queryByText(/\(\+3\)/)).not.toBeInTheDocument();
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
        // only displays offsets for current scheduled dep time in header
        expect(view.getByText(/\(-2\)/)).toBeInTheDocument();
        expect(view.queryByText(/\(-3\)/)).not.toBeInTheDocument();
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
      test("does not show if destination stations mismatch", () => {
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
                      stationId: "place-brdwy",
                    }),
                  ],
                }),
              }),
            }}
            close={() => {}}
          />,
        );
        expect(view.queryByText(/^ min later/)).not.toBeInTheDocument();
      });

      test("shows if arriving 1 minute later than next trip's scheduled departure", () => {
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
                      originStation: "ALEWIFE",
                      destinationStation: "ASHMONT",
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
                        "2025-04-29T22:46:00.000Z",
                      ),
                    }),
                  ],
                }),
              }),
            }}
            close={() => {}}
          />,
        );
        expect(view.getByText(/^1 min later/)).toBeInTheDocument();
      });

      test("does not show if arriving less than 1 minute later than next trip's scheduled departure", () => {
        const view = render(
          <SideBar
            selection={{
              vehicle: vehicleFactory.build({
                ocsTrips: {
                  next: [
                    ocsTripFactory.build({
                      originStation: "ALEWIFE",
                      destinationStation: "ASHMONT",
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
                        "2025-04-29T22:45:30.000Z",
                      ),
                    }),
                  ],
                }),
              }),
            }}
            close={() => {}}
          />,
        );
        expect(view.queryByText(/^min later/)).not.toBeInTheDocument();
      });

      test("does not show if arriving earlier than next trip's scheduled departure", () => {
        const view = render(
          <SideBar
            selection={{
              vehicle: vehicleFactory.build({
                ocsTrips: {
                  next: [
                    ocsTripFactory.build({
                      originStation: "ALEWIFE",
                      destinationStation: "ASHMONT",
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
                        "2025-04-29T22:44:59.000Z",
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

      test("does not show if arriving ON next trip's scheduled departure", () => {
        const view = render(
          <SideBar
            selection={{
              vehicle: vehicleFactory.build({
                ocsTrips: {
                  next: [
                    ocsTripFactory.build({
                      originStation: "ALEWIFE",
                      destinationStation: "ASHMONT",
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
                        "2025-04-29T22:45:00.000Z",
                      ),
                    }),
                  ],
                }),
              }),
            }}
            close={() => {}}
          />,
        );
        expect(
          view.queryByText(/than next trip's departure time./),
        ).not.toBeInTheDocument();
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
                      // Current Trip/actual dep no longer has adherence warning
                      "2025-04-29T21:48:00.000Z",
                    ),
                  }),
                  next: [
                    ocsTripFactory.build({
                      originStation: "ALEWIFE",
                      destinationStation: "ASHMONT",
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
                        // est arrival 5 mins later than next trip's scheduled departure
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
        view.queryByTitle("Copy vehicle data (debug)"),
      ).not.toBeInTheDocument();
    });

    test("renders export button if feature flag is enabled", () => {
      putEnabledFeatures(["ladder_sidebar_export"]);

      const vehicle = vehicleFactory.build();
      const view = render(
        // Must wrap sidebar in router to allow Link elements
        <MemoryRouter>
          <SideBar selection={{ vehicle }} close={() => {}} />,
        </MemoryRouter>,
      );

      expect(view.getByTitle("Copy vehicle data (debug)")).toBeInTheDocument();
    });
  });

  describe("Current Location section", () => {
    test("shows 'Boarding at [station]' when stopped at a station", () => {
      const vehicle = vehicleFactory.build({
        vehiclePosition: vehiclePositionFactory.build({
          stationId: "place-pktrm", // Park Street
          stopStatus: StopStatus.StoppedAt,
        }),
        tripUpdate: tripUpdateFactory.build(),
        ocsTrips: { current: null, next: [] },
      });

      const view = render(
        <MemoryRouter>
          <SideBar selection={{ vehicle }} close={() => {}} />
        </MemoryRouter>,
      );

      const currentLocationSection = view.getByTestId(
        "current-location-section",
      );
      const scoped = within(currentLocationSection);

      expect(scoped.getByText(/Boarding at/i)).toBeInTheDocument();
      expect(scoped.getByText(/Park Street/i)).toBeInTheDocument();
    });

    test("shows 'Next stop [station]' when in-transit to a station", () => {
      const vehicle = vehicleFactory.build({
        vehiclePosition: vehiclePositionFactory.build({
          stationId: "place-pktrm",
          stopStatus: StopStatus.InTransitTo,
        }),
        tripUpdate: tripUpdateFactory.build(),
        ocsTrips: { current: null, next: [] },
      });

      const view = render(
        <MemoryRouter>
          <SideBar selection={{ vehicle }} close={() => {}} />
        </MemoryRouter>,
      );

      const currentLocationSection = view.getByTestId(
        "current-location-section",
      );
      const scoped = within(currentLocationSection);

      expect(scoped.getByText(/Next stop/i)).toBeInTheDocument();
      expect(scoped.getByText(/Park Street/i)).toBeInTheDocument();
    });

    test("falls back to placeholder when station info is missing", () => {
      const vehicle = vehicleFactory.build({
        vehiclePosition: vehiclePositionFactory.build({
          stationId: null,
          stopStatus: StopStatus.InTransitTo,
        }),
        tripUpdate: tripUpdateFactory.build({ stopTimeUpdates: [] }),
        ocsTrips: { current: null, next: [] },
      });

      const view = render(
        <MemoryRouter>
          <SideBar selection={{ vehicle }} close={() => {}} />
        </MemoryRouter>,
      );

      const currentLocationSection = view.getByTestId(
        "current-location-section",
      );
      const scoped = within(currentLocationSection);

      expect(scoped.getByText("--")).toBeInTheDocument();
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
        expect(
          view.getByText(
            (_, element) => element?.textContent === "Arriving at Alewife",
          ),
        ).toBeInTheDocument();
        expect(view.getByText("5:51p")).toBeInTheDocument();
      });

      test("is arrival prediction for OCS provided destination even if RTR provides additional STUs", () => {
        const view = render(
          <SideBar
            selection={{
              vehicle: vehicleFactory.build({
                tripUpdate: tripUpdateFactory.build({
                  stopTimeUpdates: [
                    stopTimeUpdateFactory.build({
                      predictedArrivalTime: dateTimeFromISO(
                        "2025-04-29T21:51:38Z",
                      ),
                      stationId: "place-brdwy",
                    }),
                    stopTimeUpdateFactory.build({
                      predictedArrivalTime: dateTimeFromISO(
                        "2025-04-29T21:53:38Z",
                      ),
                      stationId: "place-asmnl",
                    }),
                  ],
                }),
                ocsTrips: {
                  current: ocsTripFactory.build({
                    originStation: "ALEWIFE",
                    destinationStation: "BROADWAY",
                  }),
                  next: [ocsTripFactory.build()],
                },
              }),
            }}
            close={() => {}}
          />,
        );
        expect(view.getByText("5:51p")).toBeInTheDocument();
      });

      // NOTE: when other sidebar fields are hooked up, perhaps consolidate testing
      // for "--" placeholders into one test mocking missing data for all fields
      test("displays '--' when unavailable", () => {
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
        expect(view.getAllByText("--")).toHaveLength(1);
      });

      test("displays '--' when destination stations mismatch", () => {
        const view = render(
          <SideBar
            selection={{
              vehicle: vehicleFactory.build({
                tripUpdate: tripUpdateFactory.build({
                  stopTimeUpdates: [
                    stopTimeUpdateFactory.build({ stationId: "place-davis" }),
                  ],
                }),
                ocsTrips: {
                  current: ocsTripFactory.build(),
                  next: [ocsTripFactory.build()],
                },
              }),
            }}
            close={() => {}}
          />,
        );
        expect(view.getAllByText("--")).toHaveLength(1);
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
        expect(
          view.getByText(
            (_, element) => element?.textContent === "Departed Ashmont",
          ),
        ).toBeInTheDocument();
        expect(view.getByText("5:43p")).toBeInTheDocument();
      });
    });
  });

  test("renders strikethrough when origin station is updated", () => {
    const view = render(
      <MemoryRouter>
        <SideBar
          selection={{
            vehicle: vehicleFactory.build({
              ocsTrips: {
                current: ocsTripFactory.build({
                  originStation: "ASHMONT",
                  originStationUpdated: "JFK",
                  nextUid: null,
                }),
                next: [],
              },
            }),
          }}
          close={() => {}}
        />
      </MemoryRouter>,
    );

    const scheduled = view.getByText("Ashmont");
    const updated = view.getByText("JFK");

    expect(scheduled).toHaveClass("line-through");
    expect(updated).toBeInTheDocument();
  });

  test("renders only updated station if scheduled station is missing", () => {
    const view = render(
      <MemoryRouter>
        <SideBar
          selection={{
            vehicle: vehicleFactory.build({
              ocsTrips: {
                current: ocsTripFactory.build({
                  originStation: null,
                  originStationUpdated: "JFK",
                  nextUid: null,
                }),
                next: [],
              },
            }),
          }}
          close={() => {}}
        />
      </MemoryRouter>,
    );

    const updatedAsScheduled = view.getByText("JFK");
    expect(updatedAsScheduled).not.toHaveClass("line-through");
    expect(updatedAsScheduled).toBeInTheDocument();
  });

  describe("Next Trip section", () => {
    test("renders 'None' for Next Trip next trip is explicitly unset", () => {
      const view = render(
        <SideBar
          selection={{
            vehicle: vehicleFactory.build(),
          }}
          close={() => {}}
        />,
      );
      expect(view.getByText("Next Trip")).toBeInTheDocument();
      expect(view.getByText("None")).toBeInTheDocument();
    });

    test("displays '--' when scheduled departure time not available", () => {
      const view = render(
        <SideBar
          selection={{
            vehicle: vehicleFactory.build({
              ocsTrips: {
                current: ocsTripFactory.build({ nextUid: "222222" }),
                next: [
                  ocsTripFactory.build({
                    originStation: "ALEWIFE",
                    destinationStation: "ASHMONT",
                    scheduledDeparture: null,
                  }),
                ],
              },
            }),
          }}
          close={() => {}}
        />,
      );

      const nextSection = view.getByTestId("next-trip-section");
      const scoped = within(nextSection);

      expect(scoped.getByText("Next Trip")).toBeInTheDocument();
      expect(
        scoped.getByText(
          (_, element) => element?.textContent === "Alewife to Ashmont",
        ),
      ).toBeInTheDocument();
      expect(scoped.getAllByText("--")).toHaveLength(1);
    });

    test("displays '--' when next trip stations unavailable", () => {
      const view = render(
        <SideBar
          selection={{
            vehicle: vehicleFactory.build({
              ocsTrips: {
                current: ocsTripFactory.build({ nextUid: "222222" }),
                next: [
                  ocsTripFactory.build({
                    originStation: null,
                    destinationStation: null,
                    scheduledDeparture: dateTimeFromISO(
                      // next scheduled dep is 2:10pm
                      "2025-07-07T18:10:00.000Z",
                    ),
                  }),
                ],
              },
            }),
          }}
          close={() => {}}
        />,
      );

      const nextSection = view.getByTestId("next-trip-section");
      const scoped = within(nextSection);

      expect(scoped.getByText("Next Trip")).toBeInTheDocument();
      expect(scoped.getAllByText("--")).toHaveLength(1);
      expect(scoped.getByText(/2:10p Sched/)).toBeInTheDocument();
    });

    test("displays '--' when individual next trip station unavailable", () => {
      const view = render(
        <SideBar
          selection={{
            vehicle: vehicleFactory.build({
              ocsTrips: {
                current: ocsTripFactory.build({ nextUid: "222222" }),
                next: [
                  ocsTripFactory.build({
                    originStation: "ALEWIFE",
                    destinationStation: null,
                    scheduledDeparture: dateTimeFromISO(
                      // next scheduled dep is 2:10pm
                      "2025-07-07T18:10:00.000Z",
                    ),
                  }),
                ],
              },
            }),
          }}
          close={() => {}}
        />,
      );

      const nextSection = view.getByTestId("next-trip-section");
      const scoped = within(nextSection);

      expect(scoped.getByText("Next Trip")).toBeInTheDocument();
      expect(
        scoped.getByText(
          (_, element) => element?.textContent === "Alewife to --",
        ),
      ).toBeInTheDocument();
      expect(scoped.getByText(/2:10p Sched/)).toBeInTheDocument();
    });
  });
});

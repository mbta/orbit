import {
  Ladders,
  vehicleWithExpressCorrection,
} from "../../../components/ladderPage/ladder";
import { LadderRungs } from "../../../data/stations";
import { LatLng } from "rail-tech-ui";
import { StopStatus } from "../../../models/vehiclePosition";
import {
  tripUpdateFactory,
  vehicleFactory,
  vehiclePositionFactory,
} from "../../helpers/factory";
import { render } from "@testing-library/react";
import { Ladder } from "rail-tech-ui";
import type { TrainLoc } from "rail-tech-ui/dist/src/models/trainLocation";

jest.mock("rail-tech-ui", () => ({
  Ladder: jest.fn(() => null),
}));
const mockLadder = jest.mocked(Ladder);

const location = (stationId: string): LatLng => {
  const station = LadderRungs.Red.flat().find(({ id }) => id === stationId);
  if (!station) throw new Error(`Unknown station ${stationId}`);
  return station.location;
};

const between = (
  firstStationId: string,
  secondStationId: string,
  proportion = 0.5,
): LatLng => {
  const first = location(firstStationId);
  const second = location(secondStationId);
  return {
    latitude: first.latitude + (second.latitude - first.latitude) * proportion,
    longitude:
      first.longitude + (second.longitude - first.longitude) * proportion,
  };
};

const inTransitVehicle = ({
  directionId,
  stationId,
  stopId,
  position,
  routePatternId = "Red-1-0",
}: {
  directionId: number;
  stationId: string;
  stopId: string;
  position: LatLng;
  routePatternId?: string;
}) =>
  vehicleFactory.build({
    vehiclePosition: vehiclePositionFactory.build({
      directionId,
      stationId,
      stopId,
      position,
      stopStatus: StopStatus.InTransitTo,
    }),
    tripUpdate: tripUpdateFactory.build({ routePatternId }),
  });

describe("vehicleWithExpressCorrection", () => {
  test.each([
    {
      name: "southbound express on the trunk",
      vehicle: {
        directionId: 0,
        stationId: "place-sstat",
        stopId: "70079",
        position: between("place-chmnl", "place-pktrm"),
      },
      expectedStationId: "place-pktrm",
      expectedLadder: 0,
    },
    {
      name: "northbound express on the trunk",
      vehicle: {
        directionId: 1,
        stationId: "place-davis",
        stopId: "70064",
        position: between("place-harsq", "place-cntsq"),
      },
      expectedStationId: "place-harsq",
      expectedLadder: 0,
    },
    {
      name: "northbound express from a branch",
      vehicle: {
        directionId: 1,
        stationId: "place-jfk",
        stopId: "70086",
        position: between("place-smmnl", "place-fldcr"),
      },
      expectedStationId: "place-fldcr",
      expectedLadder: 1,
    },
    {
      name: "southbound express from the trunk onto a branch",
      vehicle: {
        directionId: 0,
        stationId: "place-qnctr",
        stopId: "70101",
        position: between("place-sstat", "place-brdwy"),
        routePatternId: "Red-3-0",
      },
      expectedStationId: "place-brdwy",
      expectedLadder: 0,
    },
    {
      name: "vehicle past its destination",
      vehicle: {
        directionId: 0,
        stationId: "place-davis",
        stopId: "70063",
        position: between("place-portr", "place-harsq"),
      },
      expectedStationId: "place-harsq",
      expectedLadder: 0,
    },
  ])(
    "corrects the station for a $name",
    ({ vehicle, expectedStationId, expectedLadder }) => {
      const result = vehicleWithExpressCorrection(
        inTransitVehicle(vehicle),
        LadderRungs.Red,
      );

      expect(result?.ladderRungs).toBe(LadderRungs.Red[expectedLadder]);
      expect(result?.vehicle.vehiclePosition).toMatchObject({
        stationId: expectedStationId,
        stopId: vehicle.stopId,
      });
    },
  );

  test.each([
    { stopId: "70088", expectedStationId: "place-shmnl" },
    { stopId: "70090", expectedStationId: "place-fldcr" },
    { stopId: "70092", expectedStationId: "place-smmnl" },
  ])(
    "uses the station of stopId $stopId when the stationId disagrees",
    ({ stopId, expectedStationId }) => {
      const result = vehicleWithExpressCorrection(
        inTransitVehicle({
          directionId: 1,
          stationId: "place-jfk",
          stopId,
          position: location(expectedStationId),
        }),
        LadderRungs.Red,
      );

      expect(result?.ladderRungs).toBe(LadderRungs.Red[1]);
      expect(result?.vehicle.vehiclePosition).toMatchObject({
        stationId: expectedStationId,
        stopId,
      });
    },
  );

  test.each([
    {
      name: "in transit between adjacent stations",
      vehiclePosition: {
        stopStatus: StopStatus.InTransitTo,
        position: between("place-cntsq", "place-harsq"),
      },
    },
    {
      name: "stopped at a station",
      vehiclePosition: {
        stopStatus: StopStatus.StoppedAt,
        position: between("place-cntsq", "place-knncl"),
      },
    },
    {
      name: "without a position",
      vehiclePosition: { stopStatus: StopStatus.InTransitTo, position: null },
    },
  ])("does not correct a vehicle $name", ({ vehiclePosition }) => {
    const vehicle = vehicleFactory.build({
      vehiclePosition: vehiclePositionFactory.build({
        directionId: 1,
        stationId: "place-harsq",
        stopId: "70068",
        ...vehiclePosition,
      }),
    });

    const result = vehicleWithExpressCorrection(vehicle, LadderRungs.Red);

    expect(result?.ladderRungs).toBe(LadderRungs.Red[0]);
    expect(result?.vehicle.vehiclePosition).toEqual(vehicle.vehiclePosition);
  });

  test("keeps the corrected ladder when the stationId is already correct", () => {
    const result = vehicleWithExpressCorrection(
      inTransitVehicle({
        directionId: 0,
        stationId: "place-andrw",
        stopId: "70087",
        position: between("place-brdwy", "place-andrw"),
      }),
      LadderRungs.Red,
    );

    expect(result?.ladderRungs).toBe(LadderRungs.Red[0]);
    expect(result?.vehicle.vehiclePosition).toMatchObject({
      stationId: "place-andrw",
      stopId: "70087",
    });
  });
});

describe("Ladders express vehicles", () => {
  const trainLocsByLadder = (
    vehicle: ReturnType<typeof inTransitVehicle>,
  ): TrainLoc[][] => {
    render(
      <Ladders
        routeId="Red"
        vehicles={[vehicle]}
        sideBarSelection={null}
        setSideBarSelection={jest.fn()}
        setBranchPickerSelection={jest.fn()}
      />,
    );
    return mockLadder.mock.calls.map(
      ([props]) => (props as { trainLocs: TrainLoc[] }).trainLocs,
    );
  };

  test("plots an express vehicle between the stations it is actually between", () => {
    const trainLocs = trainLocsByLadder(
      inTransitVehicle({
        directionId: 0,
        stationId: "place-jfk",
        stopId: "70085",
        position: between("place-sstat", "place-brdwy"),
      }),
    );

    expect(trainLocs.map((locs) => locs.length)).toEqual([1, 0, 0]);
    expect(trainLocs[0][0]).toMatchObject({ stationId: "place-brdwy" });
  });

  test("applies the Andrew/JFK threshold after correcting an express vehicle", () => {
    const trainLocs = trainLocsByLadder(
      inTransitVehicle({
        directionId: 0,
        stationId: "place-shmnl",
        stopId: "70087",
        position: between("place-andrw", "place-jfk", 0.25),
      }),
    );

    expect(trainLocs.map((locs) => locs.length)).toEqual([1, 0, 0]);
    expect(trainLocs[0][0]).toMatchObject({ stationId: "place-jfk" });
  });
});

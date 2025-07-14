import { RouteId } from "../models/common";
import { Station } from "../models/station";
import { capitalizeFirstLetter } from "../util/string";

export type LadderConfig = Station[];

export const Stations: Record<RouteId, LadderConfig[]> = {
  Red: [
    // Alewife <-> Andrew
    [
      {
        id: "place-alfcl",
        stop_ids: ["Alewife-01", "Alewife-02", "70061"],
        name: "Alewife",
        spacingRatio: 3.5,
        location: { latitude: 42.39583, longitude: -71.141287 },
        forcedDirections: new Map([
          ["Alewife-01", 1],
          ["Alewife-02", 0],
        ]),
      },
      {
        id: "place-davis",
        stop_ids: ["70063", "70064"],
        name: "Davis",
        spacingRatio: 1.5,
        location: { latitude: 42.39674, longitude: -71.121815 },
      },
      {
        id: "place-portr",
        stop_ids: ["70065", "70066"],
        name: "Porter",
        spacingRatio: 2.5,
        location: { latitude: 42.3884, longitude: -71.119149 },
      },
      {
        id: "place-harsq",
        stop_ids: ["70067", "70068"],
        name: "Harvard",
        spacingRatio: 2.5,
        location: { latitude: 42.373362, longitude: -71.118956 },
      },
      {
        id: "place-cntsq",
        stop_ids: ["70069", "70070"],
        name: "Central",
        spacingRatio: 1.25,
        location: { latitude: 42.365486, longitude: -71.103802 },
      },
      {
        id: "place-knncl",
        stop_ids: ["70071", "70072"],
        name: "Kendall",
        spacingRatio: 1.25,
        location: { latitude: 42.362491, longitude: -71.086176 },
      },
      {
        id: "place-chmnl",
        stop_ids: ["70073", "70074"],
        name: "Charles",
        spacingRatio: 1.75,
        location: { latitude: 42.361166, longitude: -71.070628 },
      },
      {
        id: "place-pktrm",
        stop_ids: ["70075", "70076"],
        name: "Park",
        spacingRatio: 1,
        location: { latitude: 42.356395, longitude: -71.062424 },
      },
      {
        id: "place-dwnxg",
        stop_ids: ["70077", "70078"],
        name: "Dwt Xing",
        spacingRatio: 1.375,
        location: { latitude: 42.355518, longitude: -71.060225 },
      },
      {
        id: "place-sstat",
        stop_ids: ["70079", "70080"],
        name: "South Sta",
        spacingRatio: 1.375,
        location: { latitude: 42.352271, longitude: -71.055242 },
      },
      {
        id: "place-brdwy",
        stop_ids: ["70081", "70082"],
        name: "Broadway",
        spacingRatio: 1.25,
        location: { latitude: 42.342622, longitude: -71.056967 },
      },
      {
        id: "place-andrw",
        stop_ids: ["70083", "70084"],
        name: "Andrew",
        spacingRatio: 0,
        location: { latitude: 42.330154, longitude: -71.057655 },
      },
    ],
    // JFK <-> Ashmont
    [
      {
        id: "place-jfk",
        stop_ids: ["70085", "70086"],
        name: "JFK",
        spacingRatio: 1.5,
        location: { latitude: 42.320685, longitude: -71.052391 },
      },
      {
        id: "place-shmnl",
        stop_ids: ["70087", "70088"],
        name: "Savin Hill",
        spacingRatio: 1.25,
        location: { latitude: 42.31129, longitude: -71.053331 },
      },
      {
        id: "place-fldcr",
        stop_ids: ["70089", "70090"],
        name: "Flds Corner",
        spacingRatio: 1.25,
        location: { latitude: 42.300093, longitude: -71.061667 },
      },
      {
        id: "place-smmnl",
        stop_ids: ["70091", "70092"],
        name: "Shawmut",
        spacingRatio: 1,
        location: { latitude: 42.293126, longitude: -71.065738 },
      },
      {
        id: "place-asmnl",
        stop_ids: ["70093", "70094"],
        name: "Ashmont",
        spacingRatio: 0,
        location: { latitude: 42.28452, longitude: -71.063777 },
      },
    ],
    // JFK <-> Braintree
    [
      {
        id: "place-jfk",
        stop_ids: ["70095", "70096"],
        name: "JFK",
        spacingRatio: 7,
        location: { latitude: 42.320685, longitude: -71.052391 },
      },
      {
        id: "place-nqncy",
        stop_ids: ["70097", "70098"],
        name: "N Quincy",
        spacingRatio: 1.5,
        location: { latitude: 42.275275, longitude: -71.029583 },
      },
      {
        id: "place-wlsta",
        stop_ids: ["70099", "70100"],
        name: "Wollaston",
        spacingRatio: 2.5,
        location: { latitude: 42.266514, longitude: -71.020337 },
      },
      {
        id: "place-qnctr",
        stop_ids: ["70101", "70102"],
        name: "Quincy Ctr",
        spacingRatio: 3.5,
        location: { latitude: 42.251809, longitude: -71.005409 },
      },
      {
        id: "place-qamnl",
        stop_ids: ["70103", "70104"],
        name: "Quincy Adams",
        spacingRatio: 7,
        location: { latitude: 42.233391, longitude: -71.007153 },
      },
      {
        id: "place-brntn",
        stop_ids: ["70105", "Braintree-01", "Braintree-02"],
        name: "Braintree",
        spacingRatio: 0,
        location: { latitude: 42.207854, longitude: -71.001138 },
        forcedDirections: new Map([
          ["Braintree-01", 1],
          ["Braintree-02", 0],
        ]),
      },
    ],
  ],
};

export const getNameForId = (id: string | null | undefined) => {
  if (id === undefined || id === null) {
    return undefined;
  }

  return Object.values(Stations)
    .flat()
    .flat()
    .find((station) => station.id === id)?.name;
};

export const formatStationName = (station: string | null | undefined) => {
  if (station === undefined || station === null) {
    return undefined;
  }
  if (station.startsWith("JFK")) {
    return "JFK";
  }
  if (station.startsWith("KENDALL")) {
    return "Kendall";
  }
  return station
    .split(" ")
    .map((substr) => capitalizeFirstLetter(substr))
    .join(" ");
};

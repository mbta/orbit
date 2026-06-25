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
        ocs_station_name: "ALEWIFE",
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
        ocs_station_name: "DAVIS SQUARE",
        spacingRatio: 1.5,
        location: { latitude: 42.39674, longitude: -71.121815 },
      },
      {
        id: "place-portr",
        stop_ids: ["70065", "70066"],
        name: "Porter",
        ocs_station_name: "PORTER SQUARE",
        spacingRatio: 2.5,
        location: { latitude: 42.3884, longitude: -71.119149 },
      },
      {
        id: "place-harsq",
        stop_ids: ["70067", "70068"],
        name: "Harvard",
        ocs_station_name: "HARVARD SQUARE",
        spacingRatio: 2.5,
        location: { latitude: 42.373362, longitude: -71.118956 },
      },
      {
        id: "place-cntsq",
        stop_ids: ["70069", "70070"],
        name: "Central",
        ocs_station_name: "CENTRAL SQUARE",
        spacingRatio: 1.25,
        location: { latitude: 42.365486, longitude: -71.103802 },
      },
      {
        id: "place-knncl",
        stop_ids: ["70071", "70072"],
        name: "Kendall",
        ocs_station_name: "KENDALL/MIT",
        spacingRatio: 1.25,
        location: { latitude: 42.362491, longitude: -71.086176 },
      },
      {
        id: "place-chmnl",
        stop_ids: ["70073", "70074"],
        name: "Charles",
        ocs_station_name: "CHARLES/MGH",
        spacingRatio: 1.75,
        location: { latitude: 42.361166, longitude: -71.070628 },
      },
      {
        id: "place-pktrm",
        stop_ids: ["70075", "70076"],
        name: "Park",
        ocs_station_name: "PARK STREET [R]",
        spacingRatio: 1,
        location: { latitude: 42.356395, longitude: -71.062424 },
      },
      {
        id: "place-dwnxg",
        stop_ids: ["70077", "70078"],
        name: "Dwt Xing",
        ocs_station_name: "DOWNTOWN CROSSING R",
        spacingRatio: 1.375,
        location: { latitude: 42.355518, longitude: -71.060225 },
      },
      {
        id: "place-sstat",
        stop_ids: ["70079", "70080"],
        name: "South Sta",
        ocs_station_name: "SOUTH STATION",
        spacingRatio: 1.375,
        location: { latitude: 42.352271, longitude: -71.055242 },
      },
      {
        id: "place-brdwy",
        stop_ids: ["70081", "70082"],
        name: "Broadway",
        ocs_station_name: "BROADWAY",
        spacingRatio: 1.25,
        location: { latitude: 42.342622, longitude: -71.056967 },
      },
      {
        id: "place-andrw",
        stop_ids: ["70083", "70084"],
        name: "Andrew",
        ocs_station_name: "ANDREW SQUARE",
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
        ocs_station_name: "JFK/ UMASS ASH",
        spacingRatio: 1.5,
        location: { latitude: 42.320685, longitude: -71.052391 },
      },
      {
        id: "place-shmnl",
        stop_ids: ["70087", "70088"],
        name: "Savin Hill",
        ocs_station_name: "SAVIN HILL",
        spacingRatio: 1.25,
        location: { latitude: 42.31129, longitude: -71.053331 },
      },
      {
        id: "place-fldcr",
        stop_ids: ["70089", "70090"],
        name: "Flds Corner",
        ocs_station_name: "FIELDS CORNER",
        spacingRatio: 1.25,
        location: { latitude: 42.300093, longitude: -71.061667 },
      },
      {
        id: "place-smmnl",
        stop_ids: ["70091", "70092"],
        name: "Shawmut",
        ocs_station_name: "SHAWMUT",
        spacingRatio: 1,
        location: { latitude: 42.293126, longitude: -71.065738 },
      },
      {
        id: "place-asmnl",
        stop_ids: ["70093", "70094"],
        name: "Ashmont",
        ocs_station_name: "ASHMONT",
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
        ocs_station_name: "JFK/ UMASS BRT",
        spacingRatio: 7,
        location: { latitude: 42.320685, longitude: -71.052391 },
      },
      {
        id: "place-nqncy",
        stop_ids: ["70097", "70098"],
        name: "N Quincy",
        ocs_station_name: "NORTH QUINCY",
        spacingRatio: 1.5,
        location: { latitude: 42.275275, longitude: -71.029583 },
      },
      {
        id: "place-wlsta",
        stop_ids: ["70099", "70100"],
        name: "Wollaston",
        ocs_station_name: "WOLLASTON",
        spacingRatio: 2.5,
        location: { latitude: 42.266514, longitude: -71.020337 },
      },
      {
        id: "place-qnctr",
        stop_ids: ["70101", "70102"],
        name: "Quincy Ctr",
        ocs_station_name: "QUINCY CENTER",
        spacingRatio: 3.5,
        location: { latitude: 42.251809, longitude: -71.005409 },
      },
      {
        id: "place-qamnl",
        stop_ids: ["70103", "70104"],
        name: "Quincy Adams",
        ocs_station_name: "QUINCY ADAMS",
        spacingRatio: 7,
        location: { latitude: 42.233391, longitude: -71.007153 },
      },
      {
        id: "place-brntn",
        stop_ids: ["70105", "Braintree-01", "Braintree-02"],
        name: "Braintree",
        ocs_station_name: "BRAINTREE",
        spacingRatio: 0,
        location: { latitude: 42.207854, longitude: -71.001138 },
        forcedDirections: new Map([
          ["Braintree-01", 1],
          ["Braintree-02", 0],
        ]),
      },
    ],
  ],
  Orange: [
    [
      {
        id: "place-ogmnl",
        name: "Oak Grove",
        ocs_station_name: "OAK GROVE",
        spacingRatio: 2.5,
        location: { latitude: 42.437735, longitude: -71.070875 },
        stop_ids: ["70036", "Oak Grove-01", "Oak Grove-02"],
        forcedDirections: new Map([
          // TODO: verify platforms
          ["Oak Grove-01", 1],
          ["Oak Grove-02", 0],
        ]),
      },
      {
        id: "place-mlmnl",
        name: "Malden Ctr",
        ocs_station_name: "MALDEN CENTER",
        spacingRatio: 4.5,
        location: { latitude: 42.426677, longitude: -71.074381 },
        stop_ids: ["70034", "70035"],
      },
      {
        id: "place-welln",
        name: "Wellington",
        ocs_station_name: "WELLINGTON",
        spacingRatio: 2.25,
        location: { latitude: 42.401505, longitude: -71.077252 },
        stop_ids: ["70032", "70033"],
      },
      {
        id: "place-astao",
        name: "Assembly",
        ocs_station_name: "ASSEMBLY",
        spacingRatio: 1.0,
        location: { latitude: 42.392331, longitude: -71.077262 },
        stop_ids: ["70278", "70279"],
      },
      {
        id: "place-sull",
        name: "Sullivan Square",
        ocs_station_name: "SULLIVAN SQUARE",
        spacingRatio: 1.75,
        location: { latitude: 42.383975, longitude: -71.076994 },
        stop_ids: ["70030", "70031"],
      },
      {
        id: "place-ccmnl",
        name: "Comm Coll",
        ocs_station_name: "COMMUNITY COLLEGE",
        spacingRatio: 2.75,
        location: { latitude: 42.373622, longitude: -71.069533 },
        stop_ids: ["70028", "70029"],
      },
      {
        id: "place-north",
        name: "N Station",
        ocs_station_name: "NORTH STATION",
        spacingRatio: 1.75,
        location: { latitude: 42.36528, longitude: -71.060205 },
        stop_ids: ["70026", "70027"],
      },
      {
        id: "place-haecl",
        name: "Haymarket",
        ocs_station_name: "HAYMARKET",
        spacingRatio: 1.25,
        location: { latitude: 42.363021, longitude: -71.05829 },
        stop_ids: ["70024", "70025"],
      },
      {
        id: "place-state",
        name: "State",
        ocs_station_name: "STATE STREET",
        spacingRatio: 1.0,
        location: { latitude: 42.358978, longitude: -71.057598 },
        stop_ids: ["70022", "70023"],
      },
      {
        id: "place-dwnxg",
        name: "Dwt Xing",
        ocs_station_name: "DOWNTOWN CROSSING",
        spacingRatio: 0.75,
        location: { latitude: 42.355518, longitude: -71.060225 },
        stop_ids: ["70020", "70021"],
      },
      {
        id: "place-chncl",
        name: "Chinatown",
        ocs_station_name: "CHINATOWN",
        spacingRatio: 0.75,
        location: { latitude: 42.352547, longitude: -71.062752 },
        stop_ids: ["70018", "70019"],
      },
      {
        id: "place-tumnl",
        name: "Med Ctr",
        ocs_station_name: "TUFTS MEDICAL CTR",
        spacingRatio: 1.25,
        location: { latitude: 42.349662, longitude: -71.063917 },
        stop_ids: ["70016", "70017"],
      },
      {
        id: "place-bbsta",
        name: "Back Bay",
        ocs_station_name: "BACK BAY/SOUTH END",
        spacingRatio: 1.5,
        location: { latitude: 42.34735, longitude: -71.075727 },
        stop_ids: ["70014", "70015"],
      },
      {
        id: "place-masta",
        name: "Mass Ave",
        ocs_station_name: "MASS AVE",
        spacingRatio: 1.0,
        location: { latitude: 42.340927, longitude: -71.084188 },
        stop_ids: ["70012", "70013"],
      },
      {
        id: "place-rugg",
        name: "Ruggles",
        ocs_station_name: "RUGGLES",
        spacingRatio: 1.0,
        location: { latitude: 42.33649, longitude: -71.089684 },
        stop_ids: ["70010", "70011"],
      },
      {
        id: "place-rcmnl",
        name: "Roxbury",
        ocs_station_name: "ROXBURY CROSSING",
        spacingRatio: 1.0,
        location: { latitude: 42.330671, longitude: -71.096121 },
        stop_ids: ["70008", "70009"],
      },
      {
        id: "place-jaksn",
        name: "Jackson",
        ocs_station_name: "JACKSON SQUARE",
        spacingRatio: 1.25,
        location: { latitude: 42.323132, longitude: -71.099592 },
        stop_ids: ["70006", "70007"],
      },
      {
        id: "place-sbmnl",
        name: "Stonybrook",
        ocs_station_name: "STONY BROOK",
        spacingRatio: 1.25,
        location: { latitude: 42.317062, longitude: -71.104248 },
        stop_ids: ["70004", "70005"],
      },
      {
        id: "place-grnst",
        name: "Green St",
        ocs_station_name: "GREEN STREET",
        spacingRatio: 1.75,
        location: { latitude: 42.309832, longitude: -71.108059 },
        stop_ids: ["70002", "70003"],
      },
      {
        id: "place-forhl",
        name: "Forest Hills",
        ocs_station_name: "FOREST HILLS",
        spacingRatio: 0,
        location: { latitude: 42.300926, longitude: -71.114129 },
        stop_ids: ["70001", "Forest Hills-01", "Forest Hills-02"],
        forcedDirections: new Map([
          // TODO: verify platforms
          ["Forest Hills-01", 1],
          ["Forest Hills-02", 0],
        ]),
      },
    ],
  ],
  Blue: [
    [
      {
        id: "place-wondl",
        name: "Wonderland",
        stop_ids: ["70059", "70060"],
        ocs_station_name: "WONDERLAND",
        spacingRatio: 0.75,
        location: { latitude: 42.413514, longitude: -70.991714 },
      },
      {
        id: "place-rbmnl",
        name: "Revere",
        stop_ids: ["70057", "70058"],
        ocs_station_name: "REVERE BEACH",
        spacingRatio: 0.75,
        location: { latitude: 42.40776, longitude: -70.992586 },
      },
      {
        id: "place-bmmnl",
        name: "Beackmont", // Typo matches OCS
        stop_ids: ["70055", "70056"],
        ocs_station_name: "BEACHMONT",
        spacingRatio: 1.0,
        location: { latitude: 42.397219, longitude: -70.992647 },
      },
      {
        id: "place-sdmnl",
        name: "Suffolk",
        stop_ids: ["70053", "70054"],
        ocs_station_name: "SUFFOLK DOWNS",
        spacingRatio: 2.0,
        location: { latitude: 42.390422, longitude: -70.997323 },
      },
      {
        id: "place-orhte",
        name: "Orient",
        stop_ids: ["70051", "70052"],
        ocs_station_name: "ORIENT HEIGHTS",
        spacingRatio: 2.25,
        location: { latitude: 42.386909, longitude: -71.004809 },
      },
      {
        id: "place-wimnl",
        name: "Wood",
        stop_ids: ["70049", "70050"],
        ocs_station_name: "WOOD ISLAND",
        spacingRatio: 1.25,
        location: { latitude: 42.37974, longitude: -71.022818 },
      },
      {
        id: "place-aport",
        name: "Airport",
        stop_ids: ["70047", "70048"],
        ocs_station_name: "AIRPORT",
        spacingRatio: 2.5,
        location: { latitude: 42.374262, longitude: -71.030395 },
      },
      {
        id: "place-mvbcl",
        name: "Maverick",
        stop_ids: ["70045", "70046"],
        ocs_station_name: "MAVERICK SQUARE",
        spacingRatio: 2.5,
        location: { latitude: 42.3691186, longitude: -71.0395296 },
      },
      {
        id: "place-aqucl",
        name: "Aquarium",
        stop_ids: ["70043", "70044"],
        ocs_station_name: "AQUARIUM",
        spacingRatio: 1.25,
        location: { latitude: 42.359784, longitude: -71.051652 },
      },
      {
        id: "place-state",
        name: "State",
        stop_ids: ["70041", "70042"],
        ocs_station_name: "STATE STREET [B]",
        spacingRatio: 1.75,
        location: { latitude: 42.358978, longitude: -71.057598 },
      },
      {
        id: "place-gover",
        name: "Gov Center",
        stop_ids: ["70039", "70040"],
        ocs_station_name: "GOVERNMENT CENTER",
        spacingRatio: 1.75,
        location: { latitude: 42.359705, longitude: -71.059215 },
      },
      {
        id: "place-bomnl",
        name: "Bowdoin",
        stop_ids: ["70838", "70038"],
        ocs_station_name: "BOWDOIN",
        spacingRatio: 0.0,
        location: { latitude: 42.361365, longitude: -71.062037 },
      },
    ],
  ],
};

export const DirectionalStopIds = new Map([
  ["Alewife-01", 1],
  ["Alewife-02", 0],
  ["Braintree-01", 1],
  ["Braintree-02", 0],
]);

export const stationSidebarNames = new Map([
  ["JFK/ UMASS ASH", "JFK"],
  ["JFK/ UMASS BRT", "JFK"],
  ["KENDALL/MIT", "Kendall"],
]);

export const formatStationName = (station: string | null | undefined) => {
  if (station === undefined || station === null) {
    return undefined;
  }

  return (
    stationSidebarNames.get(station) ??
    station
      .split(" ")
      .map((substr) => capitalizeFirstLetter(substr))
      .join(" ")
  );
};

export const ocsStationNameToGtfs = (ocsStationName: string): string | null => {
  return (
    Object.values(Stations)
      .flat(2)
      .find((station) => station.ocs_station_name === ocsStationName)?.id ??
    null
  );
};

import { Station } from "../models/station";

const buildStation = (
  id: string,
  name: string,
  spacingRatio: number,
  latitude: number,
  longitude: number,
): Station => ({
  id,
  name,
  spacingRatio,
  location: {
    latitude,
    longitude,
  },
});

export const StationSets = {
  AlewifeAndrew: [
    buildStation("place-alfcl", "Alewife", 3.5, 42.39583, -71.141287),
    buildStation("place-davis", "Davis", 1.5, 42.39674, -71.121815),
    buildStation("place-portr", "Porter", 2.5, 42.3884, -71.119149),
    buildStation("place-harsq", "Harvard", 2.5, 42.373362, -71.118956),
    buildStation("place-cntsq", "Central", 1.25, 42.365486, -71.103802),
    buildStation("place-knncl", "Kendall", 1.25, 42.362491, -71.086176),
    buildStation("place-chmnl", "Charles", 1.75, 42.361166, -71.070628),
    buildStation("place-pktrm", "Park", 1, 42.356395, -71.062424),
    buildStation("place-dwnxg", "Dwt Xing", 1.375, 42.355518, -71.060225),
    buildStation("place-sstat", "South Sta", 1.375, 42.352271, -71.055242),
    buildStation("place-brdwy", "Broadway", 1.25, 42.342622, -71.056967),
    buildStation("place-andrw", "Andrew", 0, 42.330154, -71.057655),
  ],
  JFKAshmont: [
    buildStation("place-jfk", "JFK", 1.5, 42.320685, -71.052391),
    buildStation("place-shmnl", "Savin Hill", 1.25, 42.31129, -71.053331),
    buildStation("place-fldcr", "Flds Corner", 1.25, 42.300093, -71.061667),
    buildStation("place-smmnl", "Shawmut", 1, 42.293126, -71.065738),
    buildStation("place-asmnl", "Ashmont", 0, 42.28452, -71.063777),
  ],
  JFKBraintree: [
    buildStation("place-jfk", "JFK", 7, 42.320685, -71.052391),
    buildStation("place-nqncy", "N Quincy", 1.5, 42.275275, -71.029583),
    buildStation("place-wlsta", "Wollaston", 2.5, 42.266514, -71.020337),
    buildStation("place-qnctr", "Quincy Ctr", 3.5, 42.251809, -71.005409),
    buildStation("place-qamnl", "Quincy Adams", 7, 42.233391, -71.007153),
    buildStation("place-brntn", "Braintree", 0, 42.207854, -71.001138),
  ],
};

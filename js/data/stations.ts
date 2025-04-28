import { Station } from "../models/station";

const buildStation = (
  id: string,
  name: string,
  spacingRatio: number,
): Station => ({
  id,
  name,
  spacingRatio,
});

export const StationSets = {
  AlewifeAndrew: [
    buildStation("place-alfcl", "Alewife", 3.5),
    buildStation("place-davis", "Davis", 1.5),
    buildStation("place-portr", "Porter", 2.5),
    buildStation("place-harsq", "Harvard", 2.5),
    buildStation("place-cntsq", "Central", 1.25),
    buildStation("place-knncl", "Kendall", 1.25),
    buildStation("place-chmnl", "Charles", 1.75),
    buildStation("place-pktrm", "Park", 1),
    buildStation("place-dwnxg", "Dwt Xing", 1.375),
    buildStation("place-sstat", "South Sta", 1.375),
    buildStation("place-brdwy", "Broadway", 1.25),
    buildStation("place-andrw", "Andrew", 0),
  ],
  JFKAshmont: [
    buildStation("place-jfk", "JFK", 1.5),
    buildStation("place-shmnl", "Savin Hill", 1.25),
    buildStation("place-fldcr", "Flds Corner", 1.25),
    buildStation("place-smmnl", "Shawmut", 1),
    buildStation("place-asmnl", "Ashmont", 0),
  ],
  JFKBraintree: [
    buildStation("place-jfk", "JFK", 7),
    buildStation("place-nqncy", "N Quincy", 1.5),
    buildStation("place-wlsta", "Wollaston", 2.5),
    buildStation("place-qnctr", "Quincy Ctr", 3.5),
    buildStation("place-qamnl", "Quincy Adams", 7),
    buildStation("place-brntn", "Braintree", 0),
  ],
};

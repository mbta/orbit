import { Station } from "../models/station";

const buildStation = (id: string, name: string, spacing: number): Station => ({
  id,
  name,
  spacing,
});

export const StationSets = {
  AlewifeAndrew: [
    buildStation("place-alfcl", "Alewife", 28),
    buildStation("place-davis", "Davis", 12),
    buildStation("place-portr", "Porter", 20),
    buildStation("place-harsq", "Harvard", 20),
    buildStation("place-cntsq", "Central", 10),
    buildStation("place-knncl", "Kendall", 10),
    buildStation("place-chmnl", "Charles", 14),
    buildStation("place-pktrm", "Park", 8),
    buildStation("place-dwnxg", "Dwt Xing", 11),
    buildStation("place-sstat", "South Sta", 11),
    buildStation("place-brdwy", "Broadway", 10),
    buildStation("place-andrw", "Andrew", 0),
  ],
  JFKAshmont: [
    buildStation("place-jfk", "JFK", 12),
    buildStation("place-shmnl", "Savin Hill", 10),
    buildStation("place-fldcr", "Flds Corner", 10),
    buildStation("place-smmnl", "Shawmut", 8),
    buildStation("place-asmnl", "Ashmont", 0),
  ],
  JFKBraintree: [
    buildStation("place-jfk", "JFK", 40),
    buildStation("place-nqncy", "N Quincy", 12),
    buildStation("place-wlsta", "Wollaston", 20),
    buildStation("place-qnctr", "Quincy Ctr", 28),
    buildStation("place-qamnl", "Quincy Adams", 40),
    buildStation("place-brntn", "Braintree", 0),
  ],
};

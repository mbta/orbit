import { Station } from "../models/station";

const buildStation = (
  id: string,
  name: string,
  marginBottom: string | null,
  extraStyling: string | null,
): Station => ({
  id,
  name,
  marginBottom,
  extraStyling,
});

export const StationSets = {
  AlewifeAndrew: [
    buildStation("place-alfcl", "Alewife", "mb-28", "pt-20"),
    buildStation("place-davis", "Davis", "mb-12", null),
    buildStation("place-portr", "Porter", "mb-20", null),
    buildStation("place-harsq", "Harvard", "mb-20", null),
    buildStation("place-cntsq", "Central", "mb-10", null),
    buildStation("place-knncl", "Kendall", "mb-10", null),
    buildStation("place-chmnl", "Charles", "mb-14", null),
    buildStation("place-pktrm", "Park", "mb-8", null),
    buildStation("place-dwnxg", "Dwt Xing", "mb-11", null),
    buildStation("place-sstat", "South Sta", "mb-11", null),
    buildStation("place-brdwy", "Broadway", "mb-10", null),
    buildStation("place-andrw", "Andrew", null, "pb-20"),
  ],
  JFKAshmont: [
    buildStation("place-jfk", "JFK", "mb-12", "pt-20"),
    buildStation("place-shmnl", "Savin Hill", "mb-10", null),
    buildStation("place-fldcr", "Flds Corner", "mb-10", null),
    buildStation("place-smmnl", "Shawmut", "mb-8", null),
    buildStation("place-asmnl", "Ashmont", null, "pb-20"),
  ],
  JFKBraintree: [
    buildStation("place-jfk", "JFK", "mb-56", "pt-20"),
    buildStation("place-nqncy", "N Quincy", "mb-12", null),
    buildStation("place-wlsta", "Wollaston", "mb-20", null),
    buildStation("place-qnctr", "Quincy Ctr", "mb-28", null),
    buildStation("place-qamnl", "Quincy Adams", "mb-56", null),
    buildStation("place-brntn", "Braintree", null, "pb-20"),
  ],
};

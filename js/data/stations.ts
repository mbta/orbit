import { Station } from "../models/station";

const buildStation = (id: string, name: string, spacing: number): Station => ({
  id,
  name,
  spacing,
});

export const alewifeAndrewStationsArray: Station[] = [
  buildStation("place-alfcl", "Alewife", 18),
  buildStation("place-davis", "Davis", 10),
  buildStation("place-portr", "Porter", 15),
  buildStation("place-harsq", "Harvard", 15),
  buildStation("place-cntsq", "Central", 8),
  buildStation("place-knncl", "Kendall", 8),
  buildStation("place-chmnl", "Charles", 12),
  buildStation("place-pktrm", "Park", 5),
  buildStation("place-dwnxg", "Dwt Xing", 10),
  buildStation("place-sstat", "South Sta", 10),
  buildStation("place-brdwy", "Broadway", 8),
  buildStation("place-andrw", "Andrew", 5),
];

import { Station } from "../models/station";

const buildStation = (id: string, name: string, spacing: number): Station => ({
  id,
  name,
  spacing,
});

export const alewifeAndrewStationsArray: Station[] = [
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
  buildStation("place-andrw", "Andrew", 8),
];

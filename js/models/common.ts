import { z } from "zod";

export type CarId = string;
export const CarId = z.string();

export type RouteId = string;
export const RouteId = z.string();

export type StationId = string;
export const StationId = z.string();

export type DirectionId = number;
export const DirectionId = z.literal(0).or(z.literal(1));

// Not a TypeScript enum since those cannot have overloaded keys.
export const Direction = {
  Southbound: 0,
  Northbound: 1,
  Westbound: 0,
  Eastbound: 1,
};

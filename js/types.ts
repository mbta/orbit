import { z } from "zod";

export const HeavyRailLine = z.enum(["blue", "orange", "red", "none"]);
export type HeavyRailLine = z.infer<typeof HeavyRailLine>;

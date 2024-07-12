import { z } from "zod";

export const Employee = z.object({
  first_name: z.string(),
  preferred_first: z.string().optional(),
  last_name: z.string(),
  badge: z.string(),
  badge_serials: z.array(z.string()),
});

export type Employee = z.infer<typeof Employee>;

export const EmployeeList = z.array(Employee);
export type EmployeeList = z.infer<typeof EmployeeList>;

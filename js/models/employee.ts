import { z } from "zod";

export const Employee = z.object({
  first_name: z.string(),
  preferred_first: z.string().optional(),
  last_name: z.string(),
  badge: z.string(),
  badge_serials: z.array(z.string()),
});

export const displayName = (emp: Employee) => {
  return `${emp.preferred_first ?? emp.first_name} ${emp.last_name}`;
};

export const fallbackDisplayName = (badge: string) => {
  return `Operator #${badge}`;
};

export type Employee = z.infer<typeof Employee>;

export const EmployeeList = z.array(Employee);
export type EmployeeList = z.infer<typeof EmployeeList>;

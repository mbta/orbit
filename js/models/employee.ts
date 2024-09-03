import { z } from "zod";

export const Employee = z.object({
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  badge: z.string(),
});

export const displayName = (emp: Employee): string | null => {
  if (emp.first_name && emp.last_name) {
    return `${emp.first_name} ${emp.last_name}`;
  } else if (emp.first_name) {
    return emp.first_name;
  } else if (emp.last_name) {
    return emp.last_name;
  } else {
    return null;
  }
};

export const fallbackDisplayName = (badge: string): string => {
  return `Operator #${badge}`;
};

export type Employee = z.infer<typeof Employee>;

export const EmployeeList = z.array(Employee);
export type EmployeeList = z.infer<typeof EmployeeList>;

import { get, useApiResult } from "../api";
import {
  displayName,
  Employee,
  EmployeeList,
  fallbackDisplayName,
} from "../models/employee";
import { z } from "zod";

const EMPLOYEES_API_PATH = "/api/employees";

const parse = (list: EmployeeList) =>
  list.map((emp: Employee) => ({
    ...emp,
  }));

export const useEmployees = () => {
  return useApiResult({
    RawData: EmployeeList,
    url: EMPLOYEES_API_PATH,
    parser: parse,
  });
};

export const lookupDisplayName = (badge: string, employees: Employee[]) => {
  const employee = findEmployeeByBadge(employees, badge);
  if (employee === undefined) {
    return fallbackDisplayName(badge);
  }

  return displayName(employee);
};

export const findEmployeeByBadge = (employees: Employee[], badge: string) => {
  return employees.find((employee) => employee.badge === badge);
};

/**
 * Promise will throw on 404 Not Found errors (in addition to other HTTP errors)
 */
export const fetchEmployeeByBadgeSerial = (
  badgeSerial: string,
): Promise<string> => {
  return get({
    RawData: z.string(),
    url: `api/rfid?badge_serial=${badgeSerial}`,
    parser: (s: string) => s,
  });
};

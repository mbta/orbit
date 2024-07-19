import { useApiResult } from "../api";
import { Employee, EmployeeList } from "../models/employee";

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

export const findEmployeeByBadge = (employees: Employee[], badge: string) => {
  return employees.find((employee) => employee.badge === badge);
};

export const findEmployeeByBadgeSerial = (
  employees: Employee[],
  badgeSerial: string,
) => {
  return employees.find((employee) =>
    employee.badge_serials.includes(badgeSerial),
  );
};

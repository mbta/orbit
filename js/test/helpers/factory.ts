import { Certification, CertificationData } from "../../models/certification";
import { Employee } from "../../models/employee";
import { Factory } from "fishery";
import { DateTime } from "luxon";

export const employeeFactory = Factory.define<Employee>(({ sequence }) => ({
  first_name: "Preferredy",
  last_name: "Lasty",
  badge: sequence.toString(),
}));

export const certificationDataFactory = Factory.define<CertificationData>(
  () => ({
    type: "rail",
    expires: "2023-12-12",
    rail_line: "blue",
  }),
);
export const certificationFactory = Factory.define<Certification>(() => ({
  type: "rail",
  expires: DateTime.fromISO("2023-12-12", { zone: "America/New_York" }),
  rail_line: "blue",
}));

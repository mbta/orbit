import { Employee } from "../../models/employee";
import { Factory } from "fishery";

export const employeeFactory = Factory.define<Employee>(({ sequence }) => ({
  first_name: "Firsty",
  preferred_first: "Preferredy",
  last_name: "Lasty",
  badge: sequence.toString(),
}));

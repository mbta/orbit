import { back } from "../../browser";
import { findEmployeeByBadge, useEmployees } from "../../hooks/useEmployees";
import { useSignins } from "../../hooks/useSignIns";
import { fullName } from "../../models/employee";
import { DateTime } from "luxon";
import { ReactElement } from "react";

export const List = ({ line }: { line: string }): ReactElement => {
  const employees = useEmployees();
  const signIns = useSignins(line);

  if (signIns.status === "loading" || employees.status === "loading") {
    return <>Loading...</>;
  } else if (signIns.status === "error") {
    return <>Error retrieving signins: {signIns.error}</>;
  } else if (employees.status === "error") {
    return <>Error retrieving employees: {employees.error}</>;
  }

  return (
    <div className="m-2">
      <button
        className="bg-mbta-blue text-gray-100 rounded-md p-2 text-sm m-5"
        onClick={() => {
          back();
        }}
      >
        Back
      </button>
      <u>Today&apos;s sign-ins</u>
      <table>
        <thead>
          <tr>
            <th className="border">Name</th>
            <th className="border">Badge</th>
            <th className="border">Time</th>
            <th className="border">Official</th>
          </tr>
        </thead>
        <tbody>
          {signIns.result.map((si, idx) => (
            <tr key={idx}>
              <td className="border">
                {fullName(
                  findEmployeeByBadge(
                    employees.result,
                    si.signed_in_employee,
                  ) ?? null,
                )}
              </td>
              <td className="border">{si.signed_in_employee}</td>
              <td className="border">
                {si.signed_in_at.toLocaleString(DateTime.TIME_SIMPLE)}
              </td>
              <td className="border">{si.signed_in_by_user}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
